// ── Shared KPI calculation logic ──────────────────────────────
// كل تعديل هنا بيأثر على صفحة الـ Admin والـ Agent بشكل تلقائي

export interface KPISetting {
  id: string;
  name: string;
  target: number;
  weight: number;
  reporting_frequency?: string;
}

export interface AgentStats {
  totalTickets: number;
  resolvedTickets: number;
  openTickets: number;
  csatAvg: number;
  slaCompliance: number;
}

export function getKPIScore(kpi: KPISetting, stats: AgentStats): number {
  if (kpi.name.includes("CSAT") || kpi.name.includes("Satisfaction")) return stats.csatAvg;
  if (kpi.name.includes("SLA")) return stats.slaCompliance;
  if (kpi.name.includes("CRM") || kpi.name.includes("Logging")) return stats.totalTickets > 0 ? 95 : 0;
  if (kpi.name.includes("Database")) return stats.totalTickets > 0 ? 90 : 0;
  if (kpi.name.includes("Engagement")) return stats.totalTickets > 0 ? 75 : 0;
  return 0;
}

export function getKPIScoreColor(score: number, target: number): string {
  const pct = (score / target) * 100;
  if (pct >= 100) return "var(--success)";
  if (pct >= 80)  return "var(--warning)";
  return "var(--danger)";
}

export function calcOverallScore(kpis: KPISetting[], stats: AgentStats): number {
  if (kpis.length === 0) return 0;
  const totalWeight = kpis.reduce((s, k) => s + k.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = kpis.reduce((sum, kpi) => {
    const score = getKPIScore(kpi, stats);
    return sum + (score / kpi.target) * (kpi.weight / totalWeight) * 100;
  }, 0);
  return Math.min(Math.round(weighted), 100);
}
