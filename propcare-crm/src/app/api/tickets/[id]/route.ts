export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CONTACT_STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED:      "Not Contacted",
  NO_ANSWER:          "No Answer",
  NOT_REACHABLE:      "Not Reachable",
  REACHED:            "Reached",
  CALLBACK_REQUESTED: "Callback Requested",
};

async function notifyUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
  payload: { type: string; title: string; message: string; link: string }
) {
  if (userIds.length === 0) return;
  await supabase.from("notifications").insert(
    userIds.map(uid => ({ id: crypto.randomUUID(), user_id: uid, is_read: false, ...payload }))
  );
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("id, role, name").eq("supabase_id", user.id).single();
    if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: ticket } = await supabase.from("tickets")
      .select("code, title, assigned_to_id, created_by_id, created_at, sla_hours, contact_status")
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

    const { data, error } = await supabase.from("tickets").update(updates).eq("id", params.id).select().single();
    if (error) throw error;

    const ticketCode  = ticket?.code  ?? "TKT";
    const ticketTitle = ticket?.title ?? "Ticket";
    const notifLink   = `/dashboard/tickets/${params.id}`;

    const { data: admins } = await supabase.from("users")
      .select("id").in("role", ["ADMIN","SUPER_ADMIN","MANAGER"])
      .eq("is_active", true).neq("id", profile.id);
    const adminIds = (admins ?? []).map(a => a.id);

    // ── Contact Status change ─────────────────────────────────────────────
    if (body.contactStatus && body.contactStatus !== ticket?.contact_status) {
      const label = CONTACT_STATUS_LABELS[body.contactStatus] ?? body.contactStatus;

      await notifyUsers(supabase, adminIds, {
        type:    "TICKET_UPDATED",
        title:   `Contact: ${label}`,
        message: `${ticketCode} — ${ticketTitle}`,
        link:    notifLink,
      });

      if (ticket?.assigned_to_id && ticket.assigned_to_id !== profile.id) {
        await notifyUsers(supabase, [ticket.assigned_to_id], {
          type:    "TICKET_UPDATED",
          title:   `Contact Status Updated: ${label}`,
          message: `${ticketCode} — ${ticketTitle}`,
          link:    notifLink,
        });
      }
    }

    // ── Reassignment ──────────────────────────────────────────────────────
    const prevAssignee  = ticket?.assigned_to_id ?? null;
    const newAssigneeId = isAdmin && body.assignedToId !== undefined ? (body.assignedToId || null) : null;

    if (newAssigneeId && newAssigneeId !== prevAssignee) {
      await notifyUsers(supabase, [newAssigneeId], {
        type: "TICKET_ASSIGNED", title: "Ticket Assigned to You",
        message: `${ticketCode} — ${ticketTitle}`, link: notifLink,
      });
      await notifyUsers(supabase, adminIds, {
        type: "TICKET_UPDATED", title: "Ticket Reassigned",
        message: `${ticketCode} — ${ticketTitle}`, link: notifLink,
      });
    }

    // ── Status change ─────────────────────────────────────────────────────
    if (body.status) {
      const isResolved = ["RESOLVED","CLOSED"].includes(body.status);

      if (ticket?.assigned_to_id && ticket.assigned_to_id !== profile.id) {
        await notifyUsers(supabase, [ticket.assigned_to_id], {
          type:    isResolved ? "TICKET_RESOLVED" : "TICKET_UPDATED",
          title:   isResolved ? "Ticket Marked as Resolved" : `Status Changed: ${body.status}`,
          message: `${ticketCode} — ${ticketTitle}`, link: notifLink,
        });
      }
      await notifyUsers(supabase, adminIds, {
        type:    isResolved ? "TICKET_RESOLVED" : "TICKET_UPDATED",
        title:   isResolved ? "Ticket Resolved" : `Status: ${body.status}`,
        message: `${ticketCode} — ${ticketTitle}`, link: notifLink,
      });
    }

    // ── Priority change ───────────────────────────────────────────────────
    if (body.priority) {
      if (ticket?.assigned_to_id && ticket.assigned_to_id !== profile.id) {
        await notifyUsers(supabase, [ticket.assigned_to_id], {
          type: "TICKET_UPDATED", title: `Priority Changed: ${body.priority}`,
          message: `${ticketCode} — ${ticketTitle}`, link: notifLink,
        });
      }
      await notifyUsers(supabase, adminIds, {
        type: "TICKET_UPDATED", title: `Priority Changed: ${body.priority}`,
        message: `${ticketCode} — ${ticketTitle}`, link: notifLink,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
