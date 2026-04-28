"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Ticket, Users, CheckCircle, Clock, AlertCircle,
  Plus, ArrowRight, ShieldCheck, ShieldAlert, ShieldX, Calendar, TrendingUp, Star,
} from "lucide-react";
import { Topbar }        from "@/components/layout/topbar";
import { Button }        from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS,
  type TicketStatus, type TicketPriority,
} from "@/types";
import { createClient } from "@/lib/supabase/client";

/* ── Types ─────────────────────────────────────────────────── */
interface SLAStats {
  within: number; atRisk: number; overdue: number;
  complianceRate: number | null;
  resolvedWithinSLA: number; resolvedBreached: number;
}
interface Stats {
  totalTickets: number; openTickets: number; inProgress: number;
  pendingClient: number; resolvedCount: number; closedCount: number;
  totalClients: number;
  byCategory: Record<string, number>;
  sla: SLAStats;
  avgResolutionHours: number | null;
}
interface RecentTicket {
  id: string; code: string; title: string;
  status: TicketStatus; priority: TicketPriority;
  created_at: string; due_date?: string | null;
  client: { name: string } | null;
}

const STATUS_BADGE: Record<TicketStatus, BadgeProps["variant"]> = {
  OPEN: "open", IN_PROGRESS: "in-progress", PENDING_CLIENT: "in-progress",
  RESOLVED: "resolved", CLOSED: "closed",
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};
const CAT_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance", COMPLAINT: "Complaint", INQUIRY: "Inquiry",
  PAYMENT: "Payment", LEASE: "Lease", HANDOVER: "Handover", OTHER: "Other",
};

/* ── Date helpers ──────────────────────────────────────────── */
type Preset = "today" | "week" | "month" | "quarter" | "all" | "custom";

function presetRange(p: Preset): { from: string; to: string } {
  const now = new Date();
  const to  = now.toISOString();
  if (p === "today") {
    const f = new Date(now); f.setHours(0,0,0,0);
    return { from: f.toISOString(), to };
  }
  if (p === "week") {
    const f = new Date(now); f.setDate(now.getDate() - 7);
    return { from: f.toISOString(), to };
  }
  if (p === "month") {
    const f = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: f.toISOString(), to };
  }
  if (p === "quarter") {
    const f = new Date(now); f.setMonth(now.getMonth() - 3);
    return { from: f.toISOString(), to };
  }
  return { from: "", to: "" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
}

