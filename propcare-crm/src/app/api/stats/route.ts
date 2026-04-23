export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [
      { count: totalTickets },
      { count: openTickets },
      { count: inProgress },
      { count: resolvedToday },
      { count: totalClients },
      { count: totalProperties },
    ] = await Promise.all([
      supabase.from("tickets").select("*", { count: "exact", head: true }),
      supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
      supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "IN_PROGRESS"),
      supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "RESOLVED").gte("updated_at", today.toISOString()),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("client_units").select("*", { count: "exact", head: true }),
    ]);

    const { data: byStatus } = await supabase.from("tickets").select("status").neq("status", "CLOSED");
    const statusCounts = (byStatus ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1; return acc;
    }, {});

    const { data: byCategory } = await supabase.from("tickets").select("category");
    const categoryCounts = (byCategory ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1; return acc;
    }, {});

    // ── SLA Stats ──
    const { data: slaSettings } = await supabase.from("sla_settings").select("*").eq("is_active", true);

    // Build SLA hours map
    const slaMap: Record<string, number> = {};
    for (const s of slaSettings ?? []) {
      const key = s.source ? `${s.ticket_type}:${s.source}` : `${s.ticket_type}:default`;
      slaMap[key] = s.hours;
    }
    const getSlaHours = (category: string, source: string | null): number | null | undefined => {
      if (source && slaMap[`${category}:${source}`]) return slaMap[`${category}:${source}`] ?? null;
      return slaMap[`${category}:default`] ?? null;
    };

    // Get open/in-progress tickets with SLA
    const { data: openTicketsData } = await supabase
      .from("tickets")
      .select("id, category, source, created_at, sla_hours")
      .in("status", ["OPEN", "IN_PROGRESS", "PENDING_CLIENT"]);

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

    // SLA compliance for resolved tickets (this month)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const { data: resolvedData } = await supabase
      .from("tickets")
      .select("category, source, created_at, resolved_at, sla_hours")
      .in("status", ["RESOLVED", "CLOSED"])
      .gte("resolved_at", monthStart.toISOString())
      .not("resolved_at", "is", null);

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
        totalProperties: totalProperties ?? 0,
        byStatus: statusCounts,
        byCategory: categoryCounts,
        sla: {
          within: slaWithin,
          atRisk: slaAtRisk,
          overdue: slaOverdue,
          complianceRate: slaComplianceRate,
          resolvedWithinSLA,
          resolvedBreached,
        },
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
