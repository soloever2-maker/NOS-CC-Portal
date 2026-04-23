"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, AlertCircle, Download, X,
  MoreHorizontal, Eye, Trash2, ChevronDown, Filter, AlignJustify, Star, Calendar,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS, type TicketStatus, type TicketPriority, type ContactStatus } from "@/types";
import { NOS_PROJECTS } from "@/lib/constants";
import { calculateSLA } from "@/lib/sla";
import { createClient } from "@/lib/supabase/client";

// ── Status dot config ──
const STATUS_DOT: Record<TicketStatus, { color: string; label: string; short: string }> = {
  OPEN:           { color: "#3b82f6", label: "Open",           short: "Open" },
  IN_PROGRESS:    { color: "#f59e0b", label: "In Progress",    short: "In Prog." },
  PENDING_CLIENT: { color: "#8b5cf6", label: "Pending Client", short: "Pending" },
  RESOLVED:       { color: "#22c55e", label: "Resolved",       short: "Resolved" },
  CLOSED:         { color: "#606060", label: "Closed",         short: "Closed" },
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};
const STATUSES = ["ALL","OPEN","IN_PROGRESS","PENDING_CLIENT","RESOLVED","CLOSED"] as const;
const STAR_COLORS = ["","#ef4444","#f97316","#f59e0b","#84cc16","#22c55e"];

interface Ticket {
  id: string; code: string; title: string; status: TicketStatus;
  priority: TicketPriority; category: string; project?: string;
  client: { name: string } | null;
  source?: string | null; contact_status?: ContactStatus | null;
  assigned_to: { name: string } | null;
  created_at: string; due_date: string | null; resolved_at?: string | null;
  computed_sla_hours?: number | null;
  csat_score?: number | null;
}

