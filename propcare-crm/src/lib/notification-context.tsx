"use client";

// src/lib/notification-context.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Provides:
//   - unreadCount  — live badge count for the bell icon
//   - refresh()    — manual re-fetch (called after marking all read)
//   - Toast popup  — slide-in card when a new notification arrives in real-time
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
} from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { Bell, Ticket, CheckCircle, AtSign, Settings, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Context ───────────────────────────────────────────────────────────────────
const Ctx = createContext<NotificationCtx>({ unreadCount: 0, refresh: () => {} });

// ── Icon map (mirrors notifications page) ────────────────────────────────────
const TYPE_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  TICKET_ASSIGNED: { icon: Ticket,      color: "var(--gold-500)"  },
  TICKET_UPDATED:  { icon: Ticket,      color: "var(--info)"      },
  TICKET_RESOLVED: { icon: CheckCircle, color: "var(--success)"   },
  MENTION:         { icon: AtSign,      color: "var(--info)"      },
  SYSTEM:          { icon: Settings,    color: "var(--text-muted)" },
};

// ── Audio ding ────────────────────────────────────────────────────────────────
function playDing() {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const play = (freq: number, start: number, dur: number, gain: number) => {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.connect(vol);
      vol.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      vol.gain.setValueAtTime(0, start);
      vol.gain.linearRampToValueAtTime(gain, start + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur);
    };
    play(880, ctx.currentTime,        0.6, 0.3);
    play(660, ctx.currentTime + 0.18, 0.8, 0.2);
  } catch { /* silent fail */ }
}

// ── Toast popup component ─────────────────────────────────────────────────────
function NotificationToast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const cfg  = TYPE_ICON[item.type] ?? TYPE_ICON["SYSTEM"]!;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (item.link) window.location.href = item.link;
    onClose();
  };

  return (
    <ToastPrimitive.Root
      defaultOpen
      duration={6000}
      onOpenChange={open => { if (!open) onClose(); }}
      className="nos-toast"
      style={{
        position:        "relative",
        display:         "flex",
        alignItems:      "flex-start",
        gap:             "12px",
        padding:         "14px 14px 14px 16px",
        borderRadius:    "14px",
        border:          "1px solid var(--border-strong, #2E2A1E)",
        background:      "var(--black-800, #181510)",
        backdropFilter:  "blur(16px)",
        boxShadow:       "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)",
        width:           "340px",
        cursor:          item.link ? "pointer" : "default",
        animation:       "nosToastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1)",
      }}
      onClick={handleClick}
    >
      {/* Icon */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(201,168,76,0.1)", flexShrink: 0,
      }}>
        <Icon style={{ width: 16, height: 16, color: cfg.color }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <ToastPrimitive.Title style={{
          display: "block", fontSize: "13px", fontWeight: 600,
          color: "var(--text-primary, #F5EFD8)", marginBottom: "3px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {item.title}
        </ToastPrimitive.Title>
        <ToastPrimitive.Description style={{
          fontSize: "12px",
          color: "var(--text-secondary, #9E9372)", lineHeight: 1.4,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        } as React.CSSProperties}>
          {item.message}
        </ToastPrimitive.Description>
      </div>

      {/* Close */}
      <ToastPrimitive.Close asChild>
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          style={{
            flexShrink: 0, width: 20, height: 20, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-muted, #6B6347)",
          }}
        >
          <X style={{ width: 12, height: 12 }} />
        </button>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [toasts,      setToasts]      = useState<ToastItem[]>([]);
  const isFirst = useRef(true);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchCount = useCallback(async (uid: string) => {
    const sb = createClient();
    const { count } = await sb
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, []);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await sb
        .from("users").select("id").eq("supabase_id", user.id).single();
      if (!profile) return;
      setUserId(profile.id);
      await fetchCount(profile.id);

      const channel = sb
        .channel(`notifications:${profile.id}`)
        .on("postgres_changes", {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${profile.id}`,
        }, (payload) => {
          if (isFirst.current) { isFirst.current = false; return; }
          playDing();
          fetchCount(profile.id);

          // Show popup toast
          const n = payload.new as {
            id: string; type: string; title: string; message: string; link?: string;
          };
          setToasts(prev => [...prev, {
            id:      n.id,
            type:    n.type,
            title:   n.title,
            message: n.message,
            link:    n.link,
          }]);
        })
        .on("postgres_changes", {
          event:  "UPDATE",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${profile.id}`,
        }, () => {
          fetchCount(profile.id);
        })
        .subscribe();

      return () => { sb.removeChannel(channel); };
    });
  }, [fetchCount]);

  const refresh = useCallback(() => {
    if (userId) fetchCount(userId);
  }, [userId, fetchCount]);

  return (
    <Ctx.Provider value={{ unreadCount, refresh }}>
      {/* ── Inject keyframe animation once ── */}
      <style>{`
        @keyframes nosToastSlideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
      `}</style>

      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        {/* Render all active toasts */}
        {toasts.map(item => (
          <NotificationToast
            key={item.id}
            item={item}
            onClose={() => dismissToast(item.id)}
          />
        ))}

        {/* Viewport — bottom-right corner, stacks upward */}
        <ToastPrimitive.Viewport style={{
          position:   "fixed",
          bottom:     "24px",
          right:      "24px",
          display:    "flex",
          flexDirection: "column-reverse",
          gap:        "10px",
          zIndex:     9999,
          outline:    "none",
          listStyle:  "none",
          margin:     0,
          padding:    0,
          maxWidth:   "100vw",
        }} />
      </ToastPrimitive.Provider>
    </Ctx.Provider>
  );
}

export const useNotifications = () => useContext(Ctx);
