export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const project  = searchParams.get("project");
    const fromDate = searchParams.get("from");
    const toDate   = searchParams.get("to");

    const today = new Date(); today.setHours(0, 0, 0, 0);

    // ── Base query builder ──────────────────────────────
    const base = () => {
      let q = supabase.from("tickets").select("*", { count: "exact", head: true });
      if (project) q = q.eq("project", project);
      if (fromDate) q = q.gte("created_at", fromDate);
      if (toDate)   q = q.lte("created_at", toDate);
      return q;
    };

    const [
      { count: totalTickets },
      { count: openTickets },
      { count: inProgress },
      { count: resolvedToday },
      { count: totalClients },
      { count: totalUnits },
    ] = await Promise.all([
      base(),
      base().eq("status", "OPEN"),
      base().eq("status", "IN_PROGRESS"),
      supabase.from("tickets").select("*", { count: "exact", head: true })
        .eq("status", "RESOLVED").gte("updated_at", today.toISOString()),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("client_units").select("*", { count: "exact", head: true }),
    ]);

    // ── By Status ───────────────────────────────────────
    let statusQuery = supabase.from("tickets").select("status").neq("status", "CLOSED");
    if (project) statusQuery = statusQuery.eq("project", project);
    if (fromDate) statusQuery = statusQuery.gte("created_at", fromDate);
    if (toDate)   statusQuery = statusQuery.lte("created_at", toDate);
    const { data: byStatus } = await statusQuery;
    const statusCounts = (byStatus ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1; return acc;
    }, {});

    // ── By Category ─────────────────────────────────────
    let catQuery = supabase.from("tickets").select("category");
    if (project) catQuery = catQuery.eq("project", project);
    if (fromDate) catQuery = catQuery.gte("created_at", fromDate);
    if (toDate)   catQuery = catQuery.lte("created_at", toDate);
    const { data: byCategory } = await catQuery;
    const categoryCounts = (byCategory ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1; return acc;
    }, {});

    // ── By Source ───────────────────────────────────────
    let srcQuery = supabase.from("tickets").select("source");
    if (project) srcQuery = srcQuery.eq("project", project);
    if (fromDate) srcQuery = srcQuery.gte("created_at", fromDate);
    if (toDate)   srcQuery = srcQuery.lte("created_at", toDate);
    const { data: bySource } = await srcQuery;
    const sourceCounts = (bySource ?? []).reduce<Record<string, number>>((acc, t) => {
      const s = t.source ?? "unknown";
      acc[s] = (acc[s] ?? 0) + 1; return acc;
    }, {});

    // ── Avg Resolution Time ─────────────────────────────
    let resQuery = supabase.from("tickets").select("created_at, resolved_at")
      .in("status", ["RESOLVED", "CLOSED"]).not("resolved_at", "is", null);
    if (project) resQuery = resQuery.eq("project", project);
    if (fromDate) resQuery = resQuery.gte("created_at", fromDate);
    if (toDate)   resQuery = resQuery.lte("created_at", toDate);
    const { data: resolvedTickets } = await resQuery;
    let avgResolutionHours: number | null = null;
    if (resolvedTickets && resolvedTickets.length > 0) {
      const total = resolvedTickets.reduce((sum, t) => {
        if (!t.resolved_at) return sum;
        return sum + (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 3600000;
      }, 0);
      avgResolutionHours = Math.round((total / resolvedTickets.length) * 10) / 10;
    }

    // ── Agent Performance ───────────────────────────────
    let agentQuery = supabase.from("tickets")
      .select("assigned_to_id, status, assigned_to:users!tickets_assigned_to_id_fkey(name)");
    if (project) agentQuery = agentQuery.eq("project", project);
    if (fromDate) agentQuery = agentQuery.gte("created_at", fromDate);
    if (toDate)   agentQuery = agentQuery.lte("created_at", toDate);
    const { data: agentTickets } = await agentQuery;

    const agentMap: Record<string, { name: string; total: number; resolved: number; open: number }> = {};
    for (const t of agentTickets ?? []) {
      if (!t.assigned_to_id) continue;
      const name = Array.isArray(t.assigned_to) ? (t.assigned_to[0]?.name ?? "Unknown") : (t.assigned_to as { name: string } | null)?.name ?? "Unknown";
      if (!agentMap[t.assigned_to_id]) agentMap[t.assigned_to_id] = { name, total: 0, resolved: 0, open: 0 };
      const entry = agentMap[t.assigned_to_id];
      if (!entry) continue;
      entry.total++;
      if (["RESOLVED", "CLOSED"].includes(t.status)) entry.resolved++;
      if (["OPEN", "IN_PROGRESS", "PENDING_CLIENT"].includes(t.status)) entry.open++;
    }
    const agentPerformance = Object.values(agentMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // ── SLA Stats ───────────────────────────────────────
    const { data: slaSettings } = await supabase.from("sla_settings").select("*").eq("is_active", true);
    const slaMap: Record<string, number> = {};
    for (const s of slaSettings ?? []) {
      const key = s.source ? `${s.ticket_type}:${s.source}` : `${s.ticket_type}:default`;
      slaMap[key] = s.hours;
    }
    const getSlaHours = (category: string, source: string | null): number | null => {
      if (source && slaMap[`${category}:${source}`]) return slaMap[`${category}:${source}`];
      return slaMap[`${category}:default`] ?? null;
    };

    let openSlaQuery = supabase.from("tickets")
      .select("id, category, source, created_at, sla_hours")
      .in("status", ["OPEN", "IN_PROGRESS", "PENDING_CLIENT"]);
    if (project) openSlaQuery = openSlaQuery.eq("project", project);
    const { data: openTicketsData } = await openSlaQuery;

    let slaWithin = 0, slaAtRisk = 0, slaOverdue = 0;
    const now = Date.now();
    for (const t of openTicketsData ?? []) {
      const hours = t.sla_hours ?? getSlaHours(t.category, t.source);
      if (!hours) continue;
      const elapsed = (now - new Date(t.created_at).getTime()) / 3600000;
      const pct = (elapsed / hours) * 100;
      if (elapsed > hours) slaOverdue++;
      else if (pct >= 75) slaAtRisk++;
      else slaWithin++;
    }

    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    let resolvedSlaQuery = supabase.from("tickets")
      .select("category, source, created_at, resolved_at, sla_hours")
      .in("status", ["RESOLVED", "CLOSED"])
      .gte("resolved_at", monthStart.toISOString())
      .not("resolved_at", "is", null);
    if (project) resolvedSlaQuery = resolvedSlaQuery.eq("project", project);
    const { data: resolvedData } = await resolvedSlaQuery;

    let resolvedWithinSLA = 0, resolvedBreached = 0;
    for (const t of resolvedData ?? []) {
      const hours = t.sla_hours ?? getSlaHours(t.category, t.source);
      if (!hours || !t.resolved_at) continue;
      const elapsed = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / 3600000;
      if (elapsed <= hours) resolvedWithinSLA++;
      else resolvedBreached++;
    }
    const totalResolved = resolvedWithinSLA + resolvedBreached;
    const slaComplianceRate = totalResolved > 0 ? Math.round((resolvedWithinSLA / totalResolved) * 100) : null;

    return NextResponse.json({
      success: true,
      data: {
        totalTickets: totalTickets ?? 0,
        openTickets: openTickets ?? 0,
        inProgress: inProgress ?? 0,
        resolvedToday: resolvedToday ?? 0,
        totalClients: totalClients ?? 0,
        totalUnits: totalUnits ?? 0,
        avgResolutionHours,
        byStatus: statusCounts,
        byCategory: categoryCounts,
        bySource: sourceCounts,
        agentPerformance,
        sla: { within: slaWithin, atRisk: slaAtRisk, overdue: slaOverdue, complianceRate: slaComplianceRate, resolvedWithinSLA, resolvedBreached },
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
