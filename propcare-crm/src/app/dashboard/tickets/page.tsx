"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Search, Clock, User, Building2,
  AlertCircle, MoreHorizontal, Eye, Trash2, ChevronDown, Filter,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS, type TicketStatus, type TicketPriority, type TicketCategory } from "@/types";
import { NOS_PROJECTS } from "@/lib/constants";
import { SLAIndicator } from "@/components/ui/sla-indicator";

const STATUS_BADGE: Record<TicketStatus, BadgeProps["variant"]> = {
  OPEN: "open", IN_PROGRESS: "in-progress", PENDING_CLIENT: "in-progress",
  RESOLVED: "resolved", CLOSED: "closed",
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};
const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "PENDING_CLIENT", "RESOLVED", "CLOSED"] as const;

interface Ticket {
  id: string; code: string; title: string; status: TicketStatus;
  priority: TicketPriority; category: TicketCategory; project?: string;
  client: { name: string } | null; property: { name: string } | null;
  source?: string | null; assigned_to: { name: string } | null; created_at: string; due_date: string | null; resolved_at?: string | null;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");
  const [activeProject, setActiveProject] = useState<string>("ALL");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "ALL") params.set("status", activeStatus);
      if (activeProject !== "ALL") params.set("project", activeProject);
      if (search) params.set("search", search);
      const res = await fetch(`/api/tickets?${params}`);
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
      <Topbar
        title="Tickets"
        subtitle={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}${activeProject !== "ALL" ? ` · ${activeProject}` : ""}`}
        actions={<Button size="sm" asChild><Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5" /> New Ticket</Link></Button>}
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Search + Project Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="max-w-sm w-full">
            <Input placeholder="Search tickets…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
          </div>

          {/* Project Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
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
              {NOS_PROJECTS.map((p) => (
                <DropdownMenuItem key={p} onClick={() => setActiveProject(p)}>
                  <span className={activeProject === p ? "text-[var(--gold-500)] font-semibold" : ""}>{p}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 p-1 rounded-[10px] w-fit overflow-x-auto" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className="px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
              style={{ background: activeStatus === s ? "rgba(201,168,76,0.2)" : "transparent", color: activeStatus === s ? "var(--gold-500)" : "var(--text-muted)", border: activeStatus === s ? "0.5px solid var(--gold-500)" : "0.5px solid transparent" }}>
              {s === "ALL" ? "All" : TICKET_STATUS_LABELS[s as TicketStatus]}
              <span className="px-1.5 rounded-full text-[10px] font-bold" style={{ background: activeStatus === s ? "var(--gold-500)" : "var(--black-600)", color: activeStatus === s ? "var(--black-950)" : "var(--text-muted)" }}>
                {counts[s] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
          <table className="crm-table">
            <thead>
              <tr><th>Ticket</th><th>Project</th><th>Client</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin mx-auto" /></td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{activeProject !== "ALL" ? `No tickets for ${activeProject}` : "No tickets found"}</p>
                </td></tr>
              ) : tickets.map((ticket) => {
                const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date() && !["RESOLVED","CLOSED"].includes(ticket.status);
                return (
                  <tr key={ticket.id} className="group">
                    <td style={{ maxWidth: 260 }}>
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors line-clamp-1 block" style={{ color: "var(--text-primary)" }}>{ticket.title}</Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{ticket.code}</span>
                        {isOverdue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>OVERDUE</span>}
                      </div>
                    </td>
                    <td>
                      {ticket.project ? (
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--gold-glow)", color: "var(--gold-400)", border: "1px solid var(--border)" }}>
                          {ticket.project}
                        </span>
                      ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{ticket.client?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td><Badge variant={STATUS_BADGE[ticket.status]}>{TICKET_STATUS_LABELS[ticket.status]}</Badge></td>
                    <td><Badge variant={PRIORITY_BADGE[ticket.priority]}>{TICKET_PRIORITY_LABELS[ticket.priority]}</Badge></td>
                    <td><SLAIndicator ticketId={ticket.id} category={ticket.category} source={ticket.source} createdAt={ticket.created_at} status={ticket.status} resolvedAt={ticket.resolved_at} /></td>
                    <td>
                      {ticket.assigned_to ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
                            {ticket.assigned_to.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{ticket.assigned_to.name}</span>
                        </div>
                      ) : <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Unassigned</span>}
                    </td>
                    <td><div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Clock className="w-3 h-3" /><span className="text-xs">{formatRelativeTime(ticket.created_at)}</span></div></td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}><MoreHorizontal className="w-4 h-4" /></button>
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
