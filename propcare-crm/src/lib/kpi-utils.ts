// src/lib/kpi-utils.ts
// Overall Score = (Operational KPIs × 70%) + (Core Competencies × 30%)

export interface KPISetting {
  id: string;
  name: string;
  target: number;
  weight: number;
  reporting_frequency?: string;
}

export interface AgentStats {
  totalTickets:         number;
  resolvedTickets:      number;
  openTickets?:         number;
  csatAvg:              number;
  slaCompliance:        number;
}

export interface CompetencyScores {
  trust:   number; // 0–10
  client:  number; // 0–10
  results: number; // 0–10
}

export function getKPIScore(kpi: KPISetting, stats: AgentStats): number {
  const n = kpi.name.toLowerCase();
  if (n.includes("csat") || n.includes("satisfaction")) return stats.csatAvg;
  if (n.includes("sla"))                                 return stats.slaCompliance;
  if (n.includes("logging") || n.includes("crm"))       return stats.totalTickets > 0 ? 95 : 0;
  if (n.includes("database") || n.includes("accuracy")) return stats.totalTickets > 0 ? 90 : 0;
  if (n.includes("engagement") || n.includes("proactive")) return stats.totalTickets > 0 ? 75 : 0;
  return 0;
}

export function getKPIScoreColor(score: number, target: number): string {
  const pct = target > 0 ? (score / target) * 100 : 0;
  if (pct >= 100) return "var(--success)";
  if (pct >= 80)  return "var(--warning)";
  return "var(--danger)";
}

// Operational score 0–100
export function calcOperationalScore(kpis: KPISetting[], stats: AgentStats): number {
  if (kpis.length === 0) return 0;
  const totalWeight = kpis.reduce((s, k) => s + k.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = kpis.reduce((sum, kpi) => {
    const score = getKPIScore(kpi, stats);
    return sum + (score / kpi.target) * (kpi.weight / totalWeight) * 100;
  }, 0);
  return Math.min(Math.round(weighted), 100);
}

// Competency score 0–100 (each field out of 10)
export function calcCompetencyScore(comp: CompetencyScores): number {
  const avg = (comp.trust + comp.client + comp.results) / 3;
  return Math.min(Math.round(avg * 10), 100);
}

// Overall = operational×70% + competency×30%
export function calcOverallScore(
  kpis: KPISetting[],
  stats: AgentStats,
  comp?: CompetencyScores | null
): number {
  const operational = calcOperationalScore(kpis, stats);
  const competency  = comp ? calcCompetencyScore(comp) : 0;
  return Math.min(Math.round(operational * 0.7 + competency * 0.3), 100);
}
