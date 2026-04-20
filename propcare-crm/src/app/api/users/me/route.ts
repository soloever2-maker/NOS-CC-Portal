import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("supabase_id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // User not found — create profile
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: crypto.randomUUID(),
          supabase_id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Agent",
          role: "AGENT",
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;
      return NextResponse.json({ success: true, data: newUser });
    }

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}
