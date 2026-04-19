"use client";

import { useState } from "react";
import { Bell, Ticket, TrendingUp, CheckCircle, AtSign, Settings, Trash2, CheckCheck } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "TICKET_ASSIGNED", title: "Ticket assigned to you", message: "TKT-A1B2C — AC unit not working in Unit 4B has been assigned to you.", link: "/dashboard/tickets/1", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5) },
  { id: "2", type: "TICKET_UPDATED", title: "Ticket updated", message: "TKT-D3E4F status changed to In Progress by Omar Al-Rashid.", link: "/dashboard/tickets/2", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 18) },
  { id: "3", type: "LEAD_ASSIGNED", title: "New lead assigned", message: "LDK-003 — Investment Portfolio has been assigned to you.", link: "/dashboard/leads/3", isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 34) },
  { id: "4", type: "TICKET_RESOLVED", title: "Ticket resolved", message: "TKT-M9N0O — Lease renewal documentation has been resolved.", link: "/dashboard/tickets/5", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 90) },
  { id: "5", type: "MENTION", title: "You were mentioned", message: "Sarah Mitchell mentioned you in a comment on TKT-G5H6I.", link: "/dashboard/tickets/3", isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 180) },
  { id: "6", type: "SYSTEM", title: "System maintenance", message: "Scheduled maintenance on Sunday 2AM–4AM GST. No downtime expected.", link: null, isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
];

const TYPE_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  TICKET_ASSIGNED: { icon: Ticket, color: "var(--gold-500)", bg: "var(--gold-glow)" },
  TICKET_UPDATED: { icon: Ticket, color: "var(--info)", bg: "rgba(59,130,246,0.1)" },
  TICKET_RESOLVED: { icon: CheckCircle, color: "var(--success)", bg: "rgba(34,197,94,0.1)" },
  LEAD_ASSIGNED: { icon: TrendingUp, color: "var(--warning)", bg: "rgba(245,158,11,0.1)" },
  MENTION: { icon: AtSign, color: "var(--info)", bg: "rgba(59,130,246,0.1)" },
  SYSTEM: { icon: Settings, color: "var(--text-muted)", bg: "var(--black-600)" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const deleteNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 max-w-2xl">
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-muted)" }}>No notifications</p>
            </div>
          ) : notifications.map((n) => {
            const { icon: Icon, color, bg } = TYPE_ICON[n.type] ?? TYPE_ICON["SYSTEM"]!;
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 p-4 rounded-[12px] transition-all group cursor-pointer"
                style={{
                  background: n.isRead ? "var(--black-800)" : "rgba(201,168,76,0.05)",
                  border: `0.5px solid ${n.isRead ? "var(--border)" : "var(--border-strong)"}`,
                }}
                onClick={() => markRead(n.id)}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full" style={{ background: "var(--gold-500)" }} />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
