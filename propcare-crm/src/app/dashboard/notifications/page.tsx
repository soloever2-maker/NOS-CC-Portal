"use client";

import { useState, useEffect } from "react";
import { Bell, Ticket, CheckCircle, AtSign, Settings, Trash2, CheckCheck } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/lib/notification-context";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string; type: string; title: string; message: string;
  link?: string | null; is_read: boolean; created_at: string;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TICKET_ASSIGNED: { icon: Ticket,      color: "var(--gold-500)",  bg: "var(--gold-glow)"            },
  TICKET_UPDATED:  { icon: Ticket,      color: "var(--info)",      bg: "rgba(59,130,246,0.1)"        },
  TICKET_RESOLVED: { icon: CheckCircle, color: "var(--success)",   bg: "rgba(34,197,94,0.1)"         },
  MENTION:         { icon: AtSign,      color: "var(--info)",      bg: "rgba(59,130,246,0.1)"        },
  SYSTEM:          { icon: Settings,    color: "var(--text-muted)", bg: "var(--black-600)"            },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState<string | null>(null);
  const { refresh } = useNotifications();

  // ── Load + subscribe ────────────────────────────────
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const { data: profile } = await sb.from("users").select("id").eq("supabase_id", user.id).single();
      if (!profile) { setLoading(false); return; }
      setUserId(profile.id);

      // Initial load
      const { data } = await sb.from("notifications").select("*")
        .eq("user_id", profile.id).order("created_at", { ascending: false });
      setNotifications(data ?? []);
      setLoading(false);

      // Mark all as read when page opens
      await sb.from("notifications").update({ is_read: true })
        .eq("user_id", profile.id).eq("is_read", false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      refresh();

      // Real-time subscription
      const channel = sb
        .channel(`notif-page:${profile.id}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        }, payload => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        })
        .subscribe();

      return () => { sb.removeChannel(channel); };
    });
  }, [refresh]);

  const deleteNotif = async (id: string) => {
    await createClient().from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Notifications" subtitle={unread > 0 ? `${unread} unread` : "All caught up"} />
      <div className="flex-1 p-6 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--gold-500)" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No notifications</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const cfg = TYPE_ICON[n.type] ?? TYPE_ICON["SYSTEM"]!;
              const Icon = cfg.icon;
              const inner = (
                <div key={n.id} className="flex items-start gap-3 p-4 rounded-[12px] group"
                  style={{ background: n.is_read ? "var(--black-800)" : "rgba(201,168,76,0.05)", border: `0.5px solid ${n.is_read ? "var(--border)" : "var(--border-strong)"}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.is_read && <div className="w-2 h-2 rounded-full" style={{ background: "var(--gold-500)" }} />}
                        <button onClick={e => { e.preventDefault(); deleteNotif(n.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              );
              return n.link
                ? <Link key={n.id} href={n.link}>{inner}</Link>
                : <div key={n.id}>{inner}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
