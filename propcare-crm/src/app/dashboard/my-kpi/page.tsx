"use client";

import { useState, useEffect } from "react";
import { Target, Ticket, CheckCircle, Clock, Star } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface KPISetting {
  id: string; name: string; target: number; weight: number; is_active: boolean;
}

interface MyStats {
  totalTickets:    number;
  resolvedTickets: number;
  openTickets:     number;
  csatScore:       number; // avg(csat) × 20
  slaScore:        number; // resolved within SLA ÷ total resolved × 100
  crmScore:        number; // interactions ÷ tickets × 100 (capped 100)
  dbScore:         number; // tickets with complete data ÷ total × 100
  engagementScore: number; // REACHED tickets ÷ total × 100
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getScore(kpi: KPISetting, stats: MyStats): number {
  const n = kpi.name.toLowerCase();
  if (n.includes("csat") || n.includes("satisfaction"))    return stats.csatScore;
  if (n.includes("sla"))                                    return stats.slaScore;
  if (n.includes("crm")  || n.includes("logging"))         return stats.crmScore;
  if (n.includes("database") || n.includes("accuracy"))    return stats.dbScore;
  if (n.includes("engagement") || n.includes("proactive")) return stats.engagementScore;
  return 0;
}

function scoreColor(score: number, target: number) {
  const pct = (score / target) * 100;
  if (pct >= 100) return "var(--success)";
  if (pct >= 80)  return "var(--warning)";
  return "var(--danger)";
}

export default function MyKPIPage() {
  const [kpis,    setKpis]    = useState<KPISetting[]>([]);
  const [stats,   setStats]   = useState<MyStats>({
    totalTickets:0, resolvedTickets:0, openTickets:0,
    csatScore:0, slaScore:0, crmScore:0, dbScore:0, engagementScore:0,
  });
  const [loading,   setLoading]   = useState(true);
  const [agentName, setAgentName] = useState("");
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear]  = useState(new Date().getFullYear());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("users").select("id, name").eq("supabase_id", user.id).single();
      if (!profile) return;
      setAgentName(profile.name);

      const [
        { count: total },
        { data: resolvedData },
        { count: open },
        { data: csat },
        { data: kpiData },
        { count: interactions },
        { count: completeData },
        { count: reached },
      ] = await Promise.all([
        // Total tickets
        supabase.from("tickets").select("*", { count:"exact", head:true })
          .eq("assigned_to_id", profile.id),

        // Resolved tickets with SLA data
        supabase.from("tickets").select("created_at, resolved_at, sla_hours")
          .eq("assigned_to_id", profile.id)
          .in("status", ["RESOLVED","CLOSED"])
          .not("resolved_at", "is", null),

        // Open tickets
        supabase.from("tickets").select("*", { count:"exact", head:true })
          .eq("assigned_to_id", profile.id).eq("status", "OPEN"),

        // CSAT for this month
        supabase.from("csat_scores").select("score")
          .eq("agent_id", profile.id)
          .eq("month", selectedMonth).eq("year", selectedYear),

        // KPI settings
        supabase.from("kpi_settings").select("*").eq("is_active", true),

        // CRM Logging: interactions by this agent
        supabase.from("interactions").select("*", { count:"exact", head:true })
          .eq("agent_id", profile.id),

        // Database Accuracy: tickets with complete fields
        supabase.from("tickets").select("*", { count:"exact", head:true })
          .eq("assigned_to_id", profile.id)
          .not("client_id", "is", null)
          .not("category",  "is", null)
          .not("source",    "is", null),

        // Proactive Engagement: REACHED clients
        supabase.from("tickets").select("*", { count:"exact", head:true })
          .eq("assigned_to_id", profile.id)
          .in("contact_status", ["REACHED","CALLBACK_REQUESTED"]),
      ]);

      const totalCount = total ?? 0;

      // ① CSAT
      const csatScore = csat && csat.length > 0
        ? Math.round((csat.reduce((s,c) => s + c.score, 0) / csat.length) * 20)
        : 0;

