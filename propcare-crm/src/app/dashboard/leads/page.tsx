"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, TrendingUp, DollarSign, User, Building2,
  MoreHorizontal, Eye, Edit, Trash2, Calendar, AlertCircle,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency } from "@/lib/utils";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/types";

const MOCK_LEADS = [
  { id: "1", code: "LDK-001", title: "3BR Villa — Palm Jumeirah", status: "NEW" as LeadStatus, source: "Website", budget: 8500000, client: "Mohammed Al-Sayed", property: "Bloom Villas Phase 3", assignedTo: "Sarah Mitchell", followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) },
  { id: "2", code: "LDK-002", title: "Studio Apartment — Downtown", status: "CONTACTED" as LeadStatus, source: "Referral", budget: 950000, client: "Emma Richardson", property: null, assignedTo: "Omar Al-Rashid", followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 5), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12) },
  { id: "3", code: "LDK-003", title: "Investment Portfolio — 5 Units", status: "QUALIFIED" as LeadStatus, source: "Cold Outreach", budget: 22000000, client: "David Clarke", property: "Marina Bay Residences", assignedTo: "Sarah Mitchell", followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 48), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  { id: "4", code: "LDK-004", title: "2BR Apartment — JBR", status: "PROPOSAL_SENT" as LeadStatus, source: "Walk-in", budget: 2200000, client: "Layla Nasser", property: "Ocean Front Residences", assignedTo: "Priya Sharma", followUpDate: new Date(Date.now() - 1000 * 60 * 60 * 5), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36) },
  { id: "5", code: "LDK-005", title: "Penthouse — Business Bay", status: "NEGOTIATION" as LeadStatus, source: "Agent", budget: 12000000, client: "James Thornton", property: "The Penthouse Collection", assignedTo: "Omar Al-Rashid", followUpDate: new Date(Date.now() + 1000 * 60 * 60 * 24), createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
  { id: "6", code: "LDK-006", title: "Townhouse — Arabian Ranches", status: "WON" as LeadStatus, source: "Referral", budget: 4800000, client: "Rania Malik", property: "Arabian Ranches 3", assignedTo: "Sarah Mitchell", followUpDate: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
  { id: "7", code: "LDK-007", title: "Commercial Space — DIFC", status: "LOST" as LeadStatus, source: "LinkedIn", budget: 6500000, client: "Ahmed Al-Farsi", property: "DIFC Gate Village", assignedTo: "Priya Sharma", followUpDate: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96) },
];

const STATUS_BADGE: Record<LeadStatus, BadgeProps["variant"]> = {
  NEW: "new", CONTACTED: "medium", QUALIFIED: "gold",
  PROPOSAL_SENT: "in-progress", NEGOTIATION: "high",
  WON: "resolved", LOST: "closed",
};

