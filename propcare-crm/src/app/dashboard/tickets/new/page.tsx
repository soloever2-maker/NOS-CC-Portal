"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS } from "@/types";
import { NOS_PROJECTS } from "@/lib/constants";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM", category: "OTHER",
    status: "OPEN", project: "", clientId: "", propertyId: "", dueDate: "", tags: "",
  });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(j => { if (j.success) setClients(j.data ?? []); });
    fetch("/api/properties").then(r => r.json()).then(j => { if (j.success) setProperties(j.data ?? []); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      router.push("/dashboard/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="New Ticket" subtitle="Create a new customer care ticket"
        actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/tickets"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>}
      />
      <div className="flex-1 p-6">
        {error && <div className="mb-4 p-3 rounded-[8px] text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
            <div className="xl:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKET DETAILS</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label className="mb-1.5 block">Title *</Label><Input placeholder="Brief description of the issue" value={form.title} onChange={e => set("title", e.target.value)} required /></div>
                  <div><Label className="mb-1.5 block">Description *</Label><Textarea placeholder="Detailed description…" value={form.description} onChange={e => set("description", e.target.value)} rows={5} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="mb-1.5 block">Category</Label>
                      <Select value={form.category} onValueChange={v => set("category", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="mb-1.5 block">Due Date</Label><Input type="datetime-local" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} /></div>
                  </div>
                  <div><Label className="mb-1.5 block">Tags</Label><Input placeholder="urgent, vip-client…" value={form.tags} onChange={e => set("tags", e.target.value)} /></div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>PROJECT</CardTitle></CardHeader>
                <CardContent>
                  <Select value={form.project} onValueChange={v => set("project", v)}>
                    <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
                    <SelectContent>
                      {NOS_PROJECTS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>STATUS & PRIORITY</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="mb-1.5 block">Status</Label>
                    <Select value={form.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="mb-1.5 block">Priority</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(TICKET_PRIORITY_LABELS).map(p => (
                        <button key={p} type="button" onClick={() => set("priority", p)} className="py-1.5 px-2 rounded-[6px] text-xs font-semibold transition-all"
                          style={{ background: form.priority === p ? "var(--gold-glow)" : "var(--black-700)", border: form.priority === p ? "1px solid var(--gold-500)" : "1px solid var(--black-500)", color: form.priority === p ? "var(--gold-400)" : p === "URGENT" ? "var(--danger)" : p === "HIGH" ? "var(--warning)" : p === "MEDIUM" ? "var(--info)" : "var(--text-muted)" }}>
                          {TICKET_PRIORITY_LABELS[p as keyof typeof TICKET_PRIORITY_LABELS]}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>ASSIGNMENT</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="mb-1.5 block">Client</Label>
                    <Select value={form.clientId} onValueChange={v => set("clientId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select client…" /></SelectTrigger>
                      <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="mb-1.5 block">Property</Label>
                    <Select value={form.propertyId} onValueChange={v => set("propertyId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select property…" /></SelectTrigger>
                      <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button type="submit" className="w-full" loading={loading}><Save className="w-4 h-4" />{loading ? "Creating…" : "Create Ticket"}</Button>
                <Button type="button" variant="secondary" className="w-full" asChild><Link href="/dashboard/tickets">Cancel</Link></Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
