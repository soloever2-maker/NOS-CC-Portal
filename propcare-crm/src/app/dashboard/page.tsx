"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Users, CheckCircle2, Clock, AlertCircle, Building2, ArrowUpRight, ArrowRight } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Stats {
  totalTickets: number;
  openTickets: number;
  inProgress: number;
  resolvedToday: number;
  totalClients: number;
  totalProperties: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance", COMPLAINT: "Complaint", INQUIRY: "Inquiry",
  PAYMENT: "Payment", LEASE: "Lease", HANDOVER: "Handover", OTHER: "Other",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(j => { if (j.success) setStats(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const KPI_CARDS = [
    { label: "Total Tickets", value: stats?.totalTickets ?? 0, icon: Ticket, color: "var(--gold-500)", bg: "var(--gold-glow)" },
    { label: "Open Tickets", value: stats?.openTickets ?? 0, icon: AlertCircle, color: "var(--danger)", bg: "rgba(239,68,68,0.1)" },
    { label: "In Progress", value: stats?.inProgress ?? 0, icon: Clock, color: "var(--warning)", bg: "rgba(245,158,11,0.1)" },
    { label: "Resolved Today", value: stats?.resolvedToday ?? 0, icon: CheckCircle2, color: "var(--success)", bg: "rgba(34,197,94,0.1)" },
    { label: "Total Clients", value: stats?.totalClients ?? 0, icon: Users, color: "var(--info)", bg: "rgba(59,130,246,0.1)" },
    { label: "Properties", value: stats?.totalProperties ?? 0, icon: Building2, color: "var(--gold-500)", bg: "var(--gold-glow)" },
  ];

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Dashboard" subtitle={`Good morning — ${today}`} notificationCount={0} />

      <div className="flex-1 p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {KPI_CARDS.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              {loading ? (
                <div className="skeleton h-7 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold leading-none mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                  {s.value}
                </p>
              )}
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions + Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>QUICK ACTIONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "New Ticket", href: "/dashboard/tickets/new", desc: "Open a customer support ticket" },
                { label: "New Client", href: "/dashboard/clients/new", desc: "Add a new client to the database" },
                { label: "New Property", href: "/dashboard/properties/new", desc: "Register a new property" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <div className="flex items-center justify-between p-3 rounded-[8px] transition-all group cursor-pointer"
                    style={{ background: "var(--black-700)", border: "0.5px solid var(--border)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLDivElement).style.background = "var(--gold-glow)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.background = "var(--black-700)"; }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--gold-400)" }}>{a.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{a.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Tickets by Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKETS BY STATUS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)
              ) : Object.keys(stats?.byStatus ?? {}).length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No tickets yet</p>
              ) : Object.entries(stats?.byStatus ?? {}).map(([status, count]) => {
                const total = stats?.totalTickets ?? 1;
                const pct = Math.round((count / total) * 100);
                const colors: Record<string, string> = { OPEN: "var(--info)", IN_PROGRESS: "var(--warning)", PENDING_CLIENT: "var(--warning)", RESOLVED: "var(--success)", CLOSED: "var(--text-muted)" };
                const labels: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In Progress", PENDING_CLIENT: "Pending", RESOLVED: "Resolved", CLOSED: "Closed" };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: colors[status] ?? "var(--text-muted)" }} />
                    <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{labels[status] ?? status}</span>
                    <div className="h-1.5 rounded-full w-16" style={{ background: "var(--black-600)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[status] ?? "var(--text-muted)" }} />
                    </div>
                    <span className="text-sm font-semibold w-6 text-right" style={{ color: "var(--text-primary)" }}>{count}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Tickets by Category */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKETS BY CATEGORY</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                [...Array(5)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)
              ) : Object.keys(stats?.byCategory ?? {}).length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No tickets yet</p>
              ) : Object.entries(stats?.byCategory ?? {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([cat, count]) => {
                  const total = stats?.totalTickets ?? 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={cat} className="flex items-center justify-between gap-2">
                      <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                      <div className="h-1 rounded-full flex-1 max-w-[80px]" style={{ background: `linear-gradient(90deg, var(--gold-500) ${pct}%, var(--black-600) ${pct}%)` }} />
                      <span className="text-xs font-medium w-6 text-right" style={{ color: "var(--text-muted)" }}>{pct}%</span>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <RecentTicketsWidget />
      </div>
    </div>
  );
}

// ── Recent Tickets Widget ─────────────────────────────────────

interface RecentTicket {
  id: string; code: string; title: string; status: string; priority: string;
  project?: string; client: { name: string } | null; created_at: string;
}

function RecentTicketsWidget() {
  const [tickets, setTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tickets?limit=5")
      .then(r => r.json())
      .then(j => { if (j.success) setTickets((j.data ?? []).slice(0, 6)); })
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLOR: Record<string, string> = {
    OPEN: "var(--info)", IN_PROGRESS: "var(--warning)", PENDING_CLIENT: "var(--warning)",
    RESOLVED: "var(--success)", CLOSED: "var(--text-muted)",
  };
  const STATUS_LABEL: Record<string, string> = {
    OPEN: "Open", IN_PROGRESS: "In Progress", PENDING_CLIENT: "Pending",
    RESOLVED: "Resolved", CLOSED: "Closed",
  };
  const PRIORITY_COLOR: Record<string, string> = {
    LOW: "var(--text-muted)", MEDIUM: "var(--info)", HIGH: "var(--warning)", URGENT: "var(--danger)",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>RECENT TICKETS</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link href="/dashboard/tickets">View all <ArrowRight className="w-3 h-3" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tickets yet</p>
            <Link href="/dashboard/tickets/new">
              <Button variant="secondary" size="sm" className="mt-3">Create first ticket</Button>
            </Link>
          </div>
        ) : (
          <table className="crm-table">
            <thead>
              <tr><th>Ticket</th><th>Project</th><th>Client</th><th>Status</th><th>Priority</th></tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/dashboard/tickets/${t.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors line-clamp-1 block" style={{ color: "var(--text-primary)" }}>{t.title}</Link>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t.code}</p>
                  </td>
                  <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.project ?? "—"}</span></td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.client?.name ?? "—"}</span></td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLOR[t.status]}22`, color: STATUS_COLOR[t.status], border: `1px solid ${STATUS_COLOR[t.status]}44` }}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold" style={{ color: PRIORITY_COLOR[t.priority] ?? "var(--text-muted)" }}>
                      {t.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
