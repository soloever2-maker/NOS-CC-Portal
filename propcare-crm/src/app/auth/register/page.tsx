"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Mail, User, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-elements";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email.endsWith("@nationsofsky.com")) {
      setError("Only @nationsofsky.com email addresses are allowed");
      return;
    }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) throw err;
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--black-950)" }}>
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, var(--black-900), var(--black-800))", borderRight: "0.5px solid var(--border)" }}>
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: "var(--gold-glow)" }} />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-[12px] overflow-hidden" style={{ background: "var(--black-700)" }}>
            <Image src="/logo.png" alt="NOS" width={40} height={40} className="object-contain w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-400)" }}>Nations of Sky</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Customer Care CRM</p>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
            Join the team<br /><span style={{ color: "var(--gold-400)" }}>Nations of Sky</span>
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Create your account to access the customer care platform.<br />
            Only <strong style={{ color: "var(--gold-400)" }}>@nationsofsky.com</strong> emails are allowed.
          </p>
        </div>
        <p className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>© {new Date().getFullYear()} Nations of Sky CRM</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>Create Account</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Register with your company email</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-[10px] mb-5 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label className="mb-1.5 block">Full Name</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ahmed Mohamed" startIcon={<User className="w-3.5 h-3.5" />} required />
            </div>
            <div><Label className="mb-1.5 block">Email Address</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="ahmed@nationsofsky.com" startIcon={<Mail className="w-3.5 h-3.5" />} required />
            </div>
            <div><Label className="mb-1.5 block">Password</Label>
              <Input type={showPassword ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Minimum 8 characters" startIcon={<Lock className="w-3.5 h-3.5" />}
                endIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: "var(--text-muted)" }}>{showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>} required />
            </div>
            <div><Label className="mb-1.5 block">Confirm Password</Label>
              <Input type={showPassword ? "text" : "password"} value={form.confirm} onChange={e => set("confirm", e.target.value)} placeholder="Repeat password" startIcon={<Lock className="w-3.5 h-3.5" />} required />
            </div>
            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold" style={{ color: "var(--gold-500)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
