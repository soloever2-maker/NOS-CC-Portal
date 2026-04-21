export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status    = searchParams.get("status");
    const project   = searchParams.get("project");
    const agentId   = searchParams.get("agentId");
    const dateFrom  = searchParams.get("dateFrom");
    const dateTo    = searchParams.get("dateTo");

    let query = supabase
      .from("tickets")
      .select("code, title, status, priority, category, project, source, contact_status, created_at, due_date, resolved_at, sla_hours, client:clients(name, phone), property:properties(name, unit), assigned_to:users!tickets_assigned_to_id_fkey(id, name)")
      .order("created_at", { ascending: false });

    if (status  && status  !== "ALL") query = query.eq("status", status);
    if (project && project !== "ALL") query = query.eq("project", project);
    if (agentId && agentId !== "ALL") query = query.eq("assigned_to_id", agentId);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo)   query = query.lte("created_at", dateTo + "T23:59:59Z");

    const { data } = await query;

    const rows = (data ?? []).map((t: Record<string, unknown>) => {
      const client     = t.client     as { name?: string; phone?: string } | null;
      const property   = t.property   as { name?: string; unit?: string  } | null;
      const assignedTo = t.assigned_to as { name?: string }               | null;
      return [
        t.code, t.title, t.status, t.priority, t.category,
        t.project ?? "", t.source ?? "", t.contact_status ?? "",
        client?.name ?? "", client?.phone ?? "",
        property?.name ?? "", property?.unit ?? "",
        assignedTo?.name ?? "",
        t.sla_hours ?? "",
        t.created_at, t.due_date ?? "", t.resolved_at ?? "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const header = ["Code","Title","Status","Priority","Category","Project","Source","Contact Status","Client","Phone","Property","Unit","Assigned To","SLA Hours","Created At","Due Date","Resolved At"].join(",");
    const csv = [header, ...rows].join("\n");

    const filename = `tickets-${new Date().toISOString().split("T")[0]}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
