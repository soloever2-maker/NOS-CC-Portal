export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("tickets")
      .select("code, title, status, priority, category, project, source, created_at, due_date, resolved_at, client:clients(name, phone), property:properties(name, unit), assigned_to:users!tickets_assigned_to_id_fkey(name)")
      .order("created_at", { ascending: false });

    const rows = (data ?? []).map((t: Record<string, unknown>) => {
      const client = t.client as { name?: string; phone?: string } | null;
      const property = t.property as { name?: string; unit?: string } | null;
      const assignedTo = t.assigned_to as { name?: string } | null;
      return [
        t.code, t.title, t.status, t.priority, t.category,
        t.project ?? "", t.source ?? "",
        client?.name ?? "", client?.phone ?? "",
        property?.name ?? "", property?.unit ?? "",
        assignedTo?.name ?? "",
        t.created_at, t.due_date ?? "", t.resolved_at ?? "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const header = ["Code","Title","Status","Priority","Category","Project","Source","Client","Phone","Property","Unit","Assigned To","Created At","Due Date","Resolved At"].join(",");
    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tickets-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
