export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = supabase
      .from("leads")
      .select(`
        *,
        client:clients(id, name, phone),
        property:properties(id, name, code),
        assigned_to:users(id, name)
      `)
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const code = generateCode("LDK");

    const { data, error } = await supabase
      .from("leads")
      .insert({
        id: crypto.randomUUID(),
        code,
        title: body.title || null,
        status: body.status ?? "NEW",
        source: body.source || null,
        budget: body.budget ? parseFloat(body.budget) : null,
        client_id: body.clientId || null,
        property_id: body.propertyId || null,
        assigned_to_id: body.assignedToId || null,
        notes: body.notes || null,
        tags: body.tags ?? [],
        follow_up_date: body.followUpDate || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create lead" }, { status: 500 });
  }
}
