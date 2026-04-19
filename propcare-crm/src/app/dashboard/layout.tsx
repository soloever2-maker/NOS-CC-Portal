import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile from public.users
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("supabase_id", user.id)
    .single();

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--black-950)" }}>
      {/* Sidebar */}
      <Sidebar user={profile} />

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col min-h-screen overflow-x-hidden"
        style={{ marginLeft: 260 }}
      >
        {children}
      </main>
    </div>
  );
}
