export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/send-email";

// الـ secret بيحمي الـ endpoint من أي حد يستدعيه برا
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // تحقق من الـ secret لو موجود
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();

  // جيب كل التيكتات اللي:
  // 1. due_date فاتت
  // 2. مش resolved أو closed
  // 3. لسه ماتبعتلهاش إيميل SLA قبل كده
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

  // جيب الأدمن والمانجر عشان يوصلهم الإيميل كمان
  const { data: admins } = await supabase
    .from("users")
    .select("id, email, name")
    .in("role", ["ADMIN", "SUPER_ADMIN", "MANAGER"])
    .eq("is_active", true);

  let notified = 0;

  for (const ticket of breachedTickets) {
    const ticketLink = `/dashboard/tickets/${ticket.id}`;
    const overdue    = new Date(ticket.due_date!);
    const now        = new Date();
    const hoursOver  = Math.round((now.getTime() - overdue.getTime()) / 3_600_000);
    const overdueStr = hoursOver <= 1 ? "just now" : `${hoursOver} hours ago`;

    const emailPayload = {
      title:   `SLA Breached — ${ticket.code}`,
      message: `Ticket "${ticket.title}" exceeded its SLA deadline (${overdueStr}). Immediate action required.`,
      link:    ticketLink,
      type:    "SYSTEM" as const,
    };

    // recipients = agent (لو موجود) + كل الأدمن
    const recipients: { email: string; name: string }[] = [];

    const agent = ticket.assigned_to as { id: string; email: string; name: string } | null;
    if (agent?.email) recipients.push({ email: agent.email, name: agent.name });

    for (const admin of admins ?? []) {
      // متبعتش للأدمن اللي هو نفس الأيجنت (لو أدمن معين التيكت لنفسه)
      if (!agent || admin.id !== agent.id) {
        recipients.push({ email: admin.email, name: admin.name });
      }
    }

    // ابعت الإيميلات
    await Promise.allSettled(
      recipients.map(r =>
        sendNotificationEmail({
          to:      r.email,
          name:    r.name,
          ...emailPayload,
        })
      )
    );

    // اعمل DB notification عشان تظهر في الـ bell icon جوا التطبيق
    const notifRecipientIds = [
      ...(agent ? [agent.id] : []),
      ...(admins ?? []).filter(a => !agent || a.id !== agent.id).map(a => a.id),
    ];

    if (notifRecipientIds.length > 0) {
      await supabase.from("notifications").insert(
        notifRecipientIds.map(uid => ({
          id:       crypto.randomUUID(),
          user_id:  uid,
          type:     "SYSTEM",
          title:    emailPayload.title,
          message:  emailPayload.message,
          link:     ticketLink,
          is_read:  false,
        }))
      );
    }

    // علّم التيكت إنه اتبعتله إيميل عشان منبعتوش تاني
    await supabase
      .from("tickets")
      .update({ sla_breach_notified_at: now.toISOString() })
      .eq("id", ticket.id);

    notified++;
  }

  console.log(`[sla-check] checked ${breachedTickets.length}, notified ${notified}`);
  return NextResponse.json({ checked: breachedTickets.length, notified });
}
