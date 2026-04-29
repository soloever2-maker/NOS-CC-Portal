export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, history } = await req.json();

    // ── 1. Search relevant policies ──────────────────────────────────────────
    // بنكسّر السؤال لكلمات ونبحث عنها في عنوان ومحتوى السياسات
    const keywords = message
      .replace(/[؟?!،,]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length > 2)
      .slice(0, 6);

    let policyContext = "";
    if (keywords.length > 0) {
      // نبحث بكل كلمة على حدة ونجمع النتايج
      const policyPromises = keywords.map((kw: string) =>
        supabase.from("policies")
          .select("title, content")
          .or(`title.ilike.%${kw}%,content.ilike.%${kw}%`)
          .limit(2)
      );
      const results = await Promise.all(policyPromises);

      // نجمع السياسات الفريدة
      const seen = new Set<string>();
      const matched: { title: string; content: string }[] = [];
      for (const { data } of results) {
        for (const p of data ?? []) {
          if (!seen.has(p.title)) {
            seen.add(p.title);
            matched.push(p);
          }
        }
      }

      if (matched.length > 0) {
        policyContext = `\nRELEVANT COMPANY POLICIES:\n` +
          matched.map(p =>
            `## ${p.title}\n${p.content.slice(0, 1500)}` // max 1500 chars per policy
          ).join("\n\n---\n\n");
      }
    }

    // ── 2. Fetch live CRM data ────────────────────────────────────────────────
    const now        = new Date();
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
      supabase.from("tickets").select("code, title, status, priority, category, created_at, client:clients(name)").order("created_at", { ascending: false }).limit(10),
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

    // ── 3. Build system prompt ────────────────────────────────────────────────
    const systemPrompt = `You are an intelligent CRM analyst and policy advisor for Nations of Sky real estate.
Reply in the same language as the user (Arabic or English). Be concise and practical.

When answering about company policies or contracts, rely ONLY on the policy documents provided below.
When answering about tickets, clients, or performance, rely on the live CRM data.
If the user asks about a policy that is not in the documents, say clearly that you don't have that policy on file.
${policyContext}

LIVE CRM DATA:
- Total tickets: ${totalTickets} | Open: ${openTickets} | Resolved this month: ${resolvedThisMonth}
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

    // ── 4. Call Groq ──────────────────────────────────────────────────────────
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
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        messages,
        temperature: 0.5,
        max_tokens:  1024,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? `Groq error ${res.status}`);
    const text = data.choices?.[0]?.message?.content ?? "Sorry, no response.";

    return NextResponse.json({ success: true, text, hadPolicyContext: policyContext.length > 0 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
