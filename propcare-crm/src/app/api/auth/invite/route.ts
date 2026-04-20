export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createAdminClient();

    // Verify requester is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
