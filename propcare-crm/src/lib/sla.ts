// SLA Indicator utilities

export type SLAStatus = "within" | "at_risk" | "overdue" | "resolved" | "no_sla";

export interface SLAInfo {
  status: SLAStatus;
  hoursAllowed: number;
  hoursElapsed: number;
  hoursRemaining: number;
  percentUsed: number;
  label: string;
  color: string;
  bg: string;
}

export function calculateSLA(
  createdAt: string,
  ticketStatus: string,
  resolvedAt: string | null,
  slaHours: number | null
): SLAInfo {
  if (!slaHours) {
    return { status: "no_sla", hoursAllowed: 0, hoursElapsed: 0, hoursRemaining: 0, percentUsed: 0, label: "No SLA", color: "var(--text-muted)", bg: "var(--black-600)" };
  }

  if (["RESOLVED", "CLOSED"].includes(ticketStatus)) {
    const elapsed = resolvedAt
      ? (new Date(resolvedAt).getTime() - new Date(createdAt).getTime()) / 3600000
      : slaHours;
    const withinSLA = elapsed <= slaHours;
    return {
      status: "resolved",
      hoursAllowed: slaHours,
      hoursElapsed: Math.round(elapsed * 10) / 10,
      hoursRemaining: 0,
      percentUsed: Math.min(Math.round((elapsed / slaHours) * 100), 100),
      label: withinSLA ? "Resolved within SLA" : "Resolved (SLA breached)",
      color: withinSLA ? "var(--success)" : "var(--danger)",
      bg: withinSLA ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
    };
  }

  const now = new Date();
  const created = new Date(createdAt);
  const hoursElapsed = (now.getTime() - created.getTime()) / 3600000;
  const hoursRemaining = slaHours - hoursElapsed;
  const percentUsed = Math.min(Math.round((hoursElapsed / slaHours) * 100), 100);

  if (hoursRemaining <= 0) {
    return {
      status: "overdue",
      hoursAllowed: slaHours,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      percentUsed: 100,
      label: `Overdue by ${formatHours(Math.abs(hoursRemaining))}`,
      color: "var(--danger)",
      bg: "rgba(239,68,68,0.1)",
    };
  }

  if (percentUsed >= 75) {
    return {
      status: "at_risk",
      hoursAllowed: slaHours,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      percentUsed,
      label: `At risk — ${formatHours(hoursRemaining)} left`,
      color: "var(--warning)",
      bg: "rgba(245,158,11,0.1)",
    };
  }

  return {
    status: "within",
    hoursAllowed: slaHours,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    percentUsed,
    label: `${formatHours(hoursRemaining)} remaining`,
    color: "var(--success)",
    bg: "rgba(34,197,94,0.1)",
  };
}

function formatHours(hours: number): string {
  const abs = Math.abs(hours);
  if (abs < 1) return `${Math.round(abs * 60)}m`;
  if (abs < 24) return `${Math.round(abs * 10) / 10}h`;
  return `${Math.round(abs / 24 * 10) / 10}d`;
}
