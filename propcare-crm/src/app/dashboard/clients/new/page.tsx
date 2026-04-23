"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, X, Phone, Building2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NOS_PROJECTS } from "@/lib/constants";
import { PROPERTY_TYPE_LABELS } from "@/types";
import { createClient as supabase } from "@/lib/supabase/client";

interface UnitDraft {
  unit: string; project: string; type: string;
  floor: string; bedrooms: string; area: string; relation: string;
}
const RELATIONS = ["owner", "tenant", "prospect"] as const;
const RELATION_STYLE: Record<string, { bg: string; color: string }> = {
  owner:    { bg: "rgba(201,168,76,0.1)",  color: "var(--gold-500)" },
  tenant:   { bg: "rgba(59,130,246,0.1)",  color: "var(--info)" },
  prospect: { bg: "rgba(100,100,100,0.1)", color: "var(--text-muted)" },
};

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

  const [units, setUnits] = useState<UnitDraft[]>([]);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [unitDraft, setUnitDraft] = useState<UnitDraft>({
    unit: "", project: "", type: "APARTMENT", floor: "", bedrooms: "", area: "", relation: "owner",
  });

  const addUnit = () => {
    if (!unitDraft.unit.trim()) return;
    setUnits(prev => [...prev, { ...unitDraft }]);
    setUnitDraft({ unit: "", project: "", type: "APARTMENT", floor: "", bedrooms: "", area: "", relation: "owner" });
    setShowUnitForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const clientId = json.data.id;

      const sb = supabase();
      for (const u of units) {
        const propRes = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: `${clientId.slice(0, 4).toUpperCase()}-${u.unit}`,
            name: [u.project, `Unit ${u.unit}`].filter(Boolean).join(" — "),
            type: u.type, status: "SOLD",
            project: u.project || null, unit: u.unit,
            floor: u.floor ? parseInt(u.floor) : undefined,
            bedrooms: u.bedrooms ? parseInt(u.bedrooms) : undefined,
            area: u.area ? parseFloat(u.area) : undefined,
            amenities: [],
          }),
        });
        const propJson = await propRes.json();
        if (!propJson.success) continue;
        await sb.from("client_properties").insert({
          id: crypto.randomUUID(), client_id: clientId,
          property_id: propJson.data.id, relation: u.relation,
        });
      }
      router.push(`/dashboard/clients/${clientId}`);
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

          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>BASIC INFORMATION</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Full Name *</Label>
                  <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ahmed Al-Farsi" required /></div>
                <div><Label className="mb-1.5 block">Nationality</Label>
                  <Input value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="Egyptian" /></div>
                <div><Label className="mb-1.5 block">ID Number</Label>
                  <Input value={form.idNumber} onChange={e => set("idNumber", e.target.value)} placeholder="National ID / Passport" /></div>
                <div><Label className="mb-1.5 block">Email</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" /></div>
                <div><Label className="mb-1.5 block">City</Label>
                  <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Cairo" /></div>
                <div><Label className="mb-1.5 block">Address</Label>
                  <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Street, Area" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>CONTACT NUMBERS</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block flex items-center gap-1.5"><Phone className="w-3 h-3" /> Primary Phone *</Label>
                  <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+20 10 0000 0000" required /></div>
                <div><Label className="mb-1.5 block flex items-center gap-1.5"><Phone className="w-3 h-3" /> Secondary Phone</Label>
                  <Input value={form.phone2} onChange={e => set("phone2", e.target.value)} placeholder="+20 11 0000 0000" /></div>
                <div><Label className="mb-1.5 block">WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="+20 10 0000 0000" /></div>
                <div><Label className="mb-1.5 block">Referral / Emergency</Label>
                  <Input value={form.referralNumber} onChange={e => set("referralNumber", e.target.value)} placeholder="Family member / Referral" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Units */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                  <Building2 className="w-3.5 h-3.5" style={{ color: "var(--gold-500)" }} /> UNITS ({units.length})
                </CardTitle>
                {!showUnitForm && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowUnitForm(true)}>
                    <Plus className="w-3.5 h-3.5" /> Add Unit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {units.map((u, i) => {
                const rel = RELATION_STYLE[u.relation] ?? { bg: "rgba(100,100,100,0.1)", color: "var(--text-muted)" };
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: "var(--black-700)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Unit {u.unit}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {[u.project, u.type, u.floor && `Floor ${u.floor}`, u.bedrooms && `${u.bedrooms}BR`, u.area && `${u.area}m²`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold" style={{ background: rel.bg, color: rel.color, border: `1px solid ${rel.color}44` }}>{u.relation}</span>
                      <button type="button" onClick={() => setUnits(prev => prev.filter((_, idx) => idx !== i))} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-500/10" style={{ color: "var(--text-muted)" }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {showUnitForm && (
                <div className="p-4 rounded-[12px] space-y-3" style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="mb-1 block text-xs">Unit Number *</Label>
                      <Input value={unitDraft.unit} onChange={e => setUnitDraft(p => ({ ...p, unit: e.target.value }))} placeholder="2401" className="h-8 text-sm" /></div>
                    <div><Label className="mb-1 block text-xs">Project</Label>
                      <Select value={unitDraft.project} onValueChange={v => setUnitDraft(p => ({ ...p, project: v }))}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent>{NOS_PROJECTS.map(pr => <SelectItem key={pr} value={pr}>{pr}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div><Label className="mb-1 block text-xs">Type</Label>
                      <Select value={unitDraft.type} onValueChange={v => setUnitDraft(p => ({ ...p, type: v }))}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div><Label className="mb-1 block text-xs">Floor</Label>
                      <Input type="number" value={unitDraft.floor} onChange={e => setUnitDraft(p => ({ ...p, floor: e.target.value }))} placeholder="24" className="h-8 text-sm" /></div>
                    <div><Label className="mb-1 block text-xs">Bedrooms</Label>
                      <Input type="number" value={unitDraft.bedrooms} onChange={e => setUnitDraft(p => ({ ...p, bedrooms: e.target.value }))} placeholder="3" className="h-8 text-sm" /></div>
                    <div><Label className="mb-1 block text-xs">Area (m²)</Label>
                      <Input type="number" value={unitDraft.area} onChange={e => setUnitDraft(p => ({ ...p, area: e.target.value }))} placeholder="180" className="h-8 text-sm" /></div>
                  </div>
                  <div className="flex gap-2">
                    {RELATIONS.map(r => {
                      const s = RELATION_STYLE[r];
                      return (
                        <button key={r} type="button" onClick={() => setUnitDraft(p => ({ ...p, relation: r }))}
                          className="flex-1 py-1.5 rounded-[8px] text-xs font-semibold capitalize transition-all"
                          style={{ background: unitDraft.relation === r ? s.bg : "var(--black-600)", border: unitDraft.relation === r ? `1px solid ${s.color}` : "1px solid var(--border)", color: unitDraft.relation === r ? s.color : "var(--text-muted)" }}>
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" className="flex-1" onClick={addUnit} disabled={!unitDraft.unit.trim()}>Add Unit</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowUnitForm(false)}>Cancel</Button>
                  </div>
                </div>
              )}
              {units.length === 0 && !showUnitForm && (
                <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>No units yet — add units after saving, or click Add Unit now</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>TAGS & NOTES</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="mb-1.5 block">Tags</Label>
                <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="vip, owner, investor" />
                <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Separate tags with commas</p></div>
              <div><Label className="mb-1.5 block">Notes</Label>
                <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes about this client…" rows={3} /></div>
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
