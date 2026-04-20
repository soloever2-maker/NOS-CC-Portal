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
import { LEAD_STATUS_LABELS } from "@/types";

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", status: "NEW", source: "", budget: "", notes: "", followUpDate: "" });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    router.push("/dashboard/leads");
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="New Lead" subtitle="Add a new lead to the pipeline"
        actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/leads"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>}
      />
      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>LEAD DETAILS</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="mb-1.5 block">Title</Label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="3BR Villa — Palm Jumeirah" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Status</Label>
                  <Select value={form.status} onValueChange={v => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="mb-1.5 block">Source</Label><Input value={form.source} onChange={e => set("source", e.target.value)} placeholder="Website, Referral…" /></div>
                <div><Label className="mb-1.5 block">Budget (AED)</Label><Input type="number" value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="2500000" /></div>
                <div><Label className="mb-1.5 block">Follow Up Date</Label><Input type="date" value={form.followUpDate} onChange={e => set("followUpDate", e.target.value)} /></div>
              </div>
              <div><Label className="mb-1.5 block">Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes about this lead…" rows={3} /></div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="submit" loading={loading}><Save className="w-4 h-4" />{loading ? "Saving…" : "Create Lead"}</Button>
            <Button type="button" variant="secondary" asChild><Link href="/dashboard/leads">Cancel</Link></Button>
          </div>
        </form>
      </div>
    </div>
  );
}
