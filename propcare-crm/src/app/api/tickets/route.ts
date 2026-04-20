import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const project = searchParams.get("project");

    let query = supabase
      .from("tickets")
      .select(`
        *,
        client:clients(id, name, phone),
        property:properties(id, name, code),
        assigned_to:users!tickets_assigned_to_id_fkey(id, name),
        created_by:users!tickets_created_by_id_fkey(id, name)
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") query = query.eq("status", status);
    if (project && project !== "ALL") query = query.eq("project", project);
    if (search) query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: userRecord } = await supabase
      .from("users").select("id").eq("supabase_id", user.id).single();

    const body = await req.json();
    const code = generateCode("TKT");

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        id: crypto.randomUUID(),
        code,
        title: body.title,
        description: body.description,
        status: body.status ?? "OPEN",
        priority: body.priority ?? "MEDIUM",
        category: body.category ?? "OTHER",
        project: body.project || null,
        client_id: body.clientId || null,
        property_id: body.propertyId || null,
        assigned_to_id: body.assignedToId || null,
        created_by_id: userRecord?.id ?? user.id,
        due_date: body.dueDate || null,
        tags: body.tags ?? [],
        attachments: [],
      })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create ticket" }, { status: 500 });
  }
}
