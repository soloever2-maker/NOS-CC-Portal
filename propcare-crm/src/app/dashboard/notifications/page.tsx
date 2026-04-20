"use client";

import { useState, useEffect } from "react";
import { Bell, Ticket, TrendingUp, CheckCircle, AtSign, Settings, Trash2, CheckCheck } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";

interface Notification {
  id: string; type: string; title: string; message: string;
  link?: string | null; is_read: boolean; created_at: string;
}

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TICKET_ASSIGNED:  { icon: Ticket,       color: "var(--gold-500)",  bg: "var(--gold-glow)" },
  TICKET_UPDATED:   { icon: Ticket,       color: "var(--info)",      bg: "rgba(59,130,246,0.1)" },
  TICKET_RESOLVED:  { icon: CheckCircle,  color: "var(--success)",   bg: "rgba(34,197,94,0.1)" },
  LEAD_ASSIGNED:    { icon: TrendingUp,   color: "var(--warning)",   bg: "rgba(245,158,11,0.1)" },
  MENTION:          { icon: AtSign,       color: "var(--info)",      bg: "rgba(59,130,246,0.1)" },
  SYSTEM:           { icon: Settings,     color: "var(--text-muted)", bg: "var(--black-600)" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("users").select("id").eq("supabase_id", user.id).single()
        .then(({ data: profile }) => {
          if (!profile) return;
          supabase.from("notifications").select("*").eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .then(({ data }) => { setNotifications(data ?? []); setLoading(false); });
        });
    });
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={unreadCount > 0 ? (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
        ) : undefined}
      />
      <div className="flex-1 p-6 max-w-2xl">
        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 w-full rounded-[12px]" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--gold-500)" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No notifications</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const { icon: Icon, color, bg } = TYPE_ICON[n.type] ?? TYPE_ICON["SYSTEM"]!;
              return (
                <div key={n.id} className="flex items-start gap-3 p-4 rounded-[12px] transition-all group"
                  style={{ background: n.is_read ? "var(--black-800)" : "rgba(201,168,76,0.05)", border: `0.5px solid ${n.is_read ? "var(--border)" : "var(--border-strong)"}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {!n.is_read && <div className="w-2 h-2 rounded-full" style={{ background: "var(--gold-500)" }} />}
                        <button onClick={() => deleteNotif(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(n.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
