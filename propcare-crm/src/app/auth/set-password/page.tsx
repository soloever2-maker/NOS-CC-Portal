"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-elements";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Set the password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // 2. Get the current auth user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Could not retrieve user after password set");

      // 3. Ensure a row exists in the public users table
      //    (it won't exist yet for invited users — invite only creates auth.users)
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("supabase_id", user.id)
        .single();

      if (!existingUser) {
        // Pull name & role that were passed as metadata when the invite was sent
        const meta = user.user_metadata ?? {};
        const name  = (meta.name  as string) || user.email?.split("@")[0] || "User";
        const role  = (meta.role  as string) || "AGENT";

        const { error: insertError } = await supabase.from("users").insert({
          supabase_id: user.id,
          email:       user.email,
          name,
          role,
        });

        if (insertError) {
          console.error("Failed to create user profile:", insertError);
          // Non-fatal — user can still log in; profile creation can be retried
        }
      }

      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--black-950)" }}>
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-[14px] overflow-hidden flex items-center justify-center mb-4" style={{ background: "var(--black-800)", border: "1px solid var(--border)" }}>
            <Image src="/logo.png" alt="NOS" width={56} height={56} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-400)" }}>
            Nations of Sky
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Customer Care CRM</p>
        </div>

        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle className="w-12 h-12 mx-auto" style={{ color: "var(--success)" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>Password set successfully!</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Redirecting to dashboard…</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Set your password</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Create a secure password for your account
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-[8px] text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="mb-1.5 block">New Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startIcon={<Lock className="w-3.5 h-3.5" />}
                  endIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: "var(--text-muted)" }}>
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  }
                  required
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Confirm Password</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  startIcon={<Lock className="w-3.5 h-3.5" />}
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
                {loading ? "Setting password…" : "Set Password & Login"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
