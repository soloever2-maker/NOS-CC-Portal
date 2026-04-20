import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Get or create user profile
  let { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("supabase_id", user.id)
    .single();

  if (!profile) {
    const { data: newProfile } = await supabase
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
    profile = newProfile;
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--black-950)" }}>
      <Sidebar user={profile} />
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden" style={{ marginLeft: 260 }}>
        {children}
      </main>
    </div>
  );
}
