"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, TrendingUp, DollarSign, MoreHorizontal, Eye, Trash2, AlertCircle, Calendar } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate, formatCurrency } from "@/lib/utils";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/types";

const STATUS_BADGE: Record<LeadStatus, BadgeProps["variant"]> = {
  NEW: "new", CONTACTED: "medium", QUALIFIED: "gold",
  PROPOSAL_SENT: "in-progress", NEGOTIATION: "high",
  WON: "resolved", LOST: "closed",
};

interface Lead {
  id: string; code: string; title?: string | null; status: LeadStatus;
  source?: string | null; budget?: number | null;
  client: { name: string } | null; assigned_to: { name: string } | null;
  follow_up_date?: string | null; created_at: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/leads?${params}`);
      const json = await res.json();
      if (json.success) setLeads(json.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const totalValue = leads.filter(l => !["WON","LOST"].includes(l.status)).reduce((s, l) => s + (l.budget ?? 0), 0);
  const wonValue = leads.filter(l => l.status === "WON").reduce((s, l) => s + (l.budget ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Leads" subtitle={`${leads.length} leads`}
        actions={<Button size="sm" asChild><Link href="/dashboard/leads/new"><Plus className="w-3.5 h-3.5" /> New Lead</Link></Button>}
      />
      <div className="flex-1 p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pipeline Value", value: formatCurrency(totalValue), icon: TrendingUp, color: "var(--gold-500)" },
            { label: "Won", value: formatCurrency(wonValue), icon: DollarSign, color: "var(--success)" },
            { label: "Active Leads", value: leads.filter(l => !["WON","LOST"].includes(l.status)).length, icon: TrendingUp, color: "var(--info)" },
            { label: "Total", value: leads.length, icon: TrendingUp, color: "var(--warning)" },
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

        <div className="max-w-xs">
          <Input placeholder="Search leads…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
        </div>

        <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
          <table className="crm-table">
            <thead>
              <tr><th>Lead</th><th>Client</th><th>Status</th><th>Budget</th><th>Assigned</th><th>Follow Up</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin mx-auto" /></td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16" style={{ color: "var(--text-muted)" }}>
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No leads yet</p>
                  <Link href="/dashboard/leads/new"><Button variant="secondary" size="sm" className="mt-3">Add first lead</Button></Link>
                </td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} className="group">
                  <td>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{lead.title ?? "—"}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{lead.code} · {lead.source ?? "—"}</p>
                  </td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{lead.client?.name ?? "—"}</span></td>
                  <td><Badge variant={STATUS_BADGE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge></td>
                  <td><span className="text-sm font-semibold" style={{ color: "var(--gold-400)" }}>{lead.budget ? formatCurrency(lead.budget) : "—"}</span></td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{lead.assigned_to?.name ?? "—"}</span></td>
                  <td>
                    {lead.follow_up_date ? (
                      <div className="flex items-center gap-1 text-xs" style={{ color: new Date(lead.follow_up_date) < new Date() ? "var(--danger)" : "var(--text-muted)" }}>
                        <Calendar className="w-3 h-3" />{formatDate(lead.follow_up_date)}
                      </div>
                    ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}><MoreHorizontal className="w-4 h-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/dashboard/leads/${lead.id}`}><Eye className="w-4 h-4" />View</Link></DropdownMenuItem>
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
      </div>
    </div>
  );
}
