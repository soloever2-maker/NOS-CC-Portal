"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Ticket, Users, Building2, CheckCircle, Clock, AlertCircle, Plus, ArrowRight, ShieldCheck, ShieldAlert, ShieldX, Calendar } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, type TicketStatus, type TicketPriority } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface SLAStats { within: number; atRisk: number; overdue: number; complianceRate: number | null; resolvedWithinSLA: number; resolvedBreached: number; }
interface Stats {
  totalTickets: number; openTickets: number; inProgress: number;
  pendingClient: number; resolvedCount: number; closedCount: number;
  totalClients: number;
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

// ── Date range presets ────────────────────────────────────────────────────
type RangeKey = "today" | "week" | "month" | "quarter" | "all";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today",   label: "Today"       },
  { key: "week",    label: "This Week"   },
  { key: "month",   label: "This Month"  },
  { key: "quarter", label: "Last 3M"     },
  { key: "all",     label: "All Time"    },
];

function getDateRange(key: RangeKey): { from: string | null; to: string | null; label: string } {
  const now  = new Date();
  const to   = now.toISOString();

  if (key === "all") return { from: null, to: null, label: "All Time" };

  if (key === "today") {
    const from = new Date(now); from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to, label: now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) };
  }
  if (key === "week") {
    const from = new Date(now); from.setDate(now.getDate() - 7);
    return { from: from.toISOString(), to, label: "Last 7 Days" };
  }
  if (key === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: from.toISOString(), to, label: now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) };
  }
  if (key === "quarter") {
    const from = new Date(now); from.setMonth(now.getMonth() - 3);
    return { from: from.toISOString(), to, label: "Last 3 Months" };
  }
  return { from: null, to: null, label: "All Time" };
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [recent,  setRecent]  = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [range,   setRange]   = useState<RangeKey>("month");

  // Fetch user role once
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("role").eq("supabase_id", user.id).single();
      if (profile) setIsAdmin(["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(profile.role));
    });
  }, []);

  // Fetch stats whenever range changes
  const fetchStats = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(range);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to)   params.set("to",   to);

    const [statsRes, ticketsRes] = await Promise.all([
      fetch(`/api/stats?${params}`).then(r => r.json()),
      fetch("/api/tickets").then(r => r.json()),
    ]);
    if (statsRes.success)   setStats(statsRes.data);
    if (ticketsRes.success) setRecent((ticketsRes.data ?? []).slice(0, 6));
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const sla      = stats?.sla;
  const slaTotal = (sla?.within ?? 0) + (sla?.atRisk ?? 0) + (sla?.overdue ?? 0);
  const { label: periodLabel } = getDateRange(range);

  const statCards = [
    { label: "Open",           value: stats?.openTickets   ?? 0, icon: AlertCircle, color: "var(--danger)"      },
    { label: "In Progress",    value: stats?.inProgress    ?? 0, icon: Clock,       color: "var(--warning)"     },
    { label: "Pending Client", value: stats?.pendingClient ?? 0, icon: Clock,       color: "var(--info)"        },
    { label: "Resolved",       value: stats?.resolvedCount ?? 0, icon: CheckCircle, color: "var(--success)"     },
    { label: "Closed",         value: stats?.closedCount   ?? 0, icon: CheckCircle, color: "var(--text-muted)"  },
    { label: "Clients",        value: stats?.totalClients  ?? 0, icon: Users,       color: "var(--gold-500)"    },
  ];

  const categoryData = Object.entries(stats?.byCategory ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalCat     = categoryData.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={<Button size="sm" asChild><Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5" /> New Ticket</Link></Button>}
      />

      <div className="flex-1 p-5 space-y-5">

        {/* ── Date Range Filter ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.15s",
                borderColor: range === r.key ? "var(--gold-500)" : "var(--border)",
                background:  range === r.key ? "var(--gold-glow)" : "transparent",
                color:       range === r.key ? "var(--gold-500)"  : "var(--text-muted)",
              }}
            >
              {r.label}
            </button>
          ))}
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>
            — showing: <strong style={{ color: "var(--text-secondary)" }}>{periodLabel}</strong>
          </span>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: s.color }}>
                {loading ? "—" : s.value}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{s.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{periodLabel}</p>
            </div>
          ))}
        </div>

        {/* ── SLA Overview ── */}
        <div className="rounded-[14px] p-5" style={{ background: "var(--black-800)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: "var(--gold-500)" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>SLA Overview</h2>
              {sla?.complianceRate !== null && sla?.complianceRate !== undefined && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full ml-1"
                  style={{
                    background: sla.complianceRate >= 80 ? "rgba(34,197,94,0.12)" : sla.complianceRate >= 60 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                    color: sla.complianceRate >= 80 ? "var(--success)" : sla.complianceRate >= 60 ? "var(--warning)" : "var(--danger)"
                  }}>
                  {sla.complianceRate}% compliance — {periodLabel}
                </span>
              )}
            </div>
            {isAdmin && (
              <Link href="/dashboard/sla" className="text-xs" style={{ color: "var(--gold-500)" }}>
                Manage SLA →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <ShieldCheck className="w-8 h-8 shrink-0" style={{ color: "var(--success)" }} />
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--success)" }}>{loading ? "—" : sla?.within ?? 0}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--success)" }}>Within SLA</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>active tickets on track</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)" }}>
              <ShieldAlert className="w-8 h-8 shrink-0" style={{ color: "var(--warning)" }} />
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--warning)" }}>{loading ? "—" : sla?.atRisk ?? 0}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--warning)" }}>At Risk</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>75%+ of SLA used</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-[10px]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <ShieldX className="w-8 h-8 shrink-0" style={{ color: "var(--danger)" }} />
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--danger)" }}>{loading ? "—" : sla?.overdue ?? 0}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--danger)" }}>SLA Breached</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>active — exceeded limit</p>
              </div>
            </div>
          </div>

          {slaTotal > 0 && (
            <div>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                <div style={{ width: `${Math.round((sla!.within  / slaTotal) * 100)}%`, background: "var(--success)", opacity: 0.85 }} />
                <div style={{ width: `${Math.round((sla!.atRisk  / slaTotal) * 100)}%`, background: "var(--warning)", opacity: 0.85 }} />
                <div style={{ width: `${Math.round((sla!.overdue / slaTotal) * 100)}%`, background: "var(--danger)",  opacity: 0.85 }} />
              </div>
              <div className="flex items-center gap-4 mt-2">
                {[{ label: "Within", color: "var(--success)" }, { label: "At risk", color: "var(--warning)" }, { label: "Overdue", color: "var(--danger)" }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{l.label}</span>
                  </div>
                ))}
                {sla && sla.resolvedWithinSLA + sla.resolvedBreached > 0 && (
                  <span className="text-[11px] ml-auto" style={{ color: "var(--text-muted)" }}>
                    {periodLabel}: {sla.resolvedWithinSLA} resolved within SLA, {sla.resolvedBreached} breached
                  </span>
                )}
              </div>
            </div>
          )}
          {slaTotal === 0 && !loading && (
            <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
              No active tickets with SLA rules
              {isAdmin && <> — <Link href="/dashboard/sla" style={{ color: "var(--gold-500)" }}>set up SLA rules</Link></>}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Recent Tickets ── */}
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

          {/* ── Right: Category + Quick Actions ── */}
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
                  { href: "/dashboard/tickets/new", label: "New Ticket",   icon: Ticket    },
                  { href: "/dashboard/clients/new", label: "Add Client",   icon: Users     },
                  { href: "/dashboard/properties/new", label: "Add Property", icon: Building2 },
                  ...(isAdmin ? [{ href: "/dashboard/sla", label: "SLA Settings", icon: ShieldCheck }] : []),
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
