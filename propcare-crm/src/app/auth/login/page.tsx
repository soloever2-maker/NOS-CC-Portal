"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-elements";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--black-950)" }}
    >
      {/* ── Left Panel: Branding ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, var(--black-900) 0%, var(--black-800) 100%)",
          borderRight: "0.5px solid var(--border)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "var(--gold-glow)" }}
        />
        <div
          className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "rgba(201,168,76,0.08)" }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center"
            style={{ background: "var(--gold-500)" }}
          >
            <Crown className="w-5 h-5" style={{ color: "var(--black-950)" }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "var(--gold-400)",
              }}
            >
              PropCare
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              CRM Platform
            </p>
          </div>
        </div>

        {/* Middle content */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2
              className="text-3xl font-bold leading-tight mb-3"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "var(--text-primary)",
              }}
            >
              Premium Real Estate
              <br />
              <span style={{ color: "var(--gold-400)" }}>Customer Care</span>
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Manage tickets, clients, leads, and properties with our luxury-grade CRM built for the real estate industry.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              "End-to-end ticket management",
              "Client & property portfolio",
              "Lead pipeline & conversion",
              "Real-time team collaboration",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--gold-glow)", border: "1px solid var(--border-strong)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--gold-500)" }} />
                </div>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <div className="gold-divider mb-4" />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} PropCare CRM. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "var(--gold-500)" }}>
              <Crown className="w-4.5 h-4.5" style={{ color: "var(--black-950)" }} />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-400)" }}>
              PropCare CRM
            </span>
          </div>

          <div className="mb-8">
            <h2
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--text-primary)" }}
            >
              Welcome back
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to your PropCare account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="flex items-center gap-2.5 p-3 rounded-[10px] mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Email Address</Label>
              <Input
                type="email"
                placeholder="you@propcare.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                startIcon={<Mail className="w-3.5 h-3.5" />}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "var(--gold-500)" }}
                  onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--gold-300)")}
                  onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--gold-500)")}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                startIcon={<Lock className="w-3.5 h-3.5" />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="transition-colors"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid var(--border)" }} />
            </div>
            <div className="relative flex justify-center text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="px-3" style={{ background: "var(--black-950)" }}>
                Demo credentials
              </span>
            </div>
          </div>

          {/* Demo credentials */}
          <div
            className="rounded-[10px] p-4 space-y-2 text-xs"
            style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Demo Access</p>
            <div className="space-y-1" style={{ color: "var(--text-muted)" }}>
              <p>📧 admin@propcare.demo</p>
              <p>🔑 PropCare2024!</p>
            </div>
            <button
              type="button"
              onClick={() => { setEmail("admin@propcare.demo"); setPassword("PropCare2024!"); }}
              className="text-xs font-semibold transition-colors"
              style={{ color: "var(--gold-500)" }}
            >
              Auto-fill credentials →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
