export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history } = await req.json();

    // ── Fetch live data ─────────────────────────────────
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalTickets },
      { count: openTickets },
      { count: resolvedThisMonth },
      { count: totalClients },
      { data: recentTickets },
      { data: agentTickets },
      { data: categoryCounts },
    ] = await Promise.all([
      supabase.from("tickets").select("*", { count: "exact", head: true }),
      supabase.from("tickets").select("*", { count: "exact", head: true }).in("status", ["OPEN","IN_PROGRESS","PENDING_CLIENT"]),
      supabase.from("tickets").select("*", { count: "exact", head: true }).in("status", ["RESOLVED","CLOSED"]).gte("updated_at", monthStart),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("tickets").select("code, title, status, priority, category, project, created_at, client:clients(name)").order("created_at", { ascending: false }).limit(10),
      supabase.from("tickets").select("assigned_to:users!tickets_assigned_to_id_fkey(name), status").not("assigned_to_id", "is", null),
      supabase.from("tickets").select("category"),
    ]);

    // Process agent stats
    const agentMap: Record<string, { name: string; total: number; resolved: number }> = {};
    for (const t of agentTickets ?? []) {
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

    // ── System prompt ───────────────────────────────────
    const systemPrompt = `You are an intelligent CRM analyst for Nations of Sky real estate.
You have access to live data. Be concise, practical, and reply in the same language as the user (Arabic or English).

LIVE DATA:
- Total tickets: ${totalTickets}, Open: ${openTickets}, Resolved this month: ${resolvedThisMonth}
- Total clients: ${totalClients}

Agent performance:
${Object.values(agentMap).map(a => `- ${a.name}: ${a.total} tickets, ${a.resolved} resolved (${a.total > 0 ? Math.round(a.resolved/a.total*100) : 0}%)`).join("\n") || "No data"}

Top categories:
${topCategories.map(([cat, count]) => `- ${cat}: ${count}`).join("\n") || "No data"}

Recent tickets:
${(recentTickets ?? []).map(t => {
  const client = Array.isArray(t.client) ? t.client[0] : t.client;
  return `- [${t.code}] ${t.title} | ${t.status} | ${t.priority} | ${(client as {name?:string}|null)?.name ?? "—"}`;
}).join("\n") || "None"}`;

    // ── Call Groq ───────────────────────────────────────
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).map((m: { role: string; text: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      })),
      { role: "user", content: message },
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `Groq error ${res.status}`);
    const text = data.choices?.[0]?.message?.content ?? "Sorry, no response.";

    return NextResponse.json({ success: true, text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
