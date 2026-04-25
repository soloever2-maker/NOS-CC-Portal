"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Topbar }     from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }     from "@/components/ui/button";
import {
  TrendingUp, CheckCircle, Clock, Users, Download,
  ShieldCheck, ShieldAlert, ShieldX, Timer, PhoneCall, Calendar,
} from "lucide-react";
import { NOS_PROJECTS } from "@/lib/constants";

/* ── Types ───────────────────────────────────────────────── */
interface SLAStats {
  within: number; atRisk: number; overdue: number;
  complianceRate: number | null;
  resolvedWithinSLA: number; resolvedBreached: number;
}
interface AgentStat { name: string; total: number; resolved: number; open: number; }
interface Stats {
  totalTickets: number; openTickets: number; pendingClient: number;
  resolvedCount: number; closedCount: number; totalClients: number;
  avgResolutionHours: number | null;
  byCategory: Record<string, number>; byStatus: Record<string, number>;
  bySource: Record<string, number>;
  agentPerformance: AgentStat[];
  sla: SLAStats;
}

/* ── Colors & Labels ─────────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6", IN_PROGRESS: "#f59e0b", PENDING_CLIENT: "#8b5cf6",
  RESOLVED: "#22c55e", CLOSED: "#606060",
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open", IN_PROGRESS: "In Progress", PENDING_CLIENT: "Pending Client",
  RESOLVED: "Resolved", CLOSED: "Closed",
};
const CAT_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance", COMPLAINT: "Complaint", INQUIRY: "Inquiry",
  PAYMENT: "Payment", LEASE: "Lease", HANDOVER: "Handover", OTHER: "Other",
};
const SOURCE_LABELS: Record<string, string> = {
  walk_in: "Walk-in", call_center: "Call Center", email: "Email", unknown: "Unknown",
};
const CAT_COLORS    = ["#c9a84c","#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];
const SOURCE_COLORS = ["#c9a84c","#3b82f6","#22c55e","#8b5cf6"];

/* ── Date presets ────────────────────────────────────────── */
type Preset = "week" | "month" | "quarter" | "all" | "custom";
const PRESETS: { key: Preset; label: string }[] = [
  { key: "week",    label: "This Week"  },
  { key: "month",   label: "This Month" },
  { key: "quarter", label: "Last 3M"    },
  { key: "all",     label: "All Time"   },
  { key: "custom",  label: "Custom"     },
];

function buildRange(preset: Preset, customFrom: string, customTo: string) {
  const now = new Date();
  if (preset === "all")    return { from: "", to: "" };
  if (preset === "custom") return { from: customFrom, to: customTo };
  if (preset === "week") {
    const f = new Date(now); f.setDate(now.getDate() - 7);
    return { from: f.toISOString(), to: now.toISOString() };
  }
  if (preset === "month") {
    const f = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: f.toISOString(), to: now.toISOString() };
  }
  const f = new Date(now); f.setMonth(now.getMonth() - 3);
  return { from: f.toISOString(), to: now.toISOString() };
}

