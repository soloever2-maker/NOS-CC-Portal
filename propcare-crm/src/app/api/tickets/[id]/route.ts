// src/app/api/tickets/[id]/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/send-email";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("id, role")
      .eq("supabase_id", user.id)
      .single();
    if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Fetch full ticket — need assignment + dates to recalculate SLA
    const { data: ticket } = await supabase
      .from("tickets")
      .select("code, title, assigned_to_id, created_by_id, created_at, sla_hours")
      .eq("id", params.id)
      .single();

    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(profile.role);
    const canEdit =
      isAdmin ||
      profile.id === ticket?.assigned_to_id ||
      profile.id === ticket?.created_by_id;
    if (!canEdit)
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title)                                    updates.title          = body.title;
    if (body.description)                              updates.description    = body.description;
    if (body.category)                                 updates.category       = body.category;
    if (body.priority)                                 updates.priority       = body.priority;
    if (body.status)                                   updates.status         = body.status;
    if (body.project)                                  updates.project        = body.project;
    if (body.tags)                                     updates.tags           = body.tags;
    if (body.unitId !== undefined)                     updates.unit_id        = body.unitId || null;
    if (body.contactStatus !== undefined)              updates.contact_status = body.contactStatus;
    if (body.assignedToId !== undefined && isAdmin)    updates.assigned_to_id = body.assignedToId || null;
    if (body.status === "RESOLVED")                    updates.resolved_at    = new Date().toISOString();
    if (body.status === "CLOSED")                      updates.closed_at      = new Date().toISOString();

    // ── SLA: always recalculate due_date from created_at ──────────────────
    if (body.slaHours !== undefined && ticket?.created_at) {
      const hours = Number(body.slaHours);
      updates.sla_hours = hours;
      const due = new Date(ticket.created_at);
      due.setTime(due.getTime() + hours * 60 * 60 * 1000);
      updates.due_date = due.toISOString();
    }

    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;

    // ── Notifications on assignment change ────────────────────────────────
    const prevAssignee  = ticket?.assigned_to_id ?? null;
    const newAssigneeId = isAdmin && body.assignedToId !== undefined
      ? (body.assignedToId || null)
      : null;

    // Only fire when the assignee actually changed to a different person
    if (newAssigneeId && newAssigneeId !== prevAssignee) {
      const ticketCode  = ticket?.code  ?? "TKT-???";
      const ticketTitle = ticket?.title ?? body.title ?? "Ticket";
      const notifTitle  = "Ticket Assigned to You";
      const notifMsg    = `${ticketCode} — ${ticketTitle}`;
      const notifLink   = `/dashboard/tickets/${params.id}`;

      // 1. In-app notification → triggers real-time popup on the recipient's screen
      await supabase.from("notifications").insert({
        id:       crypto.randomUUID(),
        user_id:  newAssigneeId,
        type:     "TICKET_ASSIGNED",
        title:    notifTitle,
        message:  notifMsg,
        link:     notifLink,
        is_read:  false,
      });

      // 2. Email notification → fetch assignee details then send
      const { data: assignee } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", newAssigneeId)
        .single();

      if (assignee?.email) {
        await sendNotificationEmail({
          to:      assignee.email,
          name:    assignee.name ?? "Agent",
          title:   notifTitle,
          message: notifMsg,
          link:    notifLink,
          type:    "TICKET_ASSIGNED",
        });
      }
    }

    // ── Optional: notify the agent when their ticket is updated by someone else ──
    // Uncomment if you want agents to get notified on any status/priority change
    // if (body.status && prevAssignee && prevAssignee !== profile.id) {
    //   await supabase.from("notifications").insert({ ... TICKET_UPDATED ... });
    // }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
