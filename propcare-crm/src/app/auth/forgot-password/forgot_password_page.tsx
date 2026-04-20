"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-elements";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.endsWith("@nationsofsky.com")) {
      setError("Only @nationsofsky.com email addresses are allowed");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/set-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
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

        {sent ? (
          /* Success State */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "var(--success)" }} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                Check your email
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                We sent a password reset link to <span style={{ color: "var(--gold-400)" }}>{email}</span>
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Click the link in the email to set a new password.
              </p>
            </div>
            <Link href="/auth/login">
              <Button variant="secondary" className="w-full mt-4">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          /* Form State */
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                Forgot password?
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-[10px] mb-5 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@nationsofsky.com"
                  startIcon={<Mail className="w-3.5 h-3.5" />}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>

            <Link href="/auth/login" className="flex items-center justify-center gap-1.5 mt-6 text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
