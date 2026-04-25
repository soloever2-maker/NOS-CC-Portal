"use client";

import { useState, useEffect, useCallback } from "react";
import { Edit2, Save, X, Users } from "lucide-react";
import { Topbar }   from "@/components/layout/topbar";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

/* ── Types ───────────────────────────────────────────────── */
interface KPISetting {
  id: string; name: string; target: number; weight: number;
  reporting_frequency: string; is_active: boolean;
}
interface AgentKPI {
  agentId: string; agentName: string;
  totalTickets: number; resolvedTickets: number;
  // Real computed scores
  csatScore: number;        // avg(csat_scores) × 20
  slaScore: number;         // resolved_within_sla ÷ total_resolved × 100
  crmScore: number;         // interactions ÷ tickets × 100 (capped 100)
  dbScore: number;          // tickets with complete data ÷ total × 100
  engagementScore: number;  // tickets with REACHED contact ÷ total × 100
  coreScore: number;        // manually set by manager (0-100)
  kpis: KPISetting[];
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── KPI score resolver ──────────────────────────────────── */
function getScore(kpi: KPISetting, agent: AgentKPI): number {
  const n = kpi.name.toLowerCase();
  if (n.includes("csat") || n.includes("satisfaction"))  return agent.csatScore;
  if (n.includes("sla"))                                  return agent.slaScore;
  if (n.includes("crm")  || n.includes("logging"))       return agent.crmScore;
  if (n.includes("database") || n.includes("accuracy"))  return agent.dbScore;
  if (n.includes("engagement") || n.includes("proactive")) return agent.engagementScore;
  return 0;
}

function scoreColor(score: number, target: number) {
  const pct = (score / target) * 100;
  if (pct >= 100) return "var(--success)";
  if (pct >= 80)  return "var(--warning)";
  return "var(--danger)";
}

function overallScore(kpis: KPISetting[], agent: AgentKPI): number {
  const activeKpis   = kpis.filter(k => k.is_active);
  const totalWeight  = activeKpis.reduce((s, k) => s + k.weight, 0);
  if (!totalWeight) return 0;
  const weighted = activeKpis.reduce((s, k) => {
    const score = getScore(k, agent);
    return s + (score / k.target) * k.weight;
  }, 0);
  // 70% from KPIs + 30% from core competencies
  const kpiScore  = Math.min(Math.round((weighted / totalWeight) * 100), 100);
  const combined  = Math.round(kpiScore * 0.7 + agent.coreScore * 0.3);
  return Math.min(combined, 100);
}

/* ═══════════════════════════════════════════════════════════ */
export default function KPIDashboardPage() {
  const [kpiSettings,  setKpiSettings]  = useState<KPISetting[]>([]);
  const [agentKPIs,    setAgentKPIs]    = useState<AgentKPI[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editValues,   setEditValues]   = useState({ target: 0, weight: 0 });
  const [editingCore,  setEditingCore]  = useState<string | null>(null);
  const [coreVal,      setCoreVal]      = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [{ data: kpis }, { data: agentList }] = await Promise.all([
      supabase.from("kpi_settings").select("*").eq("is_active", true),
      supabase.from("users").select("id, name, email, role")
        .eq("is_active", true).in("role", ["AGENT","MANAGER"]),
    ]);

    setKpiSettings(kpis ?? []);
    const perfs: AgentKPI[] = [];

    for (const agent of agentList ?? []) {
      // ── Fetch all needed data in parallel ──────────────
      const [
        { count: total },
        { data: resolvedTickets },
        { data: csat },
        { count: interactions },
        { count: completeData },
        { count: reached },
      ] = await Promise.all([
        // Total tickets
        supabase.from("tickets").select("*", { count:"exact", head:true })
          .eq("assigned_to_id", agent.id),

        // Resolved tickets with SLA data (for SLA compliance)
        supabase.from("tickets").select("created_at, resolved_at, sla_hours")
          .eq("assigned_to_id", agent.id)
          .in("status", ["RESOLVED","CLOSED"])
          .not("resolved_at", "is", null),

        // CSAT scores for selected month
        supabase.from("csat_scores").select("score")
          .eq("agent_id", agent.id)
          .eq("month", selectedMonth)
          .eq("year", selectedYear),

        // CRM Logging: interactions logged by this agent
        supabase.from("interactions").select("*", { count:"exact", head:true })
          .eq("agent_id", agent.id),

        // Database Accuracy: tickets with complete required fields
        supabase.from("tickets").select("*", { count:"exact", head:true })
          .eq("assigned_to_id", agent.id)
          .not("client_id", "is", null)
          .not("category",  "is", null)
          .not("source",    "is", null),

        // Proactive Engagement: tickets where client was REACHED
        supabase.from("tickets").select("*", { count:"exact", head:true })
          .eq("assigned_to_id", agent.id)
          .in("contact_status", ["REACHED","CALLBACK_REQUESTED"]),
      ]);

      const totalCount = total ?? 0;

      // ① CSAT
      const csatScore = csat && csat.length > 0
        ? Math.round((csat.reduce((s, c) => s + c.score, 0) / csat.length) * 20)
        : 0;

      // ② SLA Compliance — resolved within SLA ÷ total resolved
      const resolved = resolvedTickets ?? [];
      let withinSLA = 0;
      for (const t of resolved) {
        if (!t.sla_hours || !t.resolved_at) continue;
        const elapsed = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 3600000;
        if (elapsed <= t.sla_hours) withinSLA++;
      }
      const slaScore = resolved.length > 0
        ? Math.round((withinSLA / resolved.length) * 100)
        : 0;

      // ③ CRM Logging — interactions ÷ tickets (capped 100)
      const crmScore = totalCount > 0
        ? Math.min(Math.round(((interactions ?? 0) / totalCount) * 100), 100)
        : 0;

      // ④ Database Accuracy
      const dbScore = totalCount > 0
        ? Math.round(((completeData ?? 0) / totalCount) * 100)
        : 0;

      // ⑤ Proactive Engagement
      const engagementScore = totalCount > 0
        ? Math.round(((reached ?? 0) / totalCount) * 100)
        : 0;

      perfs.push({
        agentId: agent.id, agentName: agent.name,
        totalTickets: totalCount, resolvedTickets: resolved.length,
        csatScore, slaScore, crmScore, dbScore, engagementScore,
        coreScore: 0,
        kpis: kpis ?? [],
      });
    }

    setAgentKPIs(perfs);
    setLoading(false);
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveKPI = async (id: string) => {
    const supabase = createClient();
    await supabase.from("kpi_settings")
      .update({ target: editValues.target, weight: editValues.weight, updated_at: new Date().toISOString() })
      .eq("id", id);
    setKpiSettings(prev => prev.map(k => k.id === id ? { ...k, ...editValues } : k));
    setEditingId(null);
  };

  const saveCoreScore = (agentId: string) => {
    setAgentKPIs(prev => prev.map(a =>
      a.agentId === agentId ? { ...a, coreScore: Math.min(Math.max(coreVal, 0), 100) } : a
    ));
    setEditingCore(null);
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="KPI Dashboard" subtitle="Monitor team performance against targets" />
      <div className="flex-1 p-6 space-y-6">

        {/* ── Period Selector ──────────────────────────── */}
        <div className="flex items-center gap-3">
          <p className="text-sm" style={{ color:"var(--text-muted)" }}>Period:</p>
          <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}
            className="crm-input text-xs h-8 px-2">
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="crm-input text-xs h-8 px-2">
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* ── KPI Configuration ────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ color:"var(--text-secondary)" }}>KPI CONFIGURATION</CardTitle>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background:"var(--gold-glow)", color:"var(--gold-500)" }}>Admin Only</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>KPI</th><th>How It&apos;s Calculated</th>
                  <th>Target</th><th>Weight</th><th>Frequency</th><th></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { match: ["csat","satisfaction"],           calc: "avg(CSAT scores) × 20" },
                  { match: ["crm","logging"],                 calc: "Interactions logged ÷ Total tickets" },
                  { match: ["database","accuracy"],           calc: "Tickets with complete data ÷ Total" },
                  { match: ["sla"],                           calc: "Resolved within SLA ÷ Total resolved" },
                  { match: ["engagement","proactive"],        calc: "Clients reached ÷ Total tickets" },
                ].map(({ match, calc }) => {
                  const k = kpiSettings.find(s => match.some(m => s.name.toLowerCase().includes(m)));
                  if (!k) return null;
                  return (
                    <tr key={k.id}>
                      <td><span className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>{k.name}</span></td>
                      <td><span className="text-xs font-mono" style={{ color:"var(--text-muted)" }}>{calc}</span></td>
                      <td>
                        {editingId === k.id
                          ? <Input type="number" value={editValues.target}
                              onChange={e => setEditValues(p => ({ ...p, target: parseFloat(e.target.value) }))}
                              className="w-20 h-7 text-xs" />
                          : <span className="text-sm" style={{ color:"var(--text-secondary)" }}>{k.target}%</span>}
                      </td>
                      <td>
                        {editingId === k.id
                          ? <Input type="number" value={editValues.weight}
                              onChange={e => setEditValues(p => ({ ...p, weight: parseFloat(e.target.value) }))}
                              className="w-20 h-7 text-xs" />
                          : <span className="text-sm" style={{ color:"var(--gold-400)" }}>{k.weight}%</span>}
                      </td>
                      <td><span className="text-xs capitalize" style={{ color:"var(--text-muted)" }}>{k.reporting_frequency}</span></td>
                      <td>
                        {editingId === k.id
                          ? <div className="flex gap-1">
                              <button onClick={() => saveKPI(k.id)} className="p-1.5 rounded" style={{ color:"var(--success)" }}><Save className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded" style={{ color:"var(--danger)" }}><X className="w-3.5 h-3.5" /></button>
                            </div>
                          : <button onClick={() => { setEditingId(k.id); setEditValues({ target:k.target, weight:k.weight }); }}
                              className="p-1.5 rounded" style={{ color:"var(--text-muted)" }}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ── Agent KPI Cards ───────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color:"var(--text-secondary)" }}>
            <Users className="w-4 h-4" />
            TEAM PERFORMANCE — {MONTHS[selectedMonth-1]} {selectedYear}
          </h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" />
            </div>
          ) : agentKPIs.length === 0 ? (
            <div className="crm-card p-10 text-center" style={{ color:"var(--text-muted)" }}>No agents found</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {agentKPIs.map(agent => {
                const overall = overallScore(kpiSettings, agent);
                const overallColor = overall >= 80 ? "var(--success)" : overall >= 60 ? "var(--warning)" : "var(--danger)";

                return (
                  <Card key={agent.agentId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background:"var(--gold-glow)", color:"var(--gold-500)", border:"1px solid var(--border-strong)" }}>
                            {agent.agentName.split(" ").map(n=>n[0]).join("").slice(0,2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color:"var(--text-primary)" }}>{agent.agentName}</p>
                            <p className="text-xs" style={{ color:"var(--text-muted)" }}>
                              {agent.totalTickets} tickets · {agent.resolvedTickets} resolved
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold"
                            style={{ fontFamily:"'Playfair Display',serif", color:overallColor }}>
                            {overall}%
                          </p>
                          <p className="text-[10px]" style={{ color:"var(--text-muted)" }}>Overall Score</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2.5">
                      {/* ── KPI Bars ── */}
                      {kpiSettings.map(kpi => {
                        const score = getScore(kpi, agent);
                        const pct   = Math.min(Math.round((score / kpi.target) * 100), 100);
                        const color = scoreColor(score, kpi.target);
                        return (
                          <div key={kpi.id}>
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <span className="text-xs" style={{ color:"var(--text-secondary)" }}>{kpi.name}</span>
                                <span className="text-[10px] ml-2" style={{ color:"var(--text-muted)" }}>W:{kpi.weight}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold" style={{ color }}>{score}%</span>
                                <span className="text-[10px]" style={{ color:"var(--text-muted)" }}>/ {kpi.target}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background:"var(--black-600)" }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width:`${pct}%`, background:color }} />
                            </div>
                          </div>
                        );
                      })}

                      {/* ── Core Competencies (30%) ── */}
                      <div className="pt-2 mt-2" style={{ borderTop:"1px dashed var(--border)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-xs font-semibold" style={{ color:"var(--text-secondary)" }}>
                              Core Competencies
                            </span>
                            <span className="text-[10px] ml-2" style={{ color:"var(--text-muted)" }}>30% of total</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingCore === agent.agentId ? (
                              <>
                                <Input type="number" min={0} max={100} value={coreVal}
                                  onChange={e => setCoreVal(parseInt(e.target.value)||0)}
                                  className="w-16 h-6 text-xs text-center" />
                                <button onClick={() => saveCoreScore(agent.agentId)} style={{ color:"var(--success)" }}>
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingCore(null)} style={{ color:"var(--danger)" }}>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-semibold"
                                  style={{ color: scoreColor(agent.coreScore, 70) }}>
                                  {agent.coreScore}%
                                </span>
                                <button onClick={() => { setEditingCore(agent.agentId); setCoreVal(agent.coreScore); }}
                                  className="p-1 rounded" style={{ color:"var(--text-muted)" }}>
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] space-y-0.5 mt-1" style={{ color:"var(--text-muted)" }}>
                          <p>· Trust & Accountability</p>
                          <p>· Client-Centric</p>
                          <p>· Driven by Results</p>
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
