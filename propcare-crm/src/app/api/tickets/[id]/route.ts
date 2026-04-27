export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users")
      .select("id, role").eq("supabase_id", user.id).single();
    if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Check access — admin can edit any, agent only their own
    const { data: ticket } = await supabase.from("tickets")
      .select("assigned_to_id, created_by_id").eq("id", params.id).single();
    const isAdmin = ["ADMIN","SUPER_ADMIN","MANAGER"].includes(profile.role);
    const canEdit = isAdmin || profile.id === ticket?.assigned_to_id || profile.id === ticket?.created_by_id;
    if (!canEdit) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title)         updates.title          = body.title;
    if (body.description)   updates.description    = body.description;
    if (body.category)      updates.category       = body.category;
    if (body.priority)      updates.priority       = body.priority;
    if (body.status)        updates.status         = body.status;
    if (body.project)       updates.project        = body.project;
    if (body.tags)                        updates.tags           = body.tags;
    if (body.unitId !== undefined)        updates.unit_id        = body.unitId || null;
    if (body.contactStatus !== undefined) updates.contact_status = body.contactStatus;
    if (body.slaHours !== undefined)      updates.sla_hours      = body.slaHours;
    if (body.assignedToId !== undefined && isAdmin) updates.assigned_to_id = body.assignedToId || null;
    if (body.status === "RESOLVED") updates.resolved_at = new Date().toISOString();
    if (body.status === "CLOSED")   updates.closed_at   = new Date().toISOString();

    const { data, error } = await supabase.from("tickets")
      .update(updates).eq("id", params.id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
