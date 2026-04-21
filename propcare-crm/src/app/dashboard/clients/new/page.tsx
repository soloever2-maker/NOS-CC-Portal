"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, X, Phone } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", phone2: "", whatsapp: "",
    referralNumber: "", nationality: "", idNumber: "",
    address: "", city: "", notes: "", tags: "",
  });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push(`/dashboard/clients/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="New Client" subtitle="Add a new client to the database"
        actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>}
      />
      <div className="flex-1 p-6">
        {error && <div className="mb-4 p-3 rounded-[8px] text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{error}</div>}
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">

          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>BASIC INFORMATION</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Full Name *</Label>
                  <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ahmed Al-Farsi" required />
                </div>
                <div><Label className="mb-1.5 block">Nationality</Label>
                  <Input value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="Egyptian" />
                </div>
                <div><Label className="mb-1.5 block">ID Number</Label>
                  <Input value={form.idNumber} onChange={e => set("idNumber", e.target.value)} placeholder="National ID / Passport" />
                </div>
                <div><Label className="mb-1.5 block">Email</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
                </div>
                <div><Label className="mb-1.5 block">City</Label>
                  <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Cairo" />
                </div>
                <div><Label className="mb-1.5 block">Address</Label>
                  <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, Area" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Numbers */}
          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>CONTACT NUMBERS</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Primary Phone *
                  </Label>
                  <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+20 10 0000 0000" required />
                </div>
                <div>
                  <Label className="mb-1.5 block flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Secondary Phone
                  </Label>
                  <Input value={form.phone2} onChange={e => set("phone2", e.target.value)} placeholder="+20 11 0000 0000" />
                </div>
                <div>
                  <Label className="mb-1.5 block">WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="+20 10 0000 0000" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Referral / Emergency Number</Label>
                  <Input value={form.referralNumber} onChange={e => set("referralNumber", e.target.value)} placeholder="Family member / Referral" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags & Notes */}
          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>TAGS & NOTES</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Tags</Label>
                <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="vip, owner, tenant, investor" />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Separate tags with commas</p>
              </div>
              <div>
                <Label className="mb-1.5 block">Notes</Label>
                <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes about this client…" rows={3} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" loading={loading}><Save className="w-4 h-4" />{loading ? "Saving…" : "Create Client"}</Button>
            <Button type="button" variant="secondary" asChild><Link href="/dashboard/clients">Cancel</Link></Button>
          </div>
        </form>
      </div>
    </div>
  );
}
