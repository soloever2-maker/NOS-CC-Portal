"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, Users, Building2, CheckCircle, Clock, AlertCircle, Plus, ArrowRight, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, type TicketStatus, type TicketPriority } from "@/types";

interface SLAStats { within: number; atRisk: number; overdue: number; complianceRate: number | null; resolvedWithinSLA: number; resolvedBreached: number; }
interface Stats {
  totalTickets: number; openTickets: number; inProgress: number;
  resolvedToday: number; totalClients: number; totalProperties: number;
  byStatus: Record<string, number>; byCategory: Record<string, number>;
  sla: SLAStats;
}
interface RecentTicket {
  id: string; code: string; title: string; status: TicketStatus; priority: TicketPriority;
  created_at: string; due_date?: string | null; client: { name: string } | null;
}

const STATUS_BADGE: Record<TicketStatus, BadgeProps["variant"]> = {
  OPEN: "open", IN_PROGRESS: "in-progress", PENDING_CLIENT: "in-progress", RESOLVED: "resolved", CLOSED: "closed",
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};
const CAT_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance", COMPLAINT: "Complaint", INQUIRY: "Inquiry",
  PAYMENT: "Payment", LEASE: "Lease", HANDOVER: "Handover", OTHER: "Other",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/tickets").then(r => r.json()),
    ]).then(([statsRes, ticketsRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (ticketsRes.success) setRecent((ticketsRes.data ?? []).slice(0, 6));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sla = stats?.sla;
  const slaTotal = (sla?.within ?? 0) + (sla?.atRisk ?? 0) + (sla?.overdue ?? 0);

  const statCards = [
    { label: "Total Tickets", value: stats?.totalTickets ?? 0, icon: Ticket, color: "var(--gold-500)" },
    { label: "Open", value: stats?.openTickets ?? 0, icon: AlertCircle, color: "var(--danger)" },
    { label: "In Progress", value: stats?.inProgress ?? 0, icon: Clock, color: "var(--warning)" },
    { label: "Resolved Today", value: stats?.resolvedToday ?? 0, icon: CheckCircle, color: "var(--success)" },
    { label: "Clients", value: stats?.totalClients ?? 0, icon: Users, color: "var(--info)" },
    { label: "Properties", value: stats?.totalProperties ?? 0, icon: Building2, color: "var(--gold-400)" },
  ];

  const categoryData = Object.entries(stats?.byCategory ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalCat = categoryData.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={<Button size="sm" asChild><Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5" /> New Ticket</Link></Button>}
      />

      <div className="flex-1 p-5 space-y-5">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                {loading ? "—" : s.value}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── SLA Overview — prominent section ── */}
        <div className="rounded-[14px] p-5" style={{ background: "var(--black-800)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: "var(--gold-500)" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>SLA Overview</h2>
              {sla?.complianceRate !== null && sla?.complianceRate !== undefined && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full ml-1"
                  style={{ background: sla.complianceRate >= 80 ? "rgba(34,197,94,0.12)" : sla.complianceRate >= 60 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)", color: sla.complianceRate >= 80 ? "var(--success)" : sla.complianceRate >= 60 ? "var(--warning)" : "var(--danger)" }}>
                  {sla.complianceRate}% compliance this month
                </span>
              )}
            </div>
            <Link href="/dashboard/sla" className="text-xs" style={{ color: "var(--gold-500)" }}>
              Manage SLA →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Within SLA */}
            <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <ShieldCheck className="w-8 h-8 shrink-0" style={{ color: "var(--success)" }} />
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--success)" }}>{loading ? "—" : sla?.within ?? 0}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--success)" }}>Within SLA</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>tickets on track</p>
              </div>
            </div>
            {/* At Risk */}
            <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <ShieldAlert className="w-8 h-8 shrink-0" style={{ color: "var(--warning)" }} />
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--warning)" }}>{loading ? "—" : sla?.atRisk ?? 0}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--warning)" }}>At Risk</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>75%+ of SLA used</p>
              </div>
            </div>
            {/* Overdue */}
            <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <ShieldX className="w-8 h-8 shrink-0" style={{ color: "var(--danger)" }} />
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--danger)" }}>{loading ? "—" : sla?.overdue ?? 0}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--danger)" }}>SLA Breached</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>exceeded time limit</p>
              </div>
            </div>
          </div>

          {/* SLA progress bar */}
          {slaTotal > 0 && (
            <div>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                <div className="transition-all" style={{ width: `${Math.round((sla!.within / slaTotal) * 100)}%`, background: "var(--success)", opacity: 0.85 }} />
                <div className="transition-all" style={{ width: `${Math.round((sla!.atRisk / slaTotal) * 100)}%`, background: "var(--warning)", opacity: 0.85 }} />
                <div className="transition-all" style={{ width: `${Math.round((sla!.overdue / slaTotal) * 100)}%`, background: "var(--danger)", opacity: 0.85 }} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: "Within", color: "var(--success)" },
                  { label: "At risk", color: "var(--warning)" },
                  { label: "Overdue", color: "var(--danger)" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{l.label}</span>
                  </div>
                ))}
                {sla && sla.resolvedWithinSLA + sla.resolvedBreached > 0 && (
                  <span className="text-[11px] ml-auto" style={{ color: "var(--text-muted)" }}>
                    This month: {sla.resolvedWithinSLA} resolved within SLA, {sla.resolvedBreached} breached
                  </span>
                )}
              </div>
            </div>
          )}
          {slaTotal === 0 && !loading && (
            <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
              No active tickets with SLA rules — <Link href="/dashboard/sla" style={{ color: "var(--gold-500)" }}>set up SLA rules</Link>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Recent Tickets */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>RECENT TICKETS</CardTitle>
                  <Link href="/dashboard/tickets" className="flex items-center gap-1 text-xs" style={{ color: "var(--gold-500)" }}>View all <ArrowRight className="w-3 h-3" /></Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
                ) : recent.length === 0 ? (
                  <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tickets yet</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {recent.map(t => {
                      const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !["RESOLVED","CLOSED"].includes(t.status);
                      return (
                        <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--gold-glow)]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{t.code}</span>
                              {isOverdue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>OVERDUE</span>}
                            </div>
                            <p className="text-sm font-medium truncate mt-0.5" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {t.client?.name ?? "No client"} · {formatRelativeTime(t.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={PRIORITY_BADGE[t.priority]}>{TICKET_PRIORITY_LABELS[t.priority]}</Badge>
                            <Badge variant={STATUS_BADGE[t.status]}>{TICKET_STATUS_LABELS[t.status]}</Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Category + Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>BY CATEGORY</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {loading ? (
                  <div className="flex justify-center py-4"><div className="w-4 h-4 border border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
                ) : categoryData.length === 0 ? (
                  <p className="text-sm text-center py-2" style={{ color: "var(--text-muted)" }}>No data</p>
                ) : categoryData.map(([cat, count]) => {
                  const pct = totalCat > 0 ? Math.round((count / totalCat) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--text-secondary)" }}>{CAT_LABELS[cat] ?? cat}</span>
                        <span style={{ color: "var(--text-muted)" }}>{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "var(--black-600)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gold-500)" }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  { href: "/dashboard/tickets/new", label: "New Ticket", icon: Ticket },
                  { href: "/dashboard/clients/new", label: "Add Client", icon: Users },
                  { href: "/dashboard/properties/new", label: "Add Property", icon: Building2 },
                  { href: "/dashboard/sla", label: "SLA Settings", icon: ShieldCheck },
                ].map(a => (
                  <Link key={a.href} href={a.href} className="flex items-center gap-2.5 p-2.5 rounded-[8px] text-sm font-medium transition-all hover:bg-[var(--gold-glow)]" style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    <a.icon className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
                    {a.label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
