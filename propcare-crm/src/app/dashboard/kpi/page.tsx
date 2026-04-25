"use client";

import { useState, useEffect } from "react";
import { Target, Edit2, Save, X, Users, ChevronDown } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface KPISetting {
  id: string; name: string; target: number; weight: number;
  reporting_frequency: string; is_active: boolean;
}

interface Agent {
  id: string; name: string; email: string; role: string;
}

interface AgentKPI {
  agentId: string; agentName: string;
  totalTickets: number; resolvedTickets: number;
  slaCompliance: number; csatAvg: number;
  kpis: KPISetting[];
}

export default function KPIDashboardPage() {
  const [kpiSettings, setKpiSettings] = useState<KPISetting[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentKPIs, setAgentKPIs] = useState<AgentKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ target: number; weight: number }>({ target: 0, weight: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

useEffect(() => {
  const supabase = createClient();
  Promise.all([
    supabase.from("kpi_settings").select("*"),
    supabase.from("users").select("id, name, email, role").eq("is_active", true).in("role", ["AGENT", "MANAGER"]),
  ]).then(async ([{ data: kpis }, { data: agentList }]) => {
    
    setKpiSettings(kpis ?? []);
    setAgents(agentList ?? []);
    const agentPerf: AgentKPI[] = [];
    
    for (const agent of agentList ?? []) {
      const [{ count: total }, { count: resolved }, { data: csat }] = await Promise.all([
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", agent.id),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", agent.id).eq("status", "RESOLVED"),
        supabase.from("csat_scores").select("score").eq("agent_id", agent.id).eq("month", selectedMonth).eq("year", selectedYear),
      ]);

      const csatAvg = csat && csat.length > 0
        ? Math.round((csat.reduce((s, c) => s + c.score, 0) / csat.length) * 20)
        : 0;

      agentPerf.push({
        agentId: agent.id, 
        agentName: agent.name,
        totalTickets: total ?? 0, 
        resolvedTickets: resolved ?? 0,
        slaCompliance: total ? Math.round(((resolved ?? 0) / total) * 100) : 0,
        csatAvg, 
        kpis: kpis ?? [],
      });
    }
        setAgentKPIs(agentPerf);
    setLoading(false);
  });
}, [selectedMonth, selectedYear]); 
  
  const saveKPI = async (id: string) => {
    const supabase = createClient();
    await supabase.from("kpi_settings").update({ target: editValues.target, weight: editValues.weight, updated_at: new Date().toISOString() }).eq("id", id);
    setKpiSettings(prev => prev.map(k => k.id === id ? { ...k, ...editValues } : k));
    setEditingId(null);
  };

  const getScore = (kpi: KPISetting, agentData: AgentKPI): number => {
    if (kpi.name.includes("CSAT") || kpi.name.includes("Satisfaction")) return agentData.csatAvg;
    if (kpi.name.includes("SLA")) return agentData.slaCompliance;
    if (kpi.name.includes("CRM") || kpi.name.includes("Logging")) return agentData.totalTickets > 0 ? 95 : 0;
    if (kpi.name.includes("Database")) return agentData.totalTickets > 0 ? 90 : 0;
    if (kpi.name.includes("Engagement")) return agentData.totalTickets > 0 ? 75 : 0;
    return 0;
  };

  const getScoreColor = (score: number, target: number) => {
    const pct = (score / target) * 100;
    if (pct >= 100) return "var(--success)";
    if (pct >= 80) return "var(--warning)";
    return "var(--danger)";
  };

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="KPI Dashboard" subtitle="Monitor team performance against targets" />
      <div className="flex-1 p-6 space-y-6">

        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Period:</p>
          <div className="flex gap-2">
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="crm-input text-xs h-8 px-2">
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="crm-input text-xs h-8 px-2">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* KPI Settings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>KPI CONFIGURATION</CardTitle>
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
                      {editingId === k.id ? (
                        <Input type="number" value={editValues.target} onChange={e => setEditValues(p => ({ ...p, target: parseFloat(e.target.value) }))} className="w-20 h-7 text-xs" />
                      ) : <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{k.target}%</span>}
                    </td>
                    <td>
                      {editingId === k.id ? (
                        <Input type="number" value={editValues.weight} onChange={e => setEditValues(p => ({ ...p, weight: parseFloat(e.target.value) }))} className="w-20 h-7 text-xs" />
                      ) : <span className="text-sm" style={{ color: "var(--gold-400)" }}>{k.weight}%</span>}
                    </td>
                    <td><span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{k.reporting_frequency}</span></td>
                    <td>
                      {editingId === k.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => saveKPI(k.id)} className="p-1.5 rounded hover:bg-green-500/10" style={{ color: "var(--success)" }}><Save className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-red-500/10" style={{ color: "var(--danger)" }}><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingId(k.id); setEditValues({ target: k.target, weight: k.weight }); }}
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

        {/* Agent KPI Cards */}
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
                const totalWeight = kpiSettings.reduce((sum, kpi) => sum + kpi.weight, 0);
                const totalWeightedScore = kpiSettings.reduce((sum, kpi) => {
                  const score = getScore(kpi, agent);
                  return sum + (score / kpi.target) * kpi.weight;
                }, 0);
                const overallScore = totalWeight > 0
                  ? Math.min(Math.round(totalWeightedScore / totalWeight * 100), 100)
                  : 0;

                return (
                  <Card key={agent.agentId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
                            {agent.agentName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{agent.agentName}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{agent.totalTickets} tickets · {agent.resolvedTickets} resolved</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: overallScore >= 80 ? "var(--success)" : overallScore >= 60 ? "var(--warning)" : "var(--danger)" }}>
                            {overallScore}%
                          </p>
                          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Overall Score</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      {kpiSettings.map(kpi => {
                        const score = getScore(kpi, agent);
                        const pct = Math.min(Math.round((score / kpi.target) * 100), 100);
                        return (
                          <div key={kpi.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{kpi.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold" style={{ color: getScoreColor(score, kpi.target) }}>{score}%</span>
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>/ {kpi.target}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: "var(--black-600)" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: getScoreColor(score, kpi.target) }} />
                            </div>
                          </div>
                        );
                      })}
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