// ── Export Modal ──
function ExportModal({ onClose, agents }: { onClose: () => void; agents: { id: string; name: string }[] }) {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [dateFrom,   setDateFrom]   = useState(firstOfMonth);
  const [dateTo,     setDateTo]     = useState(today);
  const [status,     setStatus]     = useState("ALL");
  const [project,    setProject]    = useState("ALL");
  const [agentId,    setAgentId]    = useState("ALL");
  const [exporting,  setExporting]  = useState(false);
  const [count,      setCount]      = useState<number | null>(null);

  // Quick range presets
  const setRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    setDateFrom(start.toISOString().split("T")[0]);
    setDateTo(end.toISOString().split("T")[0]);
  };
  const setMonthRange = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    const y = d.getFullYear(), m = d.getMonth();
    setDateFrom(new Date(y, m, 1).toISOString().split("T")[0]);
    setDateTo(new Date(y, m + 1, 0).toISOString().split("T")[0]);
  };

  // Preview count
  useEffect(() => {
    const supabase = createClient();
    let q = supabase.from("tickets").select("*", { count: "exact", head: true });
    if (status  !== "ALL") q = q.eq("status", status);
    if (project !== "ALL") q = q.eq("project", project);
    if (agentId !== "ALL") q = q.eq("assigned_to_id", agentId);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo)   q = q.lte("created_at", dateTo + "T23:59:59Z");
    q.then(({ count: c }) => setCount(c));
  }, [dateFrom, dateTo, status, project, agentId]);

  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (status  !== "ALL") params.set("status",  status);
    if (project !== "ALL") params.set("project", project);
    if (agentId !== "ALL") params.set("agentId", agentId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo)   params.set("dateTo",   dateTo);
    const res = await fetch(`/api/export/tickets?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    onClose();
  };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const YEARS  = [2024, 2025, 2026];

  const setMonthYear = (month: number, year: number) => {
    setDateFrom(new Date(year, month, 1).toISOString().split("T")[0]);
    setDateTo(new Date(year, month + 1, 0).toISOString().split("T")[0]);
  };

  const QUICK = [
    { label: "This Week",  action: () => setRange(7)       },
    { label: "This Month", action: () => setMonthRange(0)  },
    { label: "Last Month", action: () => setMonthRange(-1) },
    { label: "Last 3 Mo.", action: () => setRange(90)      },
    { label: "All Time",   action: () => { setDateFrom("2020-01-01"); setDateTo(today); } },
  ];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-[14px] shadow-2xl" style={{ background: "var(--black-800)", border: "1px solid var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" style={{ color: "var(--gold-500)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Export Tickets</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-[var(--black-600)]" style={{ color: "var(--text-muted)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick ranges */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Quick Range</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {QUICK.map(q => (
                <button key={q.label} onClick={q.action}
                  className="px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all"
                  style={{ background: "var(--black-700)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-500)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-500)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                >
                  {q.label}
                </button>
              ))}
            </div>
            {/* Month / Year picker */}
            <div className="space-y-1.5">
              {YEARS.map(year => (
                <div key={year} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold w-8 shrink-0" style={{ color: "var(--text-muted)" }}>{year}</span>
                  <div className="flex flex-wrap gap-1">
                    {MONTHS.map((m, i) => (
                      <button key={m} onClick={() => setMonthYear(i, year)}
                        className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold transition-all"
                        style={{ background: "var(--black-700)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-500)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-500)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div> 
          
          {/* Date Range */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Date Range</p>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="crm-input w-full text-xs h-8 pl-8" />
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>to</span>
              <div className="relative flex-1">
                <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="crm-input w-full text-xs h-8 pl-8" />
              </div>
            </div>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Status</p>
              <div className="relative">
                <select value={status} onChange={e => setStatus(e.target.value)} className="crm-input w-full text-xs h-8 pr-6 appearance-none">
                  <option value="ALL">All</option>
                  {STATUSES.filter(s => s !== "ALL").map(s => <option key={s} value={s}>{TICKET_STATUS_LABELS[s as TicketStatus]}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Project</p>
              <div className="relative">
                <select value={project} onChange={e => setProject(e.target.value)} className="crm-input w-full text-xs h-8 pr-6 appearance-none">
                  <option value="ALL">All</option>
                  {NOS_PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Agent</p>
              <div className="relative">
                <select value={agentId} onChange={e => setAgentId(e.target.value)} className="crm-input w-full text-xs h-8 pr-6 appearance-none">
                  <option value="ALL">All</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
          </div>

          {/* Preview count */}
          <div className="p-3 rounded-[8px] text-center" style={{ background: "var(--black-700)", border: "1px solid var(--border)" }}>
            {count === null
              ? <span className="text-xs" style={{ color: "var(--text-muted)" }}>Calculating…</span>
              : <span className="text-sm font-semibold" style={{ color: count > 0 ? "var(--gold-400)" : "var(--text-muted)" }}>
                  {count} ticket{count !== 1 ? "s" : ""} match your filters
                </span>
            }
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
          <Button size="sm" onClick={handleExport} loading={exporting} disabled={!count || exporting} className="flex-1">
            <Download className="w-3.5 h-3.5" />{exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Inline SLA badge (computed from passed hours, no fetch) ──
function SLABadge({ ticket }: { ticket: Ticket }) {
  const sla = ticket.computed_sla_hours
    ? calculateSLA(ticket.created_at, ticket.status, ticket.resolved_at ?? null, ticket.computed_sla_hours)
    : null;

  if (!sla || sla.status === "no_sla") return <span style={{ color: "var(--text-muted)" }}>—</span>;

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap"
      style={{ fontSize: 10, background: sla.bg, color: sla.color, border: `1px solid ${sla.color}44` }}
      title={`${sla.hoursAllowed}h allowed · ${sla.hoursElapsed}h elapsed`}>
      {sla.label}
    </span>
  );
}

// ── CSAT stars (compact) ──
function CSATStars({ score }: { score: number | null | undefined }) {
  if (!score) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  const color = STAR_COLORS[score];
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className="w-3 h-3" fill={s <= score ? color : "none"} style={{ color: s <= score ? color : "var(--border)" }} />
      ))}
    </div>
  );
}

// ── Status Dot ──
function StatusDot({ status, compact }: { status: TicketStatus; compact: boolean }) {
  const cfg = STATUS_DOT[status];
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.color }} />
      {!compact && <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.short}</span>}
    </div>
  );
}

// ── Main Page ──
export default function TicketsPage() {
  const [tickets,       setTickets]       = useState<Ticket[]>([]);
  const [agents,        setAgents]        = useState<{ id: string; name: string }[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [activeStatus,  setActiveStatus]  = useState<string>("ALL");
  const [activeProject, setActiveProject] = useState<string>("ALL");
  const [compact,       setCompact]       = useState(false);
  const [showExport,    setShowExport]    = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nos-compact-tickets");
    if (saved === "true") setCompact(true);
    const supabase = createClient();
    supabase.from("users").select("id, name").eq("is_active", true).order("name").then(({ data }) => setAgents(data ?? []));
  }, []);

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    localStorage.setItem("nos-compact-tickets", String(next));
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus  !== "ALL") params.set("status",  activeStatus);
      if (activeProject !== "ALL") params.set("project", activeProject);
      if (search) params.set("search", search);
      const res  = await fetch(`/api/tickets?${params}`);
      const json = await res.json();
      if (json.success) setTickets(json.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeStatus, activeProject, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "ALL" ? tickets.length : tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      {showExport && <ExportModal onClose={() => setShowExport(false)} agents={agents} />}

      <Topbar
        title="Tickets"
        subtitle={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}${activeProject !== "ALL" ? ` · ${activeProject}` : ""}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowExport(true)}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5" /> New Ticket</Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-5 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="max-w-xs w-full">
            <Input placeholder="Search tickets…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <Filter className="w-3.5 h-3.5" />
                {activeProject === "ALL" ? "All Projects" : activeProject}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveProject("ALL")}>
                <span className={activeProject === "ALL" ? "text-[var(--gold-500)] font-semibold" : ""}>All Projects</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {NOS_PROJECTS.map(p => (
                <DropdownMenuItem key={p} onClick={() => setActiveProject(p)}>
                  <span className={activeProject === p ? "text-[var(--gold-500)] font-semibold" : ""}>{p}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button onClick={toggleCompact}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs font-medium transition-all"
            style={{ background: compact ? "var(--gold-glow)" : "transparent", color: compact ? "var(--gold-500)" : "var(--text-muted)", border: `0.5px solid ${compact ? "var(--gold-500)" : "var(--border)"}` }}>
            <AlignJustify className="w-3.5 h-3.5" />
            {compact ? "Compact" : "Normal"}
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 p-1 rounded-[10px] w-fit overflow-x-auto" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className="px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
              style={{ background: activeStatus === s ? "rgba(201,168,76,0.2)" : "transparent", color: activeStatus === s ? "var(--gold-500)" : "var(--text-muted)", border: activeStatus === s ? "0.5px solid var(--gold-500)" : "0.5px solid transparent" }}>
              {s !== "ALL" && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[s as TicketStatus]?.color ?? "var(--text-muted)" }} />}
              {s === "ALL" ? "All" : STATUS_DOT[s as TicketStatus].short}
              <span className="px-1.5 rounded-full text-[10px] font-bold" style={{ background: activeStatus === s ? "var(--gold-500)" : "var(--black-600)", color: activeStatus === s ? "var(--black-950)" : "var(--text-muted)" }}>
                {counts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
          <table className={`crm-table${compact ? " compact" : ""}`}>
            <thead>
              <tr>
                <th>Code</th><th>Ticket</th><th>Project</th><th>Client</th>
                <th>Status</th><th>Contact</th><th>Priority</th>
                <th>SLA</th><th>CSAT</th><th>Assigned To</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-10"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin mx-auto" /></td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                  <AlertCircle className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{activeProject !== "ALL" ? `No tickets for ${activeProject}` : "No tickets found"}</p>
                </td></tr>
              ) : tickets.map(ticket => {
                const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date() && !["RESOLVED","CLOSED"].includes(ticket.status);
                return (
                  <tr key={ticket.id} className="group">
                    <td>
                      <span className="font-mono text-xs font-bold" style={{ color: "var(--gold-400)" }}>
                        {ticket.code}
                      </span>
                      {isOverdue && (
                        <div className="mt-0.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>OVERDUE</span>
                        </div>
                      )}
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="font-medium hover:text-[var(--gold-400)] transition-colors line-clamp-1 block" style={{ color: "var(--text-primary)" }}>
                        {ticket.title}
                      </Link>
                    </td>
                    <td>
                      {ticket.project
                        ? <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap" style={{ background: "var(--gold-glow)", color: "var(--gold-400)", border: "1px solid var(--border)" }}>{ticket.project}</span>
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td>
                      <span style={{ color: "var(--text-secondary)" }}>{ticket.client?.name ?? "—"}</span>
                    </td>
                    <td><StatusDot status={ticket.status} compact={compact} /></td>
                    <td>
                      {ticket.contact_status ? (() => {
                        const cs = CONTACT_STATUS_COLORS[ticket.contact_status];
                        return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap" style={{ fontSize: 10, background: cs.bg, color: cs.color, border: `1px solid ${cs.color}44` }}>{CONTACT_STATUS_LABELS[ticket.contact_status]}</span>;
                      })() : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td><Badge variant={PRIORITY_BADGE[ticket.priority]}>{ticket.priority}</Badge></td>
                    <td><SLABadge ticket={ticket} /></td>
                    <td><CSATStars score={ticket.csat_score} /></td>
                    <td>
                      {ticket.assigned_to ? (
                        <div className="flex items-center gap-1.5">
                          <div className="avatar-sm w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
                            {ticket.assigned_to.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                          </div>
                          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{ticket.assigned_to.name}</span>
                        </div>
                      ) : <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Unassigned</span>}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-6 h-6 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/dashboard/tickets/${ticket.id}`}><Eye className="w-4 h-4" /> View</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
