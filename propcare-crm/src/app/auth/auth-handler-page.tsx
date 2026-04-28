// src/app/auth/handler/page.tsx
// صفحة client-side بتاخد الـ #access_token من الـ hash وتوجه الـ user
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthHandlerPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // الـ hash بيكون زي ده:
    // #access_token=xxx&type=invite&...
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const type         = params.get("type");
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            router.replace("/auth/login?error=auth_failed");
            return;
          }
          if (type === "invite" || type === "recovery") {
            router.replace("/auth/set-password");
          } else {
            router.replace("/dashboard");
          }
        });
    } else {
      router.replace("/auth/login?error=auth_failed");
    }
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--black-950)" }}>
      <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Authenticating…</p>
    </div>
  );
}
