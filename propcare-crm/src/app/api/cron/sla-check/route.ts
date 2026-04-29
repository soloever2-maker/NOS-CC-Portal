export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/send-email";

const CRON_SECRET = process.env.CRON_SECRET;

interface AgentUser {
  id:    string;
  email: string;
  name:  string;
}

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();

  const { data: breachedTickets, error } = await supabase
    .from("tickets")
    .select(`
      id, code, title, due_date,
      assigned_to:users!tickets_assigned_to_id_fkey(id, email, name)
    `)
    .lt("due_date", new Date().toISOString())
    .not("due_date", "is", null)
    .not("status", "in", '("RESOLVED","CLOSED")')
    .is("sla_breach_notified_at", null);

  if (error) {
    console.error("[sla-check] fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!breachedTickets || breachedTickets.length === 0) {
    return NextResponse.json({ checked: 0, notified: 0 });
  }

  const { data: admins } = await supabase
    .from("users")
    .select("id, email, name")
    .in("role", ["ADMIN", "SUPER_ADMIN", "MANAGER"])
    .eq("is_active", true);

  let notified = 0;

  for (const ticket of breachedTickets) {
    // ── fix: cast the joined relation safely ──────────────────────────────
    const rawAgent = ticket.assigned_to;
    const agent: AgentUser | null =
      rawAgent && !Array.isArray(rawAgent) && typeof rawAgent === "object"
        ? (rawAgent as AgentUser)
        : Array.isArray(rawAgent) && rawAgent.length > 0
        ? (rawAgent[0] as AgentUser)
        : null;

    const ticketLink = `/dashboard/tickets/${ticket.id}`;
    const overdue    = new Date(ticket.due_date as string);
    const now        = new Date();
    const hoursOver  = Math.round((now.getTime() - overdue.getTime()) / 3_600_000);
    const overdueStr = hoursOver <= 1 ? "just now" : `${hoursOver} hours ago`;

    const emailPayload = {
      title:   `SLA Breached — ${ticket.code}`,
      message: `Ticket "${ticket.title}" exceeded its SLA deadline (${overdueStr}). Immediate action required.`,
      link:    ticketLink,
      type:    "SYSTEM" as const,
    };

    const recipients: AgentUser[] = [];
    if (agent?.email) recipients.push(agent);
    for (const admin of admins ?? []) {
      if (!agent || admin.id !== agent.id) recipients.push(admin);
    }

    await Promise.allSettled(
      recipients.map(r =>
        sendNotificationEmail({
          to:      r.email,
          name:    r.name,
          ...emailPayload,
        })
      )
    );

    const notifRecipientIds = [
      ...(agent ? [agent.id] : []),
      ...(admins ?? []).filter(a => !agent || a.id !== agent.id).map(a => a.id),
    ];

    if (notifRecipientIds.length > 0) {
      await supabase.from("notifications").insert(
        notifRecipientIds.map(uid => ({
          id:      crypto.randomUUID(),
          user_id: uid,
          type:    "SYSTEM",
          title:   emailPayload.title,
          message: emailPayload.message,
          link:    ticketLink,
          is_read: false,
        }))
      );
    }

    await supabase
      .from("tickets")
      .update({ sla_breach_notified_at: now.toISOString() })
      .eq("id", ticket.id);

    notified++;
  }

  return NextResponse.json({ checked: breachedTickets.length, notified });
}
