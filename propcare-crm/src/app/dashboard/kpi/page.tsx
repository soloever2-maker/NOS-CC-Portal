"use client";
// src/app/dashboard/kpi/page.tsx

import { useState, useEffect, useCallback } from "react";
import { Edit2, Save, X, Users, Shield } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  getKPIScore, getKPIScoreColor,
  calcOperationalScore, calcCompetencyScore, calcOverallScore,
  type KPISetting, type CompetencyScores,
} from "@/lib/kpi-utils";

interface AgentKPI {
  agentId: string; agentName: string;
  totalTickets: number; resolvedTickets: number;
  slaCompliance: number; csatAvg: number;
  comp: CompetencyScores;
  compId: string | null;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function KPIDashboardPage() {
  const [kpiSettings,   setKpiSettings]   = useState<KPISetting[]>([]);
  const [agentKPIs,     setAgentKPIs]     = useState<AgentKPI[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [editingKPI,    setEditingKPI]    = useState<string | null>(null);
  const [editValues,    setEditValues]    = useState({ target: 0, weight: 0 });
  const [editingComp,   setEditingComp]   = useState<string | null>(null);
  const [compEdit,      setCompEdit]      = useState<CompetencyScores>({ trust: 0, client: 0, results: 0 });
  const [savingComp,    setSavingComp]    = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const { data: me } = await supabase.from("users").select("id").eq("supabase_id", user?.id ?? "").single();
    if (me) setCurrentUserId(me.id);

    const [{ data: kpis }, { data: agentList }] = await Promise.all([
      supabase.from("kpi_settings").select("*").eq("is_active", true).order("weight", { ascending: false }),
      supabase.from("users").select("id, name").eq("is_active", true).in("role", ["AGENT", "MANAGER"]),
    ]);

    setKpiSettings(kpis ?? []);

    const agentPerf: AgentKPI[] = [];
    for (const agent of agentList ?? []) {
      const [{ count: total }, { count: resolved }, { data: csat }, { data: compData }] = await Promise.all([
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", agent.id),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", agent.id).in("status", ["RESOLVED", "CLOSED"]),
        supabase.from("csat_scores").select("score").eq("agent_id", agent.id).eq("month", selectedMonth).eq("year", selectedYear),
        supabase.from("competency_scores").select("*").eq("agent_id", agent.id).eq("month", selectedMonth).eq("year", selectedYear).maybeSingle(),
      ]);

      const csatAvg = csat && csat.length > 0
        ? Math.min(Math.round((csat.reduce((s, c) => s + c.score, 0) / csat.length) * 20), 100)
        : 0;

      agentPerf.push({
        agentId:        agent.id,
        agentName:      agent.name,
        totalTickets:   total ?? 0,
        resolvedTickets: resolved ?? 0,
        slaCompliance:  total ? Math.round(((resolved ?? 0) / total) * 100) : 0,
        csatAvg,
        comp:   compData ? { trust: compData.trust, client: compData.client, results: compData.results } : { trust: 0, client: 0, results: 0 },
        compId: compData?.id ?? null,
      });
    }

    setAgentKPIs(agentPerf);
    setLoading(false);
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveKPI = async (id: string) => {
    const supabase = createClient();
    await supabase.from("kpi_settings").update({ target: editValues.target, weight: editValues.weight, updated_at: new Date().toISOString() }).eq("id", id);
    setKpiSettings(prev => prev.map(k => k.id === id ? { ...k, ...editValues } : k));
    setEditingKPI(null);
  };

  const saveComp = async (agent: AgentKPI) => {
    setSavingComp(true);
    const supabase = createClient();
    const payload = {
      agent_id: agent.agentId,
      month: selectedMonth,
      year: selectedYear,
      trust: compEdit.trust,
      client: compEdit.client,
      results: compEdit.results,
      scored_by_id: currentUserId,
      updated_at: new Date().toISOString(),
    };
    if (agent.compId) {
      await supabase.from("competency_scores").update(payload).eq("id", agent.compId);
    } else {
      await supabase.from("competency_scores").insert({ ...payload, id: crypto.randomUUID() });
    }
    setSavingComp(false);
    setEditingComp(null);
    loadData();
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="KPI Dashboard" subtitle="Monitor team performance against targets" />
      <div className="flex-1 p-6 space-y-6">

        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Period:</p>
          <div className="flex gap-2">
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="crm-input text-xs h-8 px-2">
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="crm-input text-xs h-8 px-2">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* KPI Settings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>KPI CONFIGURATION — OPERATIONAL (70%)</CardTitle>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>Admin Only</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="crm-table">
              <thead><tr><th>KPI</th><th>Target</th><th>Weight</th><th>Frequency</th><th></th></tr></thead>
              <tbody>
                {kpiSettings.map(k => (
                  <tr key={k.id}>
                    <td><span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{k.name}</span></td>
                    <td>
                      {editingKPI === k.id
                        ? <Input type="number" value={editValues.target} onChange={e => setEditValues(p => ({ ...p, target: parseFloat(e.target.value) }))} className="w-20 h-7 text-xs" />
                        : <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{k.target}%</span>}
                    </td>
                    <td>
                      {editingKPI === k.id
                        ? <Input type="number" value={editValues.weight} onChange={e => setEditValues(p => ({ ...p, weight: parseFloat(e.target.value) }))} className="w-20 h-7 text-xs" />
                        : <span className="text-sm" style={{ color: "var(--gold-400)" }}>{k.weight}%</span>}
                    </td>
                    <td><span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{k.reporting_frequency}</span></td>
                    <td>
                      {editingKPI === k.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveKPI(k.id)} className="p-1.5 rounded hover:bg-green-500/10" style={{ color: "var(--success)" }}><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingKPI(null)} className="p-1.5 rounded hover:bg-red-500/10" style={{ color: "var(--danger)" }}><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingKPI(k.id); setEditValues({ target: k.target, weight: k.weight }); }}
                          className="p-1.5 rounded transition-all hover:bg-[var(--gold-glow)]" style={{ color: "var(--text-muted)" }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Agent Cards */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Users className="w-4 h-4" /> TEAM PERFORMANCE — {MONTHS[selectedMonth-1]} {selectedYear}
          </h3>
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
          ) : agentKPIs.length === 0 ? (
            <div className="crm-card p-10 text-center" style={{ color: "var(--text-muted)" }}>No agents found</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {agentKPIs.map(agent => {
                const opScore   = calcOperationalScore(kpiSettings, agent);
                const compScore = calcCompetencyScore(agent.comp);
                const overall   = calcOverallScore(kpiSettings, agent, agent.comp);
                const isEditing = editingComp === agent.agentId;

                return (
                  <Card key={agent.agentId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
                            {agent.agentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{agent.agentName}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{agent.totalTickets} tickets · {agent.resolvedTickets} resolved</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: overall >= 80 ? "var(--success)" : overall >= 60 ? "var(--warning)" : "var(--danger)" }}>
                            {overall}%
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Overall Score</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Operational KPIs */}
                      <div>
                        <p className="text-[11px] font-semibold mb-2 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                          <span>OPERATIONAL KPIs</span>
                          <span style={{ color: "var(--gold-500)" }}>{opScore}% × 70%</span>
                        </p>
                        <div className="space-y-2">
                          {kpiSettings.map(kpi => {
                            const score = getKPIScore(kpi, agent);
                            const pct   = Math.min(Math.round((score / kpi.target) * 100), 100);
                            const color = getKPIScoreColor(score, kpi.target);
                            return (
                              <div key={kpi.id}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{kpi.name}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold" style={{ color }}>{score}%</span>
                                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>/ {kpi.target}%</span>
                                  </div>
                                </div>
                                <div className="h-1.5 rounded-full" style={{ background: "var(--black-600)" }}>
                                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Core Competencies */}
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                            <Shield className="w-3 h-3" /> CORE COMPETENCIES
                            <span style={{ color: "var(--gold-500)" }}>{compScore}% × 30%</span>
                          </p>
                          {!isEditing ? (
                            <button onClick={() => { setEditingComp(agent.agentId); setCompEdit({ ...agent.comp }); }}
                              className="p-1 rounded hover:bg-[var(--gold-glow)]" style={{ color: "var(--text-muted)" }}>
                              <Edit2 className="w-3 h-3" />
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              <button onClick={() => saveComp(agent)} disabled={savingComp}
                                className="p-1 rounded hover:bg-green-500/10" style={{ color: "var(--success)" }}>
                                <Save className="w-3 h-3" />
                              </button>
                              <button onClick={() => setEditingComp(null)}
                                className="p-1 rounded hover:bg-red-500/10" style={{ color: "var(--danger)" }}>
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          {([
                            { key: "trust",   label: "Trust & Accountability" },
                            { key: "client",  label: "Client-Centric" },
                            { key: "results", label: "Driven by Results" },
                          ] as const).map(({ key, label }) => {
                            const val   = isEditing ? compEdit[key] : agent.comp[key];
                            const color = val >= 8 ? "var(--success)" : val >= 5 ? "var(--warning)" : "var(--danger)";
                            return (
                              <div key={key}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span>
                                  {isEditing ? (
                                    <input type="number" min={0} max={10} step={0.5}
                                      value={compEdit[key]}
                                      onChange={e => setCompEdit(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                                      className="w-14 h-6 text-xs text-center rounded border"
                                      style={{ background: "var(--black-700)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                                    />
                                  ) : (
                                    <span className="text-xs font-semibold" style={{ color }}>{val}/10</span>
                                  )}
                                </div>
                                {!isEditing && (
                                  <div className="h-1.5 rounded-full" style={{ background: "var(--black-600)" }}>
                                    <div className="h-full rounded-full transition-all" style={{ width: `${val * 10}%`, background: color }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
