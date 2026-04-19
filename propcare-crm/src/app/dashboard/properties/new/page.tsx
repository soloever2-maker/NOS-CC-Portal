"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from "@/types";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "APARTMENT", status: "AVAILABLE", project: "", unit: "", floor: "", bedrooms: "", bathrooms: "", area: "", price: "", city: "", description: "" });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    router.push("/dashboard/properties");
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Add Property" subtitle="Add a new property to the portfolio"
        actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/properties"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>}
      />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>PROPERTY DETAILS</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Property Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Bloom Heights Tower A - 401" required /></div>
                <div><Label className="mb-1.5 block">Code *</Label><Input value={form.code} onChange={e => set("code", e.target.value)} placeholder="BHA-401" required /></div>
                <div><Label className="mb-1.5 block">Type</Label>
                  <Select value={form.type} onValueChange={v => set("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="mb-1.5 block">Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PROPERTY_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="mb-1.5 block">Project</Label><Input value={form.project} onChange={e => set("project", e.target.value)} placeholder="Bloom Heights" /></div>
                <div><Label className="mb-1.5 block">Unit</Label><Input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="401" /></div>
                <div><Label className="mb-1.5 block">Floor</Label><Input type="number" value={form.floor} onChange={e => set("floor", e.target.value)} placeholder="4" /></div>
                <div><Label className="mb-1.5 block">City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Dubai" /></div>
                <div><Label className="mb-1.5 block">Bedrooms</Label><Input type="number" value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="2" /></div>
                <div><Label className="mb-1.5 block">Bathrooms</Label><Input type="number" value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} placeholder="2" /></div>
                <div><Label className="mb-1.5 block">Area (sq.ft)</Label><Input type="number" value={form.area} onChange={e => set("area", e.target.value)} placeholder="1250" /></div>
                <div><Label className="mb-1.5 block">Price (AED)</Label><Input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="2100000" /></div>
              </div>
              <div><Label className="mb-1.5 block">Description</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Property description…" rows={3} /></div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="submit" loading={loading}><Save className="w-4 h-4" />{loading ? "Saving…" : "Add Property"}</Button>
            <Button type="button" variant="secondary" asChild><Link href="/dashboard/properties">Cancel</Link></Button>
          </div>
        </form>
      </div>
    </div>
  );
}
