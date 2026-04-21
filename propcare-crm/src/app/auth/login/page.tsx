"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-elements";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/layout/theme-provider";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }
      router.push("/dashboard");
      router.refresh();
    } catch { setError("An unexpected error occurred. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex relative" style={{ backgroundColor: "var(--black-950)" }}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-[8px] transition-all"
        style={{ background: "var(--black-800)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, var(--black-900) 0%, var(--black-800) 100%)", borderRight: "0.5px solid var(--border)" }}>
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "var(--gold-glow)" }} />
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(201,168,76,0.06)" }} />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-[12px] overflow-hidden flex items-center justify-center" style={{ background: "var(--black-700)" }}>
            <Image src="/logo.png" alt="NOS" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--gold-400)" }}>Nations of Sky</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Customer Care CRM</p>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--text-primary)" }}>
              Premium Real Estate<br /><span style={{ color: "var(--gold-400)" }}>Customer Care</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Manage tickets, clients, and properties with our luxury-grade CRM.
            </p>
          </div>
          <div className="space-y-3">
            {["End-to-end ticket management", "Client & property portfolio", "Real-time team collaboration"].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gold-glow)", border: "1px solid var(--border-strong)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold-500)" }} />
                </div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10">
          <div className="gold-divider mb-4" />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>© {new Date().getFullYear()} Nations of Sky CRM. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--text-primary)" }}>Welcome back</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Sign in to your Nations of Sky account</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-[8px] mb-5 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Email Address</Label>
              <Input type="email" placeholder="you@nationsofsky.com" value={email} onChange={(e) => setEmail(e.target.value)} startIcon={<Mail className="w-3.5 h-3.5" />} required autoComplete="email" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Password</Label>
                <Link href="/auth/forgot-password" className="text-xs transition-colors" style={{ color: "var(--gold-500)" }}>Forgot password?</Link>
              </div>
              <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
                startIcon={<Lock className="w-3.5 h-3.5" />}
                endIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: "var(--text-muted)" }}>{showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>}
                required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full" style={{ borderTop: "1px solid var(--border)" }} /></div>
            <div className="relative flex justify-center text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="px-3" style={{ background: "var(--black-950)" }}>New to the platform?</span>
            </div>
          </div>

          <Link href="/auth/register">
            <Button variant="secondary" className="w-full">Create Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
