"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, TrendingUp, Award, AlertCircle, ChevronDown } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface CSATEntry {
  id: string; score: number; notes?: string | null; month: number; year: number; created_at: string;
  ticket: { id: string; code: string; title: string } | null;
  agent: { id: string; name: string } | null;
  client_name?: string;
}

interface AgentSummary { id: string; name: string; avg: number; count: number; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STAR_COLORS = ["","#ef4444","#f97316","#f59e0b","#84cc16","#22c55e"];

export default function CSATPage() {
  const [entries, setEntries] = useState<CSATEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear,  setFilterYear]  = useState<number>(new Date().getFullYear());
  const [filterAgent, setFilterAgent] = useState<string>("ALL");
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("users").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => setAgents(data ?? []));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);

    let query = supabase
      .from("csat_scores")
      .select("*, ticket:tickets(id, code, title), agent:users!csat_scores_agent_id_fkey(id, name)")
      .eq("month", filterMonth)
      .eq("year", filterYear)
      .order("created_at", { ascending: false });

    if (filterAgent !== "ALL") query = query.eq("agent_id", filterAgent);

    query.then(({ data }) => {
      setEntries(data ?? []);
      setLoading(false);
    });
  }, [filterMonth, filterYear, filterAgent]);

  // Aggregate stats
  const avg = entries.length > 0 ? entries.reduce((s, e) => s + e.score, 0) / entries.length : 0;
  const dist = [0,0,0,0,0,0];
  entries.forEach(e => { if (e.score >= 1 && e.score <= 5) dist[e.score]++; });

  const agentSummary: AgentSummary[] = Object.values(
    entries.reduce<Record<string, AgentSummary>>((acc, e) => {
      const id = e.agent?.id ?? "unknown";
      const name = e.agent?.name ?? "Unknown";
      if (!acc[id]) acc[id] = { id, name, avg: 0, count: 0 };
      acc[id].avg = (acc[id].avg * acc[id].count + e.score) / (acc[id].count + 1);
      acc[id].count++;
      return acc;
    }, {})
  ).sort((a, b) => b.avg - a.avg);

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="CSAT Scores" subtitle="Customer Satisfaction ratings by ticket" />

      <div className="flex-1 p-5 space-y-5">

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Month */}
          <div className="relative">
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(Number(e.target.value))}
              className="crm-input h-8 text-xs pr-7 appearance-none"
              style={{ paddingRight: "1.75rem" }}
            >
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          </div>
          {/* Year */}
          <div className="relative">
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="crm-input h-8 text-xs pr-7 appearance-none">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          </div>
          {/* Agent */}
          <div className="relative">
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="crm-input h-8 text-xs pr-7 appearance-none" style={{ minWidth: 140 }}>
              <option value="ALL">All Agents</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {MONTHS[filterMonth-1]} {filterYear} — {entries.length} score{entries.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="stat-card col-span-2 md:col-span-1 flex flex-col items-center justify-center py-6">
            <p className="text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: avg >= 4 ? "var(--success)" : avg >= 3 ? "var(--warning)" : avg > 0 ? "var(--danger)" : "var(--text-muted)" }}>
              {entries.length > 0 ? avg.toFixed(1) : "—"}
            </p>
            <div className="flex gap-0.5 mt-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-4 h-4" fill={s <= Math.round(avg) ? STAR_COLORS[Math.round(avg)] : "none"} style={{ color: s <= Math.round(avg) ? STAR_COLORS[Math.round(avg)] : "var(--text-muted)" }} />
              ))}
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>Average Score</p>
          </div>

          <div className="stat-card">
            <TrendingUp className="w-5 h-5 mb-2" style={{ color: "var(--gold-500)" }} />
            <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{entries.length}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ratings this period</p>
          </div>

          <div className="stat-card">
            <Award className="w-5 h-5 mb-2" style={{ color: "var(--success)" }} />
            <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--success)" }}>
              {entries.length > 0 ? Math.round((entries.filter(e => e.score >= 4).length / entries.length) * 100) : 0}%
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Satisfied (4-5 ★)</p>
          </div>

          <div className="stat-card">
            <AlertCircle className="w-5 h-5 mb-2" style={{ color: "var(--danger)" }} />
            <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--danger)" }}>
              {entries.length > 0 ? Math.round((entries.filter(e => e.score <= 2).length / entries.length) * 100) : 0}%
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Unhappy (1-2 ★)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Score Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>SCORE DISTRIBUTION</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[5,4,3,2,1].map(s => {
                const count = dist[s];
                const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 w-16 shrink-0">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3" fill={i <= s ? STAR_COLORS[s] : "none"} style={{ color: i <= s ? STAR_COLORS[s] : "var(--border)" }} />)}
                    </div>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "var(--black-600)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: STAR_COLORS[s] }} />
                    </div>
                    <span className="text-xs w-6 text-right shrink-0" style={{ color: "var(--text-muted)" }}>{count}</span>
                  </div>
                );
              })}
              {entries.length === 0 && <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No ratings this period</p>}
            </CardContent>
          </Card>

          {/* Agent Leaderboard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>AGENT SCORES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentSummary.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No data</p>
              ) : agentSummary.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold w-5 shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{a.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{a.count} rating{a.count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3.5 h-3.5" fill={STAR_COLORS[Math.round(a.avg)]} style={{ color: STAR_COLORS[Math.round(a.avg)] }} />
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{a.avg.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Score breakdown explanation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>SCORE GUIDE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { score: 5, label: "Very Satisfied", color: "#22c55e" },
                { score: 4, label: "Satisfied",      color: "#84cc16" },
                { score: 3, label: "Neutral",        color: "#f59e0b" },
                { score: 2, label: "Dissatisfied",   color: "#f97316" },
                { score: 1, label: "Very Unhappy",   color: "#ef4444" },
              ].map(s => (
                <div key={s.score} className="flex items-center gap-2.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3" fill={i <= s.score ? s.color : "none"} style={{ color: i <= s.score ? s.color : "var(--border)" }} />)}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Entries Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
              ALL RATINGS — {MONTHS[filterMonth-1]} {filterYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
            ) : entries.length === 0 ? (
              <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No CSAT scores for this period</p>
                <p className="text-xs mt-1">Rate resolved tickets from the ticket detail page</p>
              </div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr><th>Ticket</th><th>Agent</th><th>Score</th><th>Notes</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}>
                      <td>
                        {e.ticket ? (
                          <Link href={`/dashboard/tickets/${e.ticket.id}`} className="hover:underline" style={{ color: "var(--text-primary)" }}>
                            <p className="text-sm font-medium">{e.ticket.title}</p>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{e.ticket.code}</p>
                          </Link>
                        ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
                            {e.agent?.name?.split(" ").map(n => n[0]).join("").slice(0,2) ?? "?"}
                          </div>
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{e.agent?.name ?? "—"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className="w-3.5 h-3.5" fill={s <= e.score ? STAR_COLORS[e.score] : "none"} style={{ color: s <= e.score ? STAR_COLORS[e.score] : "var(--border)" }} />
                          ))}
                          <span className="text-xs ml-1 font-semibold" style={{ color: "var(--text-secondary)" }}>{e.score}/5</span>
                        </div>
                      </td>
                      <td>
                        <p className="text-xs max-w-[200px] truncate" style={{ color: "var(--text-muted)" }}>{e.notes || "—"}</p>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(e.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
