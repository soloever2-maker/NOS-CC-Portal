"use client";

import { useState, useEffect } from "react";
import { Target, Ticket, CheckCircle, Clock, Star } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface KPISetting {
  id: string; name: string; target: number; weight: number;
}

interface MyStats {
  totalTickets: number; resolvedTickets: number;
  openTickets: number; csatAvg: number; slaCompliance: number;
}

export default function MyKPIPage() {
  const [kpis, setKpis] = useState<KPISetting[]>([]);
  const [stats, setStats] = useState<MyStats>({ totalTickets: 0, resolvedTickets: 0, openTickets: 0, csatAvg: 0, slaCompliance: 0 });
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState("");
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("id, name").eq("supabase_id", user.id).single();
      if (!profile) return;
      setAgentName(profile.name);

      const [{ count: total }, { count: resolved }, { count: open }, { data: csat }, { data: kpiData }] = await Promise.all([
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", profile.id),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", profile.id).eq("status", "RESOLVED"),
        supabase.from("tickets").select("*", { count: "exact", head: true }).eq("assigned_to_id", profile.id).eq("status", "OPEN"),
        supabase.from("csat_scores").select("score").eq("agent_id", profile.id).eq("month", selectedMonth).eq("year", selectedYear),
        supabase.from("kpi_settings").select("*").eq("is_active", true),
      ]);

      const csatAvg = csat && csat.length > 0 ? Math.round((csat.reduce((s, c) => s + c.score, 0) / csat.length) * 20) : 0;
      const slaCompliance = total ? Math.round(((resolved ?? 0) / (total ?? 1)) * 100) : 0;

      setStats({ totalTickets: total ?? 0, resolvedTickets: resolved ?? 0, openTickets: open ?? 0, csatAvg, slaCompliance });
      setKpis(kpiData ?? []);
      setLoading(false);
    });
  }, [selectedMonth, selectedYear]);

  const getScore = (kpi: KPISetting): number => {
    if (kpi.name.includes("CSAT") || kpi.name.includes("Satisfaction")) return stats.csatAvg;
    if (kpi.name.includes("SLA")) return stats.slaCompliance;
    if (kpi.name.includes("CRM") || kpi.name.includes("Logging")) return stats.totalTickets > 0 ? 95 : 0;
    if (kpi.name.includes("Database")) return stats.totalTickets > 0 ? 90 : 0;
    if (kpi.name.includes("Engagement")) return stats.totalTickets > 0 ? 75 : 0;
    return 0;
  };

  const getScoreColor = (score: number, target: number) => {
    const pct = (score / target) * 100;
    if (pct >= 100) return "var(--success)";
    if (pct >= 80) return "var(--warning)";
    return "var(--danger)";
  };

  const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
  const overallScore = kpis.length > 0 && totalWeight > 0
    ? Math.min(Math.round(kpis.reduce((sum, kpi) => {
        const score = getScore(kpi);
        return sum + (score / kpi.target) * (kpi.weight / totalWeight) * 100;
      }, 0)), 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="My KPIs" subtitle={`${MONTHS[selectedMonth-1]} ${selectedYear} — ${agentName}`} />
      <div className="flex-1 p-6 space-y-6 max-w-4xl">

        {/* Overall Score */}
        <div className="crm-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Overall Performance Score</p>
            <p className="text-5xl font-bold mt-1" style={{ fontFamily: "'Playfair Display', serif", color: overallScore >= 80 ? "var(--success)" : overallScore >= 60 ? "var(--warning)" : "var(--danger)" }}>
              {loading ? "—" : `${overallScore}%`}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {overallScore >= 80 ? "🎯 On Target" : overallScore >= 60 ? "⚠️ Needs Improvement" : "❌ Below Target"}
            </p>
          </div>
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "var(--gold-glow)", border: "2px solid var(--border-strong)" }}>
            <Target className="w-10 h-10" style={{ color: "var(--gold-500)" }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Tickets", value: stats.totalTickets, icon: Ticket, color: "var(--gold-500)" },
            { label: "Resolved", value: stats.resolvedTickets, icon: CheckCircle, color: "var(--success)" },
            { label: "Open", value: stats.openTickets, icon: Clock, color: "var(--warning)" },
            { label: "CSAT Score", value: `${stats.csatAvg}%`, icon: Star, color: "var(--info)" },
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

        {/* KPI Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>KPI BREAKDOWN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
            ) : kpis.map(kpi => {
              const score = getScore(kpi);
              const pct = Math.min(Math.round((score / kpi.target) * 100), 100);
              const color = getScoreColor(score, kpi.target);
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
      </div>
    </div>
  );
}
