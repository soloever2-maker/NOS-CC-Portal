export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history } = await req.json();

    // ── Fetch live data from DB ─────────────────────────
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalTickets },
      { count: openTickets },
      { count: overdueTickets },
      { count: resolvedThisMonth },
      { count: totalClients },
      { data: recentTickets },
      { data: agentStats },
      { data: categoryCounts },
    ] = await Promise.all([
      supabase.from("tickets").select("*", { count: "exact", head: true }),
      supabase.from("tickets").select("*", { count: "exact", head: true }).in("status", ["OPEN","IN_PROGRESS","PENDING_CLIENT"]),
      supabase.from("tickets").select("*", { count: "exact", head: true }).in("status", ["OPEN","IN_PROGRESS"]).lt("due_date", now.toISOString()),
      supabase.from("tickets").select("*", { count: "exact", head: true }).in("status", ["RESOLVED","CLOSED"]).gte("updated_at", monthStart),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("tickets").select("code, title, status, priority, category, project, created_at, client:clients(name)").order("created_at", { ascending: false }).limit(10),
      supabase.from("tickets").select("assigned_to:users!tickets_assigned_to_id_fkey(name), status").not("assigned_to_id", "is", null),
      supabase.from("tickets").select("category"),
    ]);

    // Process agent stats
    const agentMap: Record<string, { name: string; total: number; resolved: number }> = {};
    for (const t of agentStats ?? []) {
      const name = Array.isArray(t.assigned_to) ? t.assigned_to[0]?.name : (t.assigned_to as { name: string } | null)?.name;
      if (!name) continue;
      if (!agentMap[name]) agentMap[name] = { name, total: 0, resolved: 0 };
      agentMap[name].total++;
      if (["RESOLVED","CLOSED"].includes(t.status)) agentMap[name].resolved++;
    }

    // Process category stats
    const catMap: Record<string, number> = {};
    for (const t of categoryCounts ?? []) {
      catMap[t.category] = (catMap[t.category] ?? 0) + 1;
    }
    const topCategories = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,5);

    // ── Build system context ────────────────────────────
    const systemPrompt = `You are an intelligent CRM analyst assistant for Nations of Sky real estate company.
You have access to live data and provide practical analysis and recommendations.
Reply in the same language the user writes in (Arabic or English). Be concise and practical.
البيانات الحالية:

📊 **إحصائيات عامة:**
- إجمالي التيكتس: ${totalTickets}
- تيكتس مفتوحة: ${openTickets}
- تيكتس متأخرة (overdue): ${overdueTickets}
- تم حلها الشهر ده: ${resolvedThisMonth}
- إجمالي العملاء: ${totalClients}

🏆 **أداء الأجنتس:**
${Object.values(agentMap).map(a => `- ${a.name}: ${a.total} تيكت إجمالي، ${a.resolved} تم حلها (${a.total > 0 ? Math.round(a.resolved/a.total*100) : 0}%)`).join("\n") || "لا يوجد بيانات"}

📋 **أكثر الفئات:**
${topCategories.map(([cat, count]) => `- ${cat}: ${count} تيكت`).join("\n") || "لا يوجد بيانات"}

🕐 **آخر 10 تيكتس:**
${(recentTickets ?? []).map(t => {
  const client = Array.isArray(t.client) ? t.client[0] : t.client;
  return `- [${t.code}] ${t.title} | ${t.status} | ${t.priority} | ${(client as {name?:string}|null)?.name ?? "—"}`;
}).join("\n") || "لا يوجد"}`;

    const body = {
      contents: contentsWithContext,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "عذراً، حدث خطأ في الاتصال.";

    return NextResponse.json({ success: true, text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