const PIPELINE_STAGES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION"];

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"pipeline" | "table">("pipeline");

  const filtered = MOCK_LEADS.filter((l) =>
    !search ||
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase()) ||
    l.client.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = MOCK_LEADS.filter(l => l.status !== "LOST").reduce((s, l) => s + (l.budget ?? 0), 0);
  const wonValue = MOCK_LEADS.filter(l => l.status === "WON").reduce((s, l) => s + (l.budget ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Leads"
        subtitle={`${MOCK_LEADS.length} leads · Pipeline value ${formatCurrency(totalValue)}`}
        actions={
          <Button size="sm" asChild>
            <Link href="/dashboard/leads/new">
              <Plus className="w-3.5 h-3.5" /> New Lead
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Pipeline", value: formatCurrency(totalValue), icon: TrendingUp, color: "var(--gold-500)" },
            { label: "Won (This Month)", value: formatCurrency(wonValue), icon: DollarSign, color: "var(--success)" },
            { label: "Active Leads", value: MOCK_LEADS.filter(l => !["WON","LOST"].includes(l.status)).length, icon: TrendingUp, color: "var(--info)" },
            { label: "Conversion Rate", value: "28%", icon: TrendingUp, color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex gap-3 items-center justify-between">
          <div className="max-w-xs w-full">
            <Input placeholder="Search leads…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
          </div>
          <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
            {(["pipeline", "table"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all" style={{ background: view === v ? "var(--gold-glow)" : "transparent", color: view === v ? "var(--gold-500)" : "var(--text-muted)" }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Pipeline View ── */}
        {view === "pipeline" ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.map((stage) => {
                const stageLeads = filtered.filter((l) => l.status === stage);
                const stageValue = stageLeads.reduce((s, l) => s + (l.budget ?? 0), 0);
                return (
                  <div key={stage} className="w-72 flex flex-col gap-3">
                    {/* Stage Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_BADGE[stage]}>{LEAD_STATUS_LABELS[stage]}</Badge>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--black-600)", color: "var(--text-muted)" }}>
                          {stageLeads.length}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatCurrency(stageValue)}</span>
                    </div>

                    {/* Drop Zone */}
                    <div className="flex flex-col gap-3 min-h-[200px] rounded-[12px] p-2" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
                      {stageLeads.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs" style={{ color: "var(--text-muted)" }}>
                          No leads
                        </div>
                      ) : stageLeads.map((lead) => {
                        const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date();
                        return (
                          <div key={lead.id} className="rounded-[10px] p-3 transition-all cursor-pointer group" style={{ background: "var(--black-700)", border: "0.5px solid var(--border)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-strong)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 15px var(--gold-glow)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-medium leading-snug flex-1" style={{ color: "var(--text-primary)" }}>{lead.title}</p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 shrink-0" style={{ color: "var(--text-muted)" }}>
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild><Link href={`/dashboard/leads/${lead.id}`}><Eye className="w-4 h-4" />View</Link></DropdownMenuItem>
                                  <DropdownMenuItem asChild><Link href={`/dashboard/leads/${lead.id}/edit`}><Edit className="w-4 h-4" />Edit</Link></DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem destructive><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-1.5">
                              {lead.budget && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--gold-400)" }}>
                                  <DollarSign className="w-3 h-3" />{formatCurrency(lead.budget)}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                                <User className="w-3 h-3" />{lead.client}
                              </div>
                              {lead.followUpDate && (
                                <div className="flex items-center gap-1.5 text-xs" style={{ color: isOverdue ? "var(--danger)" : "var(--text-muted)" }}>
                                  <Calendar className="w-3 h-3" />
                                  {isOverdue ? "⚠ Overdue: " : ""}{formatDate(lead.followUpDate)}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{lead.code}</span>
                              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{lead.assignedTo.split(" ")[0]}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Won + Lost columns */}
              {(["WON", "LOST"] as LeadStatus[]).map((stage) => {
                const stageLeads = filtered.filter((l) => l.status === stage);
                return (
                  <div key={stage} className="w-64 flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                      <Badge variant={STATUS_BADGE[stage]}>{LEAD_STATUS_LABELS[stage]}</Badge>
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--black-600)", color: "var(--text-muted)" }}>{stageLeads.length}</span>
                    </div>
                    <div className="flex flex-col gap-2 min-h-[200px] rounded-[12px] p-2" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
                      {stageLeads.map((lead) => (
                        <div key={lead.id} className="rounded-[8px] p-2.5" style={{ background: "var(--black-700)", border: "0.5px solid var(--border)" }}>
                          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{lead.title}</p>
                          <p className="text-xs mt-1 font-semibold" style={{ color: stage === "WON" ? "var(--success)" : "var(--text-muted)" }}>
                            {formatCurrency(lead.budget ?? 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Table View ── */
          <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Assigned</th>
                  <th>Follow Up</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12" style={{ color: "var(--text-muted)" }}><AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No leads found</p></td></tr>
                ) : filtered.map((lead) => (
                  <tr key={lead.id} className="group">
                    <td>
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{lead.title}</Link>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{lead.code} · {lead.source}</p>
                    </td>
                    <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{lead.client}</span></td>
                    <td><Badge variant={STATUS_BADGE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge></td>
                    <td><span className="text-sm font-semibold" style={{ color: "var(--gold-400)" }}>{formatCurrency(lead.budget ?? 0)}</span></td>
                    <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{lead.assignedTo}</span></td>
                    <td>
                      {lead.followUpDate ? (
                        <span className="text-xs" style={{ color: new Date(lead.followUpDate) < new Date() ? "var(--danger)" : "var(--text-muted)" }}>
                          {formatDate(lead.followUpDate)}
                        </span>
                      ) : <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/dashboard/leads/${lead.id}`}><Eye className="w-4 h-4" />View</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/dashboard/leads/${lead.id}/edit`}><Edit className="w-4 h-4" />Edit</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
