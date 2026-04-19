"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Filter, Clock, User, Building2,
  AlertCircle, ChevronDown, MoreHorizontal, Eye, Edit, Trash2,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS,
  type TicketStatus, type TicketPriority, type TicketCategory,
} from "@/types";

// ── Mock data ─────────────────────────────────────────────────
const MOCK_TICKETS = [
  { id: "1", code: "TKT-A1B2C", title: "AC unit not working in Unit 4B", status: "OPEN" as TicketStatus, priority: "URGENT" as TicketPriority, category: "MAINTENANCE" as TicketCategory, client: "Ahmed Al-Farsi", property: "Bloom Heights - Tower A", assignedTo: "Sarah Mitchell", createdAt: new Date(Date.now() - 1000 * 60 * 14), dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2) },
  { id: "2", code: "TKT-D3E4F", title: "Elevator maintenance request - Building C", status: "IN_PROGRESS" as TicketStatus, priority: "HIGH" as TicketPriority, category: "MAINTENANCE" as TicketCategory, client: "Fatima Hassan", property: "Marina Bay Residences", assignedTo: "Omar Al-Rashid", createdAt: new Date(Date.now() - 1000 * 60 * 47), dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8) },
  { id: "3", code: "TKT-G5H6I", title: "Query about service charge breakdown", status: "PENDING_CLIENT" as TicketStatus, priority: "MEDIUM" as TicketPriority, category: "PAYMENT" as TicketCategory, client: "James Thornton", property: "Creek View Apartments", assignedTo: "Priya Sharma", createdAt: new Date(Date.now() - 1000 * 60 * 90), dueDate: null },
  { id: "4", code: "TKT-J7K8L", title: "Water leakage from bathroom ceiling", status: "OPEN" as TicketStatus, priority: "HIGH" as TicketPriority, category: "MAINTENANCE" as TicketCategory, client: "Nour Al-Din", property: "Downtown Suites", assignedTo: null, createdAt: new Date(Date.now() - 1000 * 60 * 142), dueDate: new Date(Date.now() - 1000 * 60 * 60) },
  { id: "5", code: "TKT-M9N0O", title: "Lease renewal documentation request", status: "RESOLVED" as TicketStatus, priority: "LOW" as TicketPriority, category: "LEASE" as TicketCategory, client: "Emma Richardson", property: "Palm Residences", assignedTo: "James Thornton", createdAt: new Date(Date.now() - 1000 * 60 * 210), dueDate: null },
  { id: "6", code: "TKT-P1Q2R", title: "Parking access card malfunction", status: "OPEN" as TicketStatus, priority: "MEDIUM" as TicketPriority, category: "COMPLAINT" as TicketCategory, client: "Rania Malik", property: "Bloom Heights - Tower B", assignedTo: "Sarah Mitchell", createdAt: new Date(Date.now() - 1000 * 60 * 320), dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  { id: "7", code: "TKT-S3T4U", title: "Handover unit inspection follow-up", status: "IN_PROGRESS" as TicketStatus, priority: "HIGH" as TicketPriority, category: "HANDOVER" as TicketCategory, client: "David Clarke", property: "The Residences - Phase 2", assignedTo: "Omar Al-Rashid", createdAt: new Date(Date.now() - 1000 * 60 * 480), dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4) },
  { id: "8", code: "TKT-V5W6X", title: "Pool area closed without notice complaint", status: "CLOSED" as TicketStatus, priority: "LOW" as TicketPriority, category: "COMPLAINT" as TicketCategory, client: "Layla Nasser", property: "Marina Bay Residences", assignedTo: "Priya Sharma", createdAt: new Date(Date.now() - 1000 * 60 * 720), dueDate: null },
];

const STATUS_BADGE: Record<TicketStatus, BadgeProps["variant"]> = {
  OPEN: "open", IN_PROGRESS: "in-progress", PENDING_CLIENT: "in-progress",
  RESOLVED: "resolved", CLOSED: "closed",
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};

const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "PENDING_CLIENT", "RESOLVED", "CLOSED"] as const;

export default function TicketsPage() {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<string>("ALL");

  const filtered = MOCK_TICKETS.filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeStatus === "ALL" || t.status === activeStatus;
    return matchSearch && matchStatus;
  });

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "ALL" ? MOCK_TICKETS.length : MOCK_TICKETS.filter((t) => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Tickets"
        subtitle={`${filtered.length} ticket${filtered.length !== 1 ? "s" : ""} found`}
        actions={
          <Button size="sm" asChild>
            <Link href="/dashboard/tickets/new">
              <Plus className="w-3.5 h-3.5" /> New Ticket
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* ── Search + Filters Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search tickets, clients…"
              startIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filters
              <ChevronDown className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* ── Status Tabs ── */}
        <div className="flex gap-1 p-1 rounded-[10px] w-fit" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className="px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
              style={{
                background: activeStatus === s ? "rgba(201,168,76,0.2)" : "transparent",
                color: activeStatus === s ? "var(--gold-500)" : "var(--text-muted)",
                border: activeStatus === s ? "0.5px solid var(--gold-500)" : "0.5px solid transparent",
              }}
            >
              {s === "ALL" ? "All" : TICKET_STATUS_LABELS[s as TicketStatus]}
              <span
                className="px-1.5 py-0 rounded-full text-[10px] font-bold"
                style={{
                  background: activeStatus === s ? "var(--gold-500)" : "var(--black-600)",
                  color: activeStatus === s ? "var(--black-950)" : "var(--text-muted)",
                }}
              >
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Client / Property</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No tickets found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => {
                  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED";
                  return (
                    <tr key={ticket.id} className="group">
                      <td style={{ maxWidth: 280 }}>
                        <div>
                          <Link
                            href={`/dashboard/tickets/${ticket.id}`}
                            className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors line-clamp-1 block"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {ticket.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {ticket.code}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{ticket.client}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                            <span className="text-[11px] line-clamp-1" style={{ color: "var(--text-muted)" }}>{ticket.property}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={STATUS_BADGE[ticket.status]}>
                          {TICKET_STATUS_LABELS[ticket.status]}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={PRIORITY_BADGE[ticket.priority]}>
                          {TICKET_PRIORITY_LABELS[ticket.priority]}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {TICKET_CATEGORY_LABELS[ticket.category]}
                        </span>
                      </td>
                      <td>
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
                              {ticket.assignedTo.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{ticket.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{formatRelativeTime(ticket.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/tickets/${ticket.id}`}>
                                <Eye className="w-4 h-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/tickets/${ticket.id}/edit`}>
                                <Edit className="w-4 h-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive>
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Showing {filtered.length} of {MOCK_TICKETS.length} tickets
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className="w-7 h-7 rounded-[6px] text-xs font-medium transition-all"
                style={{
                  background: p === 1 ? "var(--gold-glow)" : "transparent",
                  color: p === 1 ? "var(--gold-500)" : "var(--text-muted)",
                  border: p === 1 ? "1px solid var(--border-strong)" : "1px solid transparent",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
