export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCode } from "@/lib/utils";
import { CreateTicketSchema } from "@/lib/validations";

// helper — notify a list of user IDs
async function notifyUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userIds: string[],
  payload: { type: string; title: string; message: string; link: string }
) {
  if (userIds.length === 0) return;
  await supabase.from("notifications").insert(
    userIds.map(uid => ({
      id: crypto.randomUUID(), user_id: uid, is_read: false, ...payload,
    }))
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("id, role").eq("supabase_id", user.id).single();
    const { searchParams } = new URL(req.url);
    const status  = searchParams.get("status");
    const search  = searchParams.get("search");
    const project = searchParams.get("project");
    const isAdmin = profile && ["ADMIN","SUPER_ADMIN","MANAGER"].includes(profile.role);

    const { data: slaSettings } = await supabase.from("sla_settings").select("ticket_type, source, hours").eq("is_active", true);
    const slaMap: Record<string, number> = {};
    for (const s of slaSettings ?? []) {
      const key = s.source ? `${s.ticket_type}:${s.source}` : `${s.ticket_type}:default`;
      slaMap[key] = s.hours;
    }
    const getSlaHours = (category: string, source: string | null, manualHours: number | null) => {
      if (manualHours) return manualHours;
      if (source && slaMap[`${category}:${source}`]) return slaMap[`${category}:${source}`] ?? null;
      return slaMap[`${category}:default`] ?? null;
    };

    let query = supabase
      .from("tickets")
      .select(`*, client:clients(id, name, phone), unit:client_units(id, unit_number, project), assigned_to:users!tickets_assigned_to_id_fkey(id, name), created_by:users!tickets_created_by_id_fkey(id, name)`)
      .order("created_at", { ascending: false });

    if (!isAdmin && profile && !search) query = query.eq("assigned_to_id", profile.id);
    if (status && status !== "ALL") query = query.eq("status", status);
    if (project && project !== "ALL") query = query.eq("project", project);
    if (search) query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const resolvedIds = (data ?? []).filter(t => ["RESOLVED","CLOSED"].includes(t.status)).map(t => t.id);
    let csatMap: Record<string, number> = {};
    if (resolvedIds.length > 0) {
      const { data: csatData } = await supabase.from("csat_scores").select("ticket_id, score").in("ticket_id", resolvedIds);
      for (const c of csatData ?? []) csatMap[c.ticket_id] = c.score;
    }

    const ticketIds = (data ?? []).map(t => t.id);
    let reassignMap: Record<string, { fromName: string; toName: string; at: string } | null> = {};
    if (ticketIds.length > 0) {
      const { data: historyData } = await supabase
        .from("ticket_history").select("ticket_id, old_value, new_value, created_at")
        .in("ticket_id", ticketIds).eq("field", "assigned_to_id").order("created_at", { ascending: false });

      if (historyData && historyData.length > 0) {
        const userIds = [...new Set([...historyData.map(h => h.old_value), ...historyData.map(h => h.new_value)].filter(Boolean))];
        const { data: historyUsers } = await supabase.from("users").select("id, name").in("id", userIds);
        const userNameMap: Record<string, string> = {};
        for (const u of historyUsers ?? []) userNameMap[u.id] = u.name;
        for (const h of historyData) {
          if (!reassignMap[h.ticket_id]) {
            reassignMap[h.ticket_id] = {
              fromName: userNameMap[h.old_value ?? ""] ?? "Unassigned",
              toName:   userNameMap[h.new_value ?? ""] ?? "Unassigned",
              at:       h.created_at,
            };
          }
        }
      }
    }

    const enriched = (data ?? []).map(t => ({
      ...t,
      computed_sla_hours: getSlaHours(t.category, t.source, t.sla_hours),
      csat_score:         csatMap[t.id] ?? null,
      last_reassignment:  reassignMap[t.id] ?? null,
    }));

    return NextResponse.json({ success: true, data: enriched });
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

    const { data: userRecord } = await supabase.from("users").select("id, role, name").eq("supabase_id", user.id).single();
    const isAdmin = userRecord && ["ADMIN","SUPER_ADMIN","MANAGER"].includes(userRecord.role);

    const rawBody = await req.json();
    const parseResult = CreateTicketSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid input", details: parseResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const body = parseResult.data;
    const code = generateCode("TKT");

    const { data: slaSettings } = await supabase.from("sla_settings").select("ticket_type, source, hours").eq("is_active", true);
    const slaMap: Record<string, number> = {};
    for (const s of slaSettings ?? []) {
      const key = s.source ? `${s.ticket_type}:${s.source}` : `${s.ticket_type}:default`;
      slaMap[key] = s.hours;
    }
    const category = body.category ?? "OTHER";
    const source   = body.source ?? "walk_in";
    const resolvedSlaHours = slaMap[`${category}:${source}`] ?? slaMap[`${category}:default`] ?? null;
    const createdAt = new Date();
    const dueDate = resolvedSlaHours ? new Date(createdAt.getTime() + resolvedSlaHours * 60 * 60 * 1000) : null;

    const { data, error } = await supabase.from("tickets").insert({
      id: crypto.randomUUID(), code,
      title: body.title, description: body.description,
      status: body.status ?? "OPEN", priority: body.priority ?? "MEDIUM",
      category, contact_status: body.contactStatus ?? "NOT_CONTACTED",
      project: body.project || null, source,
      sla_hours: resolvedSlaHours, due_date: dueDate?.toISOString() ?? null,
      client_id: body.clientId || null, unit_id: body.unitId || null,
      assigned_to_id: isAdmin ? (body.assignedToId || null) : (userRecord?.id ?? null),
      created_by_id: userRecord?.id ?? user.id,
      tags: body.tags ?? [], attachments: [],
    }).select().single();

    if (error) throw error;

    const notifLink = `/dashboard/tickets/${data.id}`;

    // ── Notify assigned agent ─────────────────────────────────────────────
    if (data.assigned_to_id) {
      await notifyUsers(supabase, [data.assigned_to_id], {
        type: "TICKET_ASSIGNED", title: "New Ticket Assigned",
        message: `${code} — ${body.title}`, link: notifLink,
      });
    }

    // ── Notify all admins & managers ──────────────────────────────────────
    const { data: admins } = await supabase.from("users")
      .select("id").in("role", ["ADMIN","SUPER_ADMIN","MANAGER"])
      .eq("is_active", true).neq("id", userRecord?.id ?? "");

    if (admins && admins.length > 0) {
      await notifyUsers(supabase, admins.map(a => a.id), {
        type: "TICKET_UPDATED", title: "New Ticket Created",
        message: `${code} — ${body.title}`, link: notifLink,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create ticket" }, { status: 500 });
  }
}
