export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date(); today.setHours(0,0,0,0);

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
      supabase.from("properties").select("*", { count: "exact", head: true }),
    ]);

    const { data: byStatus } = await supabase.from("tickets").select("status").neq("status", "CLOSED");
    const statusCounts = (byStatus ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1; return acc;
    }, {});

    const { data: byCategory } = await supabase.from("tickets").select("category");
    const categoryCounts = (byCategory ?? []).reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1; return acc;
    }, {});

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
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
