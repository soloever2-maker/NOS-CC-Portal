import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let { data: profile } = await supabase
    .from("users").select("*").eq("supabase_id", user.id).single();

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
      .select().single();
    profile = newProfile;
  }

return (
    <DashboardWrapper>
      <SidebarLayout user={profile}>
        {children}
      </SidebarLayout>
    </DashboardWrapper>
  );
}
