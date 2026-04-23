export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Verify requester is authenticated AND is admin/super_admin
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabaseUser
      .from("users")
      .select("role")
      .eq("supabase_id", user.id)
      .single();

    if (!profile || !["ADMIN", "SUPER_ADMIN"].includes(profile.role)) {
      return NextResponse.json({ success: false, error: "Forbidden — Admins only" }, { status: 403 });
    }

    const supabase = await createAdminClient();

    const body = await req.json();
    const { email, name, role } = body as { email: string; name: string; role: string };

    // Validate @nationsofsky.com domain
    if (!email.endsWith("@nationsofsky.com")) {
      return NextResponse.json({
        success: false,
        error: "Only @nationsofsky.com email addresses are allowed",
      }, { status: 400 });
    }

    // Send invite via Supabase
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`,
      data: { name, role: role ?? "AGENT" },
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to send invite";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
