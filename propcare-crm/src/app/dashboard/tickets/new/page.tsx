"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS,
} from "@/types";

const MOCK_CLIENTS = [
  { id: "1", name: "Ahmed Al-Farsi", phone: "+971 50 123 4567" },
  { id: "2", name: "Fatima Hassan", phone: "+971 55 987 6543" },
  { id: "3", name: "James Thornton", phone: "+971 52 456 7890" },
  { id: "4", name: "Nour Al-Din", phone: "+971 56 234 5678" },
];

const MOCK_AGENTS = [
  { id: "1", name: "Sarah Mitchell" },
  { id: "2", name: "Omar Al-Rashid" },
  { id: "3", name: "Priya Sharma" },
  { id: "4", name: "James Thornton" },
];

const MOCK_PROPERTIES = [
  { id: "1", name: "Bloom Heights - Tower A", code: "BH-A" },
  { id: "2", name: "Marina Bay Residences", code: "MBR" },
  { id: "3", name: "Creek View Apartments", code: "CVA" },
  { id: "4", name: "Downtown Suites", code: "DS" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "OTHER",
    status: "OPEN",
    clientId: "",
    propertyId: "",
    assignedToId: "",
    dueDate: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    router.push("/dashboard/tickets");
  };

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="New Ticket"
        subtitle="Create a new customer care ticket"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/tickets">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
            {/* ── Main Details ── */}
            <div className="xl:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    TICKET DETAILS
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Title *</Label>
                    <Input
                      placeholder="Brief description of the issue"
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Description *</Label>
                    <Textarea
                      placeholder="Detailed description of the issue, steps to reproduce, expected outcome…"
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={5}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block">Category</Label>
                      <Select value={form.category} onValueChange={(v) => set("category", v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Due Date</Label>
                      <Input
                        type="datetime-local"
                        value={form.dueDate}
                        onChange={(e) => set("dueDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Tags</Label>
                    <Input
                      placeholder="Enter tags separated by commas"
                      value={form.tags}
                      onChange={(e) => set("tags", e.target.value)}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      e.g. urgent, vip-client, repeat-issue
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    ATTACHMENTS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed rounded-[10px] p-8 text-center transition-colors cursor-pointer"
                    style={{ borderColor: "var(--border-strong)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--gold-500)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-strong)")}
                  >
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      Drop files here or{" "}
                      <span style={{ color: "var(--gold-500)" }}>browse</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      PNG, JPG, PDF, DOCX up to 10MB each
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Sidebar Fields ── */}
            <div className="space-y-4">
              {/* Status & Priority */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    STATUS & PRIORITY
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="mb-1.5 block">Status</Label>
                    <Select value={form.status} onValueChange={(v) => set("status", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Priority</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(TICKET_PRIORITY_LABELS).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => set("priority", p)}
                          className="py-1.5 px-2 rounded-[6px] text-xs font-semibold transition-all"
                          style={{
                            background: form.priority === p ? "var(--gold-glow)" : "var(--black-700)",
                            border: form.priority === p ? "1px solid var(--gold-500)" : "1px solid var(--black-500)",
                            color: form.priority === p ? "var(--gold-400)" :
                              p === "URGENT" ? "var(--danger)" :
                              p === "HIGH" ? "var(--warning)" :
                              p === "MEDIUM" ? "var(--info)" : "var(--text-muted)",
                          }}
                        >
                          {TICKET_PRIORITY_LABELS[p as keyof typeof TICKET_PRIORITY_LABELS]}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    ASSIGNMENT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="mb-1.5 block">Client</Label>
                    <Select value={form.clientId} onValueChange={(v) => set("clientId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client…" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_CLIENTS.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Property</Label>
                    <Select value={form.propertyId} onValueChange={(v) => set("propertyId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property…" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_PROPERTIES.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-1.5 block">Assign To</Label>
                    <Select value={form.assignedToId} onValueChange={(v) => set("assignedToId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent…" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_AGENTS.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button type="submit" className="w-full" loading={loading}>
                  <Save className="w-4 h-4" />
                  {loading ? "Creating…" : "Create Ticket"}
                </Button>
                <Button type="button" variant="secondary" className="w-full" asChild>
                  <Link href="/dashboard/tickets">Cancel</Link>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
