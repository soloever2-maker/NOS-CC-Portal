"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Ticket, CheckCircle, AtSign, Settings, X, Bell } from "lucide-react";

interface NotificationCtx {
  unreadCount: number;
  refresh: () => void;
}

interface ToastItem {
  id:      string;
  type:    string;
  title:   string;
  message: string;
  link?:   string | null;
}

const Ctx = createContext<NotificationCtx>({ unreadCount: 0, refresh: () => {} });

function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const play = (freq: number, start: number, dur: number, gain: number) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.connect(vol); vol.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      vol.gain.setValueAtTime(0, start);
      vol.gain.linearRampToValueAtTime(gain, start + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start); osc.stop(start + dur);
    };
    play(880, ctx.currentTime, 0.6, 0.3);
    play(660, ctx.currentTime + 0.18, 0.8, 0.2);
  } catch { /* silent */ }
}

const TYPE_COLOR: Record<string, string> = {
  TICKET_ASSIGNED: "#C9A84C",
  TICKET_UPDATED:  "#3B82F6",
  TICKET_RESOLVED: "#22C55E",
  MENTION:         "#3B82F6",
  SYSTEM:          "#6B7280",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  TICKET_ASSIGNED: Ticket,
  TICKET_UPDATED:  Ticket,
  TICKET_RESOLVED: CheckCircle,
  MENTION:         AtSign,
  SYSTEM:          Settings,
};

function NotifToast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const color = TYPE_COLOR[item.type] ?? "#C9A84C";
  const Icon  = TYPE_ICON[item.type]  ?? Bell;

  return (
    <div
      onClick={() => { if (item.link) window.location.href = item.link; }}
      style={{
        display:        "flex",
        alignItems:     "flex-start",
        gap:            "12px",
        padding:        "14px 12px 14px 14px",
        borderRadius:   "14px",
        border:         `1px solid ${color}33`,
        background:     "#181510",
        boxShadow:      "0 8px 32px rgba(0,0,0,0.6)",
        width:          "320px",
        cursor:         item.link ? "pointer" : "default",
        animation:      "nosSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        position:       "relative",
        borderLeft:     `4px solid ${color}`,
      }}
    >
      {/* Icon */}
      <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `${color}22`, flexShrink: 0 }}>
        <Icon style={{ width: 16, height: 16, color }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#F5EFD8", marginBottom: 3 }}>
          {item.title}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#9E9372", lineHeight: 1.4 }}>
          {item.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#6B6347" }}
      >
        <X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [toasts,      setToasts]      = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

  const fetchCount = useCallback(async (uid: string) => {
    const sb = createClient();
    const { count } = await sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", uid).eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await sb.from("users").select("id").eq("supabase_id", user.id).single();
      if (!profile) return;
      setUserId(profile.id);
      await fetchCount(profile.id);

      const channel = sb
        .channel(`notif:${profile.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` }, (payload) => {
          playDing();
          fetchCount(profile.id);
          const n = payload.new as { id: string; type: string; title: string; message: string; link?: string };
          setToasts(p => [...p, { id: n.id, type: n.type, title: n.title, message: n.message, link: n.link }]);
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` }, () => {
          fetchCount(profile.id);
        })
        .subscribe();

      return () => { sb.removeChannel(channel); };
    });
  }, [fetchCount]);

  const refresh = useCallback(() => { if (userId) fetchCount(userId); }, [userId, fetchCount]);

  return (
    <Ctx.Provider value={{ unreadCount, refresh }}>
      <style>{`@keyframes nosSlideIn { from { opacity:0; transform:translateX(110%) } to { opacity:1; transform:translateX(0) } }`}</style>
      {children}
      {/* Toast container */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column-reverse", gap: 10, zIndex: 9999 }}>
        {toasts.map(t => <NotifToast key={t.id} item={t} onClose={() => dismiss(t.id)} />)}
      </div>
    </Ctx.Provider>
  );
}

export const useNotifications = () => useContext(Ctx);
