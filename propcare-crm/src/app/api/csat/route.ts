export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase.from("users").select("id, role").eq("supabase_id", user.id).single();
    const isAdmin = profile && ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(profile.role);

    const { searchParams } = new URL(req.url);
    const month   = Number(searchParams.get("month"));
    const year    = Number(searchParams.get("year"));
    const agentId = searchParams.get("agentId");

    let query = supabase
      .from("csat_scores")
      .select("*, ticket:tickets(id, code, title), agent:users(id, name)")
      .eq("month", month)
      .eq("year", year)
      .order("created_at", { ascending: false });

    // ── Agents only see their own CSAT ──────────────────────────────────
    if (!isAdmin && profile) {
      query = query.eq("agent_id", profile.id);
    } else if (agentId && agentId !== "ALL") {
      query = query.eq("agent_id", agentId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
