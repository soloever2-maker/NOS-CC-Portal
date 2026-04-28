"use client";
// src/app/dashboard/my-kpi/page.tsx

import { useState, useEffect } from "react";
import { Target, Ticket, CheckCircle, Clock, Star, Shield } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  getKPIScore, getKPIScoreColor,
  calcOperationalScore, calcCompetencyScore, calcOverallScore,
  type KPISetting, type CompetencyScores,
} from "@/lib/kpi-utils";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MyKPIPage() {
  const [kpis,          setKpis]          = useState<KPISetting[]>([]);
  const [stats,         setStats]         = useState({ totalTickets: 0, resolvedTickets: 0, openTickets: 0, csatAvg: 0, slaCompliance: 0 });
  const [comp,          setComp]          = useState<CompetencyScores>({ trust: 0, client: 0, results: 0 });
  const [loading,       setLoading]       = useState(true);
  const [agentName,     setAgentName]     = useState("");
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("id, name").eq("supabase_id", user.id).single();
      if (!profile) return;
      setAgentName(profile.name);

      const [{ count: total }, { count: resolved }, { count: open }, { data: csat }, { data: kpiData }, { data: compData }] = await Promise.all([
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", profile.id),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", profile.id).in("status", ["RESOLVED", "CLOSED"]),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", profile.id).eq("status", "OPEN"),
        supabase.from("csat_scores").select("score").eq("agent_id", profile.id).eq("month", selectedMonth).eq("year", selectedYear),
        supabase.from("kpi_settings").select("*").eq("is_active", true).order("weight", { ascending: false }),
        supabase.from("competency_scores").select("trust, client, results").eq("agent_id", profile.id).eq("month", selectedMonth).eq("year", selectedYear).maybeSingle(),
      ]);

      const csatAvg      = csat && csat.length > 0 ? Math.min(Math.round((csat.reduce((s, c) => s + c.score, 0) / csat.length) * 20), 100) : 0;
      const slaCompliance = total ? Math.round(((resolved ?? 0) / (total ?? 1)) * 100) : 0;

      setStats({ totalTickets: total ?? 0, resolvedTickets: resolved ?? 0, openTickets: open ?? 0, csatAvg, slaCompliance });
      setKpis(kpiData ?? []);
      if (compData) setComp({ trust: compData.trust, client: compData.client, results: compData.results });
      setLoading(false);
    });
  }, [selectedMonth, selectedYear]);

  const opScore   = calcOperationalScore(kpis, stats);
  const compScore = calcCompetencyScore(comp);
  const overall   = calcOverallScore(kpis, stats, comp);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="My KPIs" subtitle={`${MONTHS[selectedMonth-1]} ${selectedYear} — ${agentName}`} />
      <div className="flex-1 p-6 space-y-6 max-w-4xl">

        {/* Overall Score */}
        <div className="crm-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Overall Performance Score</p>
            <p className="text-5xl font-bold mt-1" style={{ fontFamily: "'Playfair Display', serif", color: overall >= 80 ? "var(--success)" : overall >= 60 ? "var(--warning)" : "var(--danger)" }}>
              {loading ? "—" : `${overall}%`}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {overall >= 80 ? "🎯 On Target" : overall >= 60 ? "⚠️ Needs Improvement" : "❌ Below Target"}
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="crm-card px-3 py-2">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Operational (70%)</p>
              <p className="text-lg font-bold" style={{ color: "var(--gold-500)" }}>{loading ? "—" : `${opScore}%`}</p>
            </div>
            <div className="crm-card px-3 py-2">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Competencies (30%)</p>
              <p className="text-lg font-bold" style={{ color: "var(--info)" }}>{loading ? "—" : `${compScore}%`}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Tickets",  value: stats.totalTickets,   icon: Ticket,      color: "var(--gold-500)" },
            { label: "Resolved",       value: stats.resolvedTickets, icon: CheckCircle, color: "var(--success)"  },
            { label: "Open",           value: stats.openTickets,     icon: Clock,       color: "var(--warning)"  },
            { label: "CSAT Score",     value: `${stats.csatAvg}%`,   icon: Star,        color: "var(--info)"     },
          ].map(s => (
            <div key={s.label} className="crm-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                  {loading ? "—" : s.value}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Operational KPIs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>OPERATIONAL KPIs</CardTitle>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>70% of score</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
            ) : kpis.map(kpi => {
              const score = getKPIScore(kpi, stats);
              const pct   = Math.min(Math.round((score / kpi.target) * 100), 100);
              const color = getKPIScoreColor(score, kpi.target);
              return (
                <div key={kpi.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{kpi.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Weight: {kpi.weight}% · Target: {kpi.target}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color, fontFamily: "'Playfair Display', serif" }}>{score}%</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{pct}% of target</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--black-600)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Core Competencies */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <Shield className="w-3.5 h-3.5" /> CORE COMPETENCIES
              </CardTitle>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "var(--info)" }}>30% of score · Set by manager</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
            ) : ([
              { key: "trust",   label: "Trust & Accountability",  val: comp.trust   },
              { key: "client",  label: "Client-Centric",          val: comp.client  },
              { key: "results", label: "Driven by Results",       val: comp.results },
            ].map(({ key, label, val }) => {
              const color = val >= 8 ? "var(--success)" : val >= 5 ? "var(--warning)" : "var(--danger)";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color, fontFamily: "'Playfair Display', serif" }}>{val}/10</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{val * 10}% of target</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "var(--black-600)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${val * 10}%`, background: color }} />
                  </div>
                </div>
              );
            }))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