function periodLabel(preset: Preset, customFrom: string, customTo: string) {
  if (preset === "all")     return "All Time";
  if (preset === "week")    return "Last 7 Days";
  if (preset === "quarter") return "Last 3 Months";
  if (preset === "month")
    return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  if (customFrom && customTo) {
    const fmt = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${fmt(customFrom)} — ${fmt(customTo)}`;
  }
  return "Custom Range";
}

function formatHours(h: number) {
  if (h < 1)  return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24 * 10) / 10}d`;
}

/* ── Tooltip ─────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] p-3 text-xs shadow-xl"
      style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
      <p className="font-semibold mb-2" style={{ color: "var(--gold-400)" }}>{label}</p>
      {payload.map(e => (
        <div key={e.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{e.name}:</span>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{e.value}</span>
        </div>
      ))}
    </div>
  );
};

const Spinner = () => (
  <div className="flex justify-center py-8">
    <div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" />
  </div>
);

/* ═══════════════════════════════════════════════════════════ */
export default function ReportsPage() {
  const [stats,      setStats]      = useState<Stats | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(false);
  const [preset,     setPreset]     = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [project,    setProject]    = useState("");

  const label = periodLabel(preset, customFrom, customTo);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const { from, to } = buildRange(preset, customFrom, customTo);
    const params = new URLSearchParams();
    if (from)    params.set("from",    from);
    if (to)      params.set("to",      to);
    if (project) params.set("project", project);
    const res = await fetch(`/api/stats?${params}`);
    const d   = await res.json();
    if (d.success) setStats(d.data);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo, project]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res  = await fetch("/api/export/tickets");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const sla = stats?.sla;

  const categoryData = Object.entries(stats?.byCategory ?? {})
    .map(([name, value]) => ({ name: CAT_LABELS[name] ?? name, value }))
    .sort((a, b) => b.value - a.value);

  const statusData = Object.entries(stats?.byStatus ?? {})
    .map(([name, value]) => ({ name: STATUS_LABELS[name] ?? name, value, fill: STATUS_COLORS[name] ?? "#888" }));

  const sourceData = Object.entries(stats?.bySource ?? {})
    .map(([name, value]) => ({ name: SOURCE_LABELS[name] ?? name, value }))
    .sort((a, b) => b.value - a.value);

  const slaActiveData = sla ? [
    { name: "Within SLA", value: sla.within,  fill: "#22c55e" },
    { name: "At Risk",    value: sla.atRisk,  fill: "#f59e0b" },
    { name: "Breached",   value: sla.overdue, fill: "#ef4444" },
  ].filter(d => d.value > 0) : [];

  const slaResolvedData = sla ? [
    { name: "Within SLA", value: sla.resolvedWithinSLA, fill: "#22c55e" },
    { name: "Breached",   value: sla.resolvedBreached,  fill: "#ef4444" },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Reports"
        subtitle={`Live analytics — ${label}`}
        actions={
          <Button size="sm" variant="outline" onClick={handleExport} loading={exporting}>
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      <div className="flex-1 p-5 space-y-5">

        {/* ── Filters ─────────────────────────────────────── */}
        <div className="rounded-[12px] p-4 space-y-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            {PRESETS.map(r => (
              <button key={r.key}
                onClick={() => { setPreset(r.key); setShowCustom(r.key === "custom"); }}
                style={{
                  padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                  borderColor: preset === r.key ? "var(--gold-500)" : "var(--border)",
                  background:  preset === r.key ? "var(--gold-glow)" : "transparent",
                  color:       preset === r.key ? "var(--gold-500)"  : "var(--text-muted)",
                }}>
                {r.label}
              </button>
            ))}
            <select value={project} onChange={e => setProject(e.target.value)}
              className="crm-input h-8 text-xs px-3" style={{ minWidth: 160 }}>
              <option value="">All Projects</option>
              {NOS_PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Showing: <strong style={{ color: "var(--text-primary)" }}>{label}</strong>
            </span>
          </div>

          {showCustom && (
            <div className="flex items-center gap-3 pt-3"
              style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <label style={{ fontSize: 12, color: "var(--text-muted)" }}>From:</label>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text-primary)", fontSize: 13 }} />
              </div>
              <div className="flex items-center gap-2">
                <label style={{ fontSize: 12, color: "var(--text-muted)" }}>To:</label>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text-primary)", fontSize: 13 }} />
              </div>
              <button onClick={fetchStats}
                style={{ padding: "5px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "var(--gold-500)", color: "white", border: "none" }}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ── Stat Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total",          value: stats?.totalTickets    ?? 0,    icon: TrendingUp,  color: "var(--gold-500)",                                                                                                                                          fmt: (v: number) => String(v) },
            { label: "Open",           value: stats?.openTickets     ?? 0,    icon: Clock,       color: "var(--danger)",                                                                                                                                            fmt: (v: number) => String(v) },
            { label: "Pending Client", value: stats?.pendingClient   ?? 0,    icon: Clock,       color: "var(--info)",                                                                                                                                              fmt: (v: number) => String(v) },
            { label: "Resolved",       value: stats?.resolvedCount   ?? 0,    icon: CheckCircle, color: "var(--success)",                                                                                                                                           fmt: (v: number) => String(v) },
            { label: "Avg Resolution", value: stats?.avgResolutionHours ?? null, icon: Timer,    color: "var(--warning)",                                                                                                                                           fmt: (v: number) => formatHours(v) },
            { label: "SLA Compliance", value: sla?.complianceRate    ?? null, icon: ShieldCheck, color: sla?.complianceRate != null ? (sla.complianceRate >= 80 ? "var(--success)" : sla.complianceRate >= 60 ? "var(--warning)" : "var(--danger)") : "var(--text-muted)", fmt: (v: number) => `${v}%` },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3"
                style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif", color: s.color }}>
                {loading ? "—" : s.value != null ? s.fmt(s.value as number) : "N/A"}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {s.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── SLA Section ─────────────────────────────────── */}
        <div>
          <h2 className="text-xs font-semibold tracking-wider mb-3 flex items-center gap-2"
            style={{ color: "var(--text-muted)" }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--gold-500)" }} />
            SLA PERFORMANCE — {label}
          </h2>

          {/* Active tickets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { label: "Within SLA", sub: "active tickets on track",          value: sla?.within  ?? 0, icon: ShieldCheck, color: "var(--success)", bg: "rgba(34,197,94,0.08)"  },
              { label: "At Risk",    sub: "75%+ of SLA time used",             value: sla?.atRisk  ?? 0, icon: ShieldAlert, color: "var(--warning)", bg: "rgba(245,158,11,0.08)" },
              { label: "Breached",   sub: "active — exceeded time limit",      value: sla?.overdue ?? 0, icon: ShieldX,     color: "var(--danger)",  bg: "rgba(239,68,68,0.08)"  },
            ].map(s => (
              <div key={s.label} className="stat-card flex items-center gap-4"
                style={{ background: s.bg }}>
                <s.icon className="w-10 h-10 shrink-0" style={{ color: s.color }} />
                <div>
                  <p className="text-3xl font-bold"
                    style={{ fontFamily: "'Playfair Display', serif", color: s.color }}>
                    {loading ? "—" : s.value}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: s.color }}>{s.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SLA charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold tracking-wider"
                  style={{ color: "var(--text-muted)" }}>
                  ACTIVE — SLA STATUS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Spinner /> : slaActiveData.length === 0
                  ? <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No active tickets with SLA</p>
                  : <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={slaActiveData} cx="50%" cy="50%" outerRadius={75}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={{ stroke: "var(--text-muted)", strokeWidth: 0.5 }}>
                          {slaActiveData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold tracking-wider"
                  style={{ color: "var(--text-muted)" }}>
                  RESOLVED — SLA COMPLIANCE ({label.toUpperCase()})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <Spinner /> : slaResolvedData.length === 0
                  ? <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No resolved tickets with SLA in this period</p>
                  : <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold" style={{ color: "#22c55e", fontFamily: "'Playfair Display',serif" }}>{sla?.resolvedWithinSLA}</p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Within SLA</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold" style={{ color: "#ef4444", fontFamily: "'Playfair Display',serif" }}>{sla?.resolvedBreached}</p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Breached</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold" style={{
                            fontFamily: "'Playfair Display',serif",
                            color: (sla?.complianceRate ?? 0) >= 80 ? "#22c55e" : (sla?.complianceRate ?? 0) >= 60 ? "#f59e0b" : "#ef4444"
                          }}>
                            {sla?.complianceRate ?? 0}%
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>compliance rate</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={slaResolvedData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={48}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" name="Tickets" radius={[4,4,0,0]}>
                            {slaResolvedData.map((e, i) => <Cell key={i} fill={e.fill} opacity={0.85} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </>}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Charts Row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>BY CATEGORY</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : categoryData.length === 0
                ? <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No data</p>
                : <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Tickets" radius={[4,4,0,0]}>
                        {categoryData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} opacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>BY STATUS</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : statusData.length === 0
                ? <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No data</p>
                : <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: "var(--text-muted)", strokeWidth: 0.5 }}>
                        {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 10, color: "var(--text-muted)" }} iconType="circle" iconSize={7} />
                    </PieChart>
                  </ResponsiveContainer>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}>
                <PhoneCall className="w-3.5 h-3.5" style={{ color: "var(--gold-500)" }} /> BY SOURCE
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : sourceData.length === 0
                ? <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No data</p>
                : <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sourceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={36}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Tickets" radius={[4,4,0,0]}>
                        {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} opacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>}
            </CardContent>
          </Card>
        </div>

        {/* ── Agent Performance ────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold tracking-wider flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}>
              <Users className="w-3.5 h-3.5" style={{ color: "var(--gold-500)" }} />
              AGENT PERFORMANCE — {label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? <Spinner /> : !stats?.agentPerformance?.length
              ? <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No assigned tickets</p>
              : (
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Total</th>
                      <th>Resolved</th>
                      <th>Open</th>
                      <th>Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.agentPerformance.map((a, i) => {
                      const rate = a.total > 0 ? Math.round((a.resolved / a.total) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
                                {a.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                            </div>
                          </td>
                          <td><span className="font-semibold" style={{ color: "var(--text-primary)" }}>{a.total}</span></td>
                          <td><span style={{ color: "var(--success)" }}>{a.resolved}</span></td>
                          <td><span style={{ color: a.open > 0 ? "var(--warning)" : "var(--text-muted)" }}>{a.open}</span></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                                style={{ background: "var(--black-600)", maxWidth: 80 }}>
                                <div className="h-full rounded-full"
                                  style={{ width: `${rate}%`, background: rate >= 70 ? "var(--success)" : rate >= 40 ? "var(--warning)" : "var(--danger)" }} />
                              </div>
                              <span className="text-xs font-semibold"
                                style={{ color: rate >= 70 ? "var(--success)" : rate >= 40 ? "var(--warning)" : "var(--danger)" }}>
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