/* ── Agent Dashboard ────────────────────────────────────────── */
function AgentDashboard({
  stats, recent, loading, agentName, periodLabel,
  preset, setPreset, showCustom, setShowCustom,
  customFrom, setCustomFrom, customTo, setCustomTo, fetchStats,
}: {
  stats: Stats | null; recent: RecentTicket[]; loading: boolean;
  agentName: string; periodLabel: string;
  preset: Preset; setPreset: (p: Preset) => void;
  showCustom: boolean; setShowCustom: (v: boolean) => void;
  customFrom: string; setCustomFrom: (v: string) => void;
  customTo: string; setCustomTo: (v: string) => void;
  fetchStats: () => void;
}) {
  const sla = stats?.sla;
  const total = stats?.totalTickets ?? 0;
  const resolved = (stats?.resolvedCount ?? 0) + (stats?.closedCount ?? 0);
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : null;

  const PRESETS: { key: Preset; label: string }[] = [
    { key: "today",   label: "Today"      },
    { key: "week",    label: "This Week"  },
    { key: "month",   label: "This Month" },
    { key: "quarter", label: "Last 3M"    },
    { key: "all",     label: "All Time"   },
    { key: "custom",  label: "Custom"     },
  ];

  const myCards = [
    { label: "Open",           value: stats?.openTickets   ?? 0, color: "#dc2626", bg: "rgba(220,38,38,0.06)",   border: "rgba(220,38,38,0.18)",   href: "/dashboard/tickets?status=OPEN",           icon: AlertCircle },
    { label: "In Progress",    value: stats?.inProgress    ?? 0, color: "#d97706", bg: "rgba(217,119,6,0.06)",   border: "rgba(217,119,6,0.18)",   href: "/dashboard/tickets?status=IN_PROGRESS",    icon: Clock       },
    { label: "Pending Client", value: stats?.pendingClient ?? 0, color: "#2563eb", bg: "rgba(37,99,235,0.06)",   border: "rgba(37,99,235,0.18)",   href: "/dashboard/tickets?status=PENDING_CLIENT", icon: Clock       },
    { label: "Resolved",       value: stats?.resolvedCount ?? 0, color: "#16a34a", bg: "rgba(22,163,74,0.06)",   border: "rgba(22,163,74,0.18)",   href: "/dashboard/tickets?status=RESOLVED",       icon: CheckCircle },
    { label: "Closed",         value: stats?.closedCount   ?? 0, color: "#6b7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.18)", href: "/dashboard/tickets?status=CLOSED",         icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title={`Welcome, ${agentName.split(" ")[0]} 👋`}
        subtitle={new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        actions={<Button size="sm" asChild><Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5"/>New Ticket</Link></Button>}
      />

      <div className="flex-1 p-5 space-y-5">

        {/* Date Filter */}
        <div className="rounded-[12px] p-4" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4" style={{color:"var(--text-muted)"}}/>
            {PRESETS.map(r => (
              <button key={r.key}
                onClick={() => { setPreset(r.key); setShowCustom(r.key==="custom"); }}
                style={{
                  padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                  border:"1px solid", cursor:"pointer", transition:"all 0.15s",
                  borderColor: preset===r.key ? "var(--gold-500)" : "var(--border)",
                  background:  preset===r.key ? "var(--gold-glow)" : "transparent",
                  color:       preset===r.key ? "var(--gold-500)"  : "var(--text-muted)",
                }}>
                {r.label}
              </button>
            ))}
            <span style={{fontSize:12,color:"var(--text-muted)",marginRight:"auto"}}>
              Showing: <strong style={{color:"var(--text-primary)"}}>{periodLabel}</strong>
            </span>
          </div>
          {showCustom && (
            <div className="flex items-center gap-3 mt-3 pt-3" style={{borderTop:"1px solid var(--border)"}}>
              <div className="flex items-center gap-2">
                <label style={{fontSize:12,color:"var(--text-muted)"}}>From:</label>
                <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}
                  style={{padding:"4px 8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text-primary)",fontSize:13}}/>
              </div>
              <div className="flex items-center gap-2">
                <label style={{fontSize:12,color:"var(--text-muted)"}}>To:</label>
                <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)}
                  style={{padding:"4px 8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text-primary)",fontSize:13}}/>
              </div>
              <button onClick={fetchStats} style={{
                padding:"5px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
                background:"var(--gold-500)",color:"white",border:"none"}}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* My Ticket Stats */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{color:"var(--text-muted)"}}>My Tickets</p>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {myCards.map(c => (
              <Link key={c.label} href={c.href}
                className="rounded-[12px] p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
                style={{background:c.bg, border:`1px solid ${c.border}`, textDecoration:"none"}}>
                <div className="flex items-center justify-between">
                  <c.icon className="w-5 h-5" style={{color:c.color}}/>
                  <ArrowRight className="w-3 h-3" style={{color:c.color, opacity:0.5}}/>
                </div>
                <p className="text-3xl font-bold" style={{fontFamily:"'Playfair Display',serif", color:c.color}}>
                  {loading ? "—" : c.value}
                </p>
                <p className="text-xs font-bold" style={{color:c.color}}>{c.label}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Performance + SLA row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Resolution Rate */}
          <div className="rounded-[14px] p-5 flex flex-col gap-3" style={{background:"var(--black-800)",border:"1px solid var(--border)"}}>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{color:"var(--gold-500)"}}/>
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>Resolution Rate</p>
            </div>
            <p className="text-5xl font-bold" style={{fontFamily:"'Playfair Display',serif", color: resolutionRate !== null && resolutionRate >= 80 ? "#16a34a" : resolutionRate !== null && resolutionRate >= 60 ? "#d97706" : "var(--text-primary)"}}>
              {loading ? "—" : resolutionRate !== null ? `${resolutionRate}%` : "—"}
            </p>
            <p className="text-xs" style={{color:"var(--text-muted)"}}>
              {loading ? "" : `${resolved} resolved out of ${total} tickets`}
            </p>
            {stats?.avgResolutionHours !== null && stats?.avgResolutionHours !== undefined && (
              <p className="text-xs" style={{color:"var(--text-muted)"}}>
                Avg: <strong style={{color:"var(--text-secondary)"}}>{stats.avgResolutionHours}h</strong> per ticket
              </p>
            )}
          </div>

          {/* SLA Compliance */}
          <div className="rounded-[14px] p-5 flex flex-col gap-3" style={{background:"var(--black-800)",border:"1px solid var(--border)"}}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{color:"var(--gold-500)"}}/>
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>SLA Compliance</p>
            </div>
            <p className="text-5xl font-bold" style={{fontFamily:"'Playfair Display',serif", color: (sla?.complianceRate??0)>=80 ? "#16a34a" : (sla?.complianceRate??0)>=60 ? "#d97706" : "#dc2626"}}>
              {loading ? "—" : sla?.complianceRate !== null && sla?.complianceRate !== undefined ? `${sla.complianceRate}%` : "—"}
            </p>
            <p className="text-xs" style={{color:"var(--text-muted)"}}>
              {loading ? "" : `${sla?.resolvedWithinSLA ?? 0} on time · ${sla?.resolvedBreached ?? 0} breached`}
            </p>
          </div>

          {/* Active SLA */}
          <div className="rounded-[14px] p-5 flex flex-col gap-3" style={{background:"var(--black-800)",border:"1px solid var(--border)"}}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" style={{color:"var(--gold-500)"}}/>
              <p className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--text-muted)"}}>Active SLA</p>
            </div>
            <div className="space-y-2">
              {[
                { label:"Within SLA", val: sla?.within ?? 0,  icon: ShieldCheck, color:"#16a34a" },
                { label:"At Risk",    val: sla?.atRisk ?? 0,  icon: ShieldAlert, color:"#d97706" },
                { label:"Breached",   val: sla?.overdue ?? 0, icon: ShieldX,     color:"#dc2626" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <s.icon className="w-3.5 h-3.5" style={{color:s.color}}/>
                    <span className="text-xs" style={{color:"var(--text-secondary)"}}>{s.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{color:s.color}}>{loading ? "—" : s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tickets + By Category */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>MY RECENT TICKETS</CardTitle>
                  <Link href="/dashboard/tickets" className="flex items-center gap-1 text-xs" style={{color:"var(--gold-500)"}}>
                    View all <ArrowRight className="w-3 h-3"/>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin"/></div>
                ) : recent.length === 0 ? (
                  <div className="text-center py-8" style={{color:"var(--text-muted)"}}>
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                    <p className="text-sm">No tickets yet</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{borderColor:"var(--border)"}}>
                    {recent.map(t => {
                      const overdue = t.due_date && new Date(t.due_date)<new Date() && !["RESOLVED","CLOSED"].includes(t.status);
                      return (
                        <Link key={t.id} href={`/dashboard/tickets/${t.id}`}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--gold-glow)]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono" style={{color:"var(--text-muted)"}}>{t.code}</span>
                              {overdue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{background:"rgba(220,38,38,0.12)",color:"#dc2626"}}>OVERDUE</span>}
                            </div>
                            <p className="text-sm font-medium truncate mt-0.5" style={{color:"var(--text-primary)"}}>{t.title}</p>
                            <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>
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

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>MY TICKETS BY CATEGORY</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {loading ? (
                  <div className="flex justify-center py-4"><div className="w-4 h-4 border border-t-[var(--gold-500)] rounded-full animate-spin"/></div>
                ) : Object.entries(stats?.byCategory ?? {}).length === 0 ? (
                  <p className="text-sm text-center py-2" style={{color:"var(--text-muted)"}}>No data</p>
                ) : Object.entries(stats?.byCategory ?? {}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([cat, count]) => {
                  const catTotal = Object.values(stats?.byCategory ?? {}).reduce((s,v)=>s+v,0);
                  const pct = catTotal > 0 ? Math.round((count/catTotal)*100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{color:"var(--text-secondary)"}}>{CAT_LABELS[cat]??cat}</span>
                        <span style={{color:"var(--text-muted)"}}>{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{background:"var(--black-600)"}}>
                        <div className="h-full rounded-full" style={{width:`${pct}%`,background:"var(--gold-500)"}}/>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  { href:"/dashboard/tickets/new", label:"New Ticket", icon:Ticket },
                  { href:"/dashboard/clients/new", label:"Add Client", icon:Users  },
                ].map(a => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-2.5 p-2.5 rounded-[8px] text-sm font-medium transition-all hover:bg-[var(--gold-glow)]"
                    style={{color:"var(--text-secondary)",border:"1px solid var(--border)"}}>
                    <a.icon className="w-4 h-4 shrink-0" style={{color:"var(--gold-500)"}}/>
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

/* ══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [recent,  setRecent]  = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [roleLoaded, setRoleLoaded] = useState(false);

  const [preset,     setPreset]     = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const range = preset === "all"
    ? { from: "", to: "" }
    : preset === "custom"
    ? { from: customFrom, to: customTo }
    : presetRange(preset);

  const periodLabel = preset === "all"     ? "All Time"
    : preset === "today"   ? "Today"
    : preset === "week"    ? "Last 7 Days"
    : preset === "month"   ? new Date().toLocaleDateString("en-GB", { month:"long", year:"numeric" })
    : preset === "quarter" ? "Last 3 Months"
    : customFrom && customTo ? `${fmtDate(customFrom)} — ${fmtDate(customTo)}`
    : "Custom Range";

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: p } = await sb.from("users").select("role, name").eq("supabase_id", user.id).single();
      if (p) {
        setIsAdmin(["ADMIN","SUPER_ADMIN","MANAGER"].includes(p.role));
        setAgentName(p.name ?? "");
      }
      setRoleLoaded(true);
    });
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (range.from) p.set("from", range.from);
    if (range.to)   p.set("to",   range.to);
    const [sr, tr] = await Promise.all([
      fetch(`/api/stats?${p}`).then(r => r.json()),
      fetch("/api/tickets").then(r => r.json()),
    ]);
    if (sr.success) setStats(sr.data);
    if (tr.success) setRecent((tr.data ?? []).slice(0, 6));
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo]);

  useEffect(() => { if (roleLoaded) fetchStats(); }, [fetchStats, roleLoaded]);

  const sla = stats?.sla;
  const PRESETS: { key: Preset; label: string }[] = [
    { key: "today",   label: "Today"      },
    { key: "week",    label: "This Week"  },
    { key: "month",   label: "This Month" },
    { key: "quarter", label: "Last 3M"    },
    { key: "all",     label: "All Time"   },
    { key: "custom",  label: "Custom"     },
  ];

  /* ── Agent View ──────────────────────────────────────────── */
  if (!isAdmin && roleLoaded) {
    return (
      <AgentDashboard
        stats={stats} recent={recent} loading={loading}
        agentName={agentName} periodLabel={periodLabel}
        preset={preset} setPreset={setPreset}
        showCustom={showCustom} setShowCustom={setShowCustom}
        customFrom={customFrom} setCustomFrom={setCustomFrom}
        customTo={customTo} setCustomTo={setCustomTo}
        fetchStats={fetchStats}
      />
    );
  }

  /* ── Admin View (unchanged) ──────────────────────────────── */
  const statusCards = [
    { label: "Open",           value: stats?.openTickets ?? 0,          icon: AlertCircle, color: "#dc2626", bg: "rgba(220,38,38,0.06)",    border: "rgba(220,38,38,0.18)",    href: "/dashboard/tickets?status=OPEN",           hint: "needs action"               },
    { label: "In Progress",    value: stats?.inProgress ?? 0,           icon: Clock,       color: "#d97706", bg: "rgba(217,119,6,0.06)",    border: "rgba(217,119,6,0.18)",    href: "/dashboard/tickets?status=IN_PROGRESS",    hint: "being worked on"            },
    { label: "Pending Client", value: stats?.pendingClient ?? 0,        icon: Clock,       color: "#2563eb", bg: "rgba(37,99,235,0.06)",    border: "rgba(37,99,235,0.18)",    href: "/dashboard/tickets?status=PENDING_CLIENT", hint: "waiting for client response"},
    { label: "Resolved ✅",    value: sla?.resolvedWithinSLA ?? 0,      icon: CheckCircle, color: "#16a34a", bg: "rgba(22,163,74,0.06)",    border: "rgba(22,163,74,0.18)",    href: "/dashboard/tickets?status=RESOLVED",       hint: "resolved within SLA time"   },
    { label: "Resolved ❌",    value: sla?.resolvedBreached ?? 0,       icon: CheckCircle, color: "#dc2626", bg: "rgba(220,38,38,0.06)",    border: "rgba(220,38,38,0.18)",    href: "/dashboard/tickets?status=RESOLVED",       hint: "resolved after SLA deadline" },
    { label: "Closed",         value: stats?.closedCount ?? 0,          icon: CheckCircle, color: "#6b7280", bg: "rgba(107,114,128,0.06)",  border: "rgba(107,114,128,0.18)",  href: "/dashboard/tickets?status=CLOSED",         hint: "permanently closed"         },
  ];

  const catData  = Object.entries(stats?.byCategory ?? {}).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const catTotal = catData.reduce((s,[,v])=>s+v, 0);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        actions={<Button size="sm" asChild><Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5"/>New Ticket</Link></Button>}
      />

      <div className="flex-1 p-5 space-y-5">

        {/* Date Filter */}
        <div className="rounded-[12px] p-4" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4" style={{color:"var(--text-muted)"}}/>
            {PRESETS.map(r => (
              <button key={r.key}
                onClick={() => { setPreset(r.key); setShowCustom(r.key==="custom"); }}
                style={{
                  padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                  border:"1px solid", cursor:"pointer", transition:"all 0.15s",
                  borderColor: preset===r.key ? "var(--gold-500)" : "var(--border)",
                  background:  preset===r.key ? "var(--gold-glow)" : "transparent",
                  color:       preset===r.key ? "var(--gold-500)"  : "var(--text-muted)",
                }}>
                {r.label}
              </button>
            ))}
            <span style={{fontSize:12,color:"var(--text-muted)",marginRight:"auto"}}>
              Showing: <strong style={{color:"var(--text-primary)"}}>{periodLabel}</strong>
            </span>
          </div>
          {showCustom && (
            <div className="flex items-center gap-3 mt-3 pt-3" style={{borderTop:"1px solid var(--border)"}}>
              <div className="flex items-center gap-2">
                <label style={{fontSize:12,color:"var(--text-muted)"}}>From:</label>
                <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)}
                  style={{padding:"4px 8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text-primary)",fontSize:13}}/>
              </div>
              <div className="flex items-center gap-2">
                <label style={{fontSize:12,color:"var(--text-muted)"}}>To:</label>
                <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)}
                  style={{padding:"4px 8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text-primary)",fontSize:13}}/>
              </div>
              <button onClick={fetchStats} style={{
                padding:"5px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
                background:"var(--gold-500)",color:"white",border:"none"}}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {statusCards.map(c => (
            <Link key={c.label} href={c.href}
              className="rounded-[12px] p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
              style={{background:c.bg, border:`1px solid ${c.border}`, textDecoration:"none"}}>
              <div className="flex items-center justify-between">
                <c.icon className="w-5 h-5" style={{color:c.color}}/>
                <ArrowRight className="w-3 h-3" style={{color:c.color, opacity:0.5}}/>
              </div>
              <p className="text-3xl font-bold" style={{fontFamily:"'Playfair Display',serif", color:c.color}}>
                {loading ? "—" : c.value}
              </p>
              <div>
                <p className="text-xs font-bold" style={{color:c.color}}>{c.label}</p>
                <p className="text-[10px] mt-0.5" style={{color:"var(--text-muted)"}}>{c.hint}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* SLA */}
        <div className="rounded-[14px] p-5" style={{background:"var(--black-800)",border:"1px solid var(--border)"}}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{color:"var(--gold-500)"}}/>
              <h2 className="text-sm font-bold" style={{color:"var(--text-primary)"}}>SLA — Active Tickets</h2>
            </div>
            <Link href="/dashboard/sla" className="text-xs" style={{color:"var(--gold-500)"}}>Manage SLA →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label:"Within SLA",   sub:"active & on track",       val: sla?.within  ?? 0, icon: ShieldCheck, color:"#16a34a", bg:"rgba(22,163,74,0.06)",  border:"rgba(22,163,74,0.18)",  href:"/dashboard/tickets?status=OPEN"        },
              { label:"At Risk",      sub:"75%+ of SLA used",        val: sla?.atRisk  ?? 0, icon: ShieldAlert, color:"#d97706", bg:"rgba(217,119,6,0.06)",  border:"rgba(217,119,6,0.18)",  href:"/dashboard/tickets?status=IN_PROGRESS" },
              { label:"SLA Breached", sub:"exceeded time limit",     val: sla?.overdue ?? 0, icon: ShieldX,     color:"#dc2626", bg:"rgba(220,38,38,0.06)",  border:"rgba(220,38,38,0.18)",  href:"/dashboard/tickets"                    },
            ].map(s => (
              <Link key={s.label} href={s.href}
                className="flex items-center gap-3 p-3 rounded-[10px] transition-all hover:scale-[1.01]"
                style={{background:s.bg, border:`1px solid ${s.border}`, textDecoration:"none"}}>
                <s.icon className="w-8 h-8 shrink-0" style={{color:s.color}}/>
                <div>
                  <p className="text-2xl font-bold" style={{fontFamily:"'Playfair Display',serif", color:s.color}}>
                    {loading ? "—" : s.val}
                  </p>
                  <p className="text-xs font-semibold" style={{color:s.color}}>{s.label}</p>
                  <p className="text-[11px]" style={{color:"var(--text-muted)"}}>{s.sub}</p>
                </div>
              </Link>
            ))}
          </div>
          {sla && (sla.resolvedWithinSLA + sla.resolvedBreached) > 0 && (
            <div className="mt-4 pt-4" style={{borderTop:"1px solid var(--border)"}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{color:"var(--text-secondary)"}}>Compliance — {periodLabel}</span>
                <span className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{
                    background: (sla.complianceRate??0)>=80 ? "rgba(22,163,74,0.12)" : (sla.complianceRate??0)>=60 ? "rgba(217,119,6,0.12)" : "rgba(220,38,38,0.12)",
                    color:      (sla.complianceRate??0)>=80 ? "#16a34a"               : (sla.complianceRate??0)>=60 ? "#d97706"               : "#dc2626",
                  }}>
                  {sla.complianceRate ?? 0}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-[8px]" style={{background:"rgba(22,163,74,0.06)",border:"1px solid rgba(22,163,74,0.15)"}}>
                  <CheckCircle className="w-4 h-4" style={{color:"#16a34a"}}/>
                  <div>
                    <p className="text-lg font-bold" style={{color:"#16a34a"}}>{sla.resolvedWithinSLA}</p>
                    <p className="text-[10px]" style={{color:"var(--text-muted)"}}>Resolved on time</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-[8px]" style={{background:"rgba(220,38,38,0.06)",border:"1px solid rgba(220,38,38,0.15)"}}>
                  <ShieldX className="w-4 h-4" style={{color:"#dc2626"}}/>
                  <div>
                    <p className="text-lg font-bold" style={{color:"#dc2626"}}>{sla.resolvedBreached}</p>
                    <p className="text-[10px]" style={{color:"var(--text-muted)"}}>Resolved after deadline</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Tickets + Category */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>RECENT TICKETS</CardTitle>
                  <Link href="/dashboard/tickets" className="flex items-center gap-1 text-xs" style={{color:"var(--gold-500)"}}>
                    View all <ArrowRight className="w-3 h-3"/>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin"/></div>
                ) : recent.length === 0 ? (
                  <div className="text-center py-8" style={{color:"var(--text-muted)"}}>
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                    <p className="text-sm">No tickets yet</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{borderColor:"var(--border)"}}>
                    {recent.map(t => {
                      const overdue = t.due_date && new Date(t.due_date)<new Date() && !["RESOLVED","CLOSED"].includes(t.status);
                      return (
                        <Link key={t.id} href={`/dashboard/tickets/${t.id}`}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--gold-glow)]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono" style={{color:"var(--text-muted)"}}>{t.code}</span>
                              {overdue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{background:"rgba(220,38,38,0.12)",color:"#dc2626"}}>OVERDUE</span>}
                            </div>
                            <p className="text-sm font-medium truncate mt-0.5" style={{color:"var(--text-primary)"}}>{t.title}</p>
                            <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>
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

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>BY CATEGORY</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {loading ? (
                  <div className="flex justify-center py-4"><div className="w-4 h-4 border border-t-[var(--gold-500)] rounded-full animate-spin"/></div>
                ) : catData.length === 0 ? (
                  <p className="text-sm text-center py-2" style={{color:"var(--text-muted)"}}>No data</p>
                ) : catData.map(([cat, count]) => {
                  const pct = catTotal > 0 ? Math.round((count/catTotal)*100) : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{color:"var(--text-secondary)"}}>{CAT_LABELS[cat]??cat}</span>
                        <span style={{color:"var(--text-muted)"}}>{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{background:"var(--black-600)"}}>
                        <div className="h-full rounded-full" style={{width:`${pct}%`,background:"var(--gold-500)"}}/>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{color:"var(--text-muted)"}}>QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {[
                  { href:"/dashboard/tickets/new", label:"New Ticket",    icon:Ticket       },
                  { href:"/dashboard/clients/new", label:"Add Client",    icon:Users        },
                  { href:"/dashboard/sla",         label:"SLA Settings",  icon:ShieldCheck  },
                ].map(a => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-2.5 p-2.5 rounded-[8px] text-sm font-medium transition-all hover:bg-[var(--gold-glow)]"
                    style={{color:"var(--text-secondary)",border:"1px solid var(--border)"}}>
                    <a.icon className="w-4 h-4 shrink-0" style={{color:"var(--gold-500)"}}/>
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
