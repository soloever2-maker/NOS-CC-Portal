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

    // Fetch full ticket — added code + title for notifications
    const { data: ticket } = await supabase.from("tickets")
      .select("code, title, assigned_to_id, created_by_id, created_at, sla_hours")
      .eq("id", params.id).single();

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
    if (body.tags)          updates.tags           = body.tags;
    if (body.unitId !== undefined)        updates.unit_id        = body.unitId || null;
    if (body.contactStatus !== undefined) updates.contact_status = body.contactStatus;
    if (body.assignedToId !== undefined && isAdmin) updates.assigned_to_id = body.assignedToId || null;
    if (body.status === "RESOLVED") updates.resolved_at = new Date().toISOString();
    if (body.status === "CLOSED")   updates.closed_at   = new Date().toISOString();

    if (body.slaHours !== undefined && ticket?.created_at) {
      const hours = Number(body.slaHours);
      updates.sla_hours = hours;
      const due = new Date(ticket.created_at);
      due.setTime(due.getTime() + hours * 60 * 60 * 1000);
      updates.due_date = due.toISOString();
    }

    const { data, error } = await supabase.from("tickets")
      .update(updates).eq("id", params.id).select().single();
    if (error) throw error;

    // ── Notification: reassignment ────────────────────────────────────────
    const prevAssignee  = ticket?.assigned_to_id ?? null;
    const newAssigneeId = isAdmin && body.assignedToId !== undefined
      ? (body.assignedToId || null) : null;

    if (newAssigneeId && newAssigneeId !== prevAssignee) {
      await supabase.from("notifications").insert({
        id:      crypto.randomUUID(),
        user_id: newAssigneeId,
        type:    "TICKET_ASSIGNED",
        title:   "Ticket Assigned to You",
        message: `${ticket?.code ?? "TKT"} — ${ticket?.title ?? body.title ?? "Ticket"}`,
        link:    `/dashboard/tickets/${params.id}`,
        is_read: false,
      });
    }

    // ── Notification: status change ───────────────────────────────────────
    if (body.status && ticket?.assigned_to_id && ticket.assigned_to_id !== profile.id) {
      const isResolved = body.status === "RESOLVED" || body.status === "CLOSED";
      await supabase.from("notifications").insert({
        id:      crypto.randomUUID(),
        user_id: ticket.assigned_to_id,
        type:    isResolved ? "TICKET_RESOLVED" : "TICKET_UPDATED",
        title:   isResolved ? "Ticket Marked as Resolved" : `Ticket Status Changed to ${body.status}`,
        message: `${ticket?.code ?? "TKT"} — ${ticket?.title ?? "Ticket"}`,
        link:    `/dashboard/tickets/${params.id}`,
        is_read: false,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