      // ② SLA Compliance
      const resolved = resolvedData ?? [];
      let withinSLA = 0;
      for (const t of resolved) {
        if (!t.sla_hours || !t.resolved_at) continue;
        const elapsed = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 3600000;
        if (elapsed <= t.sla_hours) withinSLA++;
      }
      const slaScore = resolved.length > 0
        ? Math.round((withinSLA / resolved.length) * 100)
        : 0;

      // ③ CRM Logging
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

      setStats({
        totalTickets: totalCount,
        resolvedTickets: resolved.length,
        openTickets: open ?? 0,
        csatScore, slaScore, crmScore, dbScore, engagementScore,
      });
      setKpis(kpiData ?? []);
      setLoading(false);
    });
  }, [selectedMonth, selectedYear]);

  // Overall = weighted average of KPIs (normalized by totalWeight)
  const activeKpis  = kpis.filter(k => k.is_active);
  const totalWeight = activeKpis.reduce((s,k) => s + k.weight, 0);
  const overallScore = activeKpis.length > 0 && totalWeight > 0
    ? Math.min(Math.round(
        activeKpis.reduce((s,k) => {
          const score = getScore(k, stats);
          return s + (score / k.target) * k.weight;
        }, 0) / totalWeight * 100
      ), 100)
    : 0;

  const overallColor = overallScore >= 80 ? "var(--success)"
    : overallScore >= 60 ? "var(--warning)"
    : "var(--danger)";

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="My KPIs"
        subtitle={`${MONTHS[selectedMonth-1]} ${selectedYear} — ${agentName}`}
      />
      <div className="flex-1 p-6 space-y-6 max-w-4xl">

        {/* ── Overall Score ───────────────────────────── */}
        <div className="crm-card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color:"var(--text-muted)" }}>Overall Performance Score</p>
            <p className="text-5xl font-bold mt-1"
              style={{ fontFamily:"'Playfair Display',serif", color:overallColor }}>
              {loading ? "—" : `${overallScore}%`}
            </p>
            <p className="text-xs mt-1" style={{ color:"var(--text-muted)" }}>
              {overallScore >= 80 ? "🎯 On Target"
                : overallScore >= 60 ? "⚠️ Needs Improvement"
                : "❌ Below Target"}
            </p>
          </div>
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background:"var(--gold-glow)", border:"2px solid var(--border-strong)" }}>
            <Target className="w-10 h-10" style={{ color:"var(--gold-500)" }} />
          </div>
        </div>

        {/* ── Quick Stats ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Total Tickets",  value: stats.totalTickets,            icon: Ticket,      color:"var(--gold-500)" },
            { label:"Resolved",       value: stats.resolvedTickets,         icon: CheckCircle, color:"var(--success)"  },
            { label:"Open",           value: stats.openTickets,             icon: Clock,       color:"var(--warning)"  },
            { label:"CSAT Score",     value: `${stats.csatScore}%`,         icon: Star,        color:"var(--info)"     },
          ].map(s => (
            <div key={s.label} className="crm-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                style={{ background:"var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color:s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold"
                  style={{ fontFamily:"'Playfair Display',serif", color:"var(--text-primary)" }}>
                  {loading ? "—" : s.value}
                </p>
                <p className="text-[11px]" style={{ color:"var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── KPI Breakdown ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color:"var(--text-secondary)" }}>KPI BREAKDOWN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" />
              </div>
            ) : activeKpis.map(kpi => {
              const score = getScore(kpi, stats);
              const pct   = Math.min(Math.round((score / kpi.target) * 100), 100);
              const color = scoreColor(score, kpi.target);
              return (
                <div key={kpi.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color:"var(--text-primary)" }}>
                        {kpi.name}
                      </p>
                      <p className="text-xs" style={{ color:"var(--text-muted)" }}>
                        Weight: {kpi.weight}% · Target: {kpi.target}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold"
                        style={{ color, fontFamily:"'Playfair Display',serif" }}>
                        {score}%
                      </p>
                      <p className="text-[10px]" style={{ color:"var(--text-muted)" }}>
                        {pct}% of target
                      </p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ background:"var(--black-600)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width:`${pct}%`, background:color }} />
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
