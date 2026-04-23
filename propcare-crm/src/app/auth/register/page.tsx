import { redirect } from "next/navigation";

// Self-registration is disabled — access is invite-only.
// Admins can invite users from: Dashboard → Settings → Team Management
export default function RegisterPage() {
  redirect("/auth/login");
}
