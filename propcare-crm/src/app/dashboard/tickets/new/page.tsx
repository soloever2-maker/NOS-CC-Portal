"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Search, X, User, Building2, Phone } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS } from "@/types";
import { NOS_PROJECTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const TICKET_SOURCES = [
  { value: "walk_in",    label: "Walk-in Client" },
  { value: "call_center", label: "Call Center" },
  { value: "email",      label: "Email" },
];

interface Client {
  id: string; name: string; phone: string; whatsapp?: string | null;
  _count?: { properties: number };
}
interface Property {
  id: string; name: string; unit?: string | null; project?: string | null; type: string;
}
interface ClientProperty {
  property: Property | Property[];
}

// ── Smart Search Combobox ──
function SearchCombobox({
  placeholder, value, onSelect, onClear,
  renderResult, search, setSearch, results, loading,
}: {
  placeholder: string;
  value: React.ReactNode | null;
  onSelect: (item: unknown) => void;
  onClear: () => void;
  renderResult: (item: unknown) => React.ReactNode;
  search: string;
  setSearch: (s: string) => void;
  results: unknown[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-[8px]"
        style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
        <div className="flex-1 min-w-0">{value}</div>
        <button type="button" onClick={onClear} className="w-5 h-5 flex items-center justify-center rounded-full ml-2 shrink-0 hover:bg-red-500/10" style={{ color: "var(--text-muted)" }}>
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder}
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        startIcon={<Search className="w-3.5 h-3.5" />}
        className="h-9 text-sm"
      />
      {open && (search.length > 0 || results.length > 0) && (
        <div className="absolute z-20 top-full mt-1 w-full rounded-[10px] overflow-hidden shadow-xl max-h-56 overflow-y-auto"
          style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
          {loading ? (
            <div className="flex justify-center py-4"><div className="w-4 h-4 border border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
          ) : results.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
              {search.length > 0 ? "No results found" : "Start typing to search…"}
            </p>
          ) : results.map((item, i) => (
            <button key={i} type="button"
              onClick={() => { onSelect(item); setOpen(false); setSearch(""); }}
              className="w-full text-left px-3 py-2.5 transition-colors hover:bg-[var(--gold-glow)] border-b last:border-b-0"
              style={{ borderColor: "var(--border)" }}>
              {renderResult(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [agents,   setAgents]   = useState<{ id: string; name: string }[]>([]);

  // Client search
  const [clientSearch,   setClientSearch]   = useState("");
  const [clientResults,  setClientResults]  = useState<Client[]>([]);
  const [clientLoading,  setClientLoading]  = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Property search
  const [propSearch,    setPropSearch]    = useState("");
  const [propResults,   setPropResults]   = useState<Property[]>([]);
  const [propLoading,   setPropLoading]   = useState(false);
  const [selectedProp,  setSelectedProp]  = useState<Property | null>(null);
  const [clientProps,   setClientProps]   = useState<Property[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM", category: "OTHER",
    status: "OPEN", project: "", source: "walk_in",
    assignedToId: "", dueDate: "", tags: "",
  });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  // Pre-fill clientId from URL param
  useEffect(() => {
    const clientId = searchParams.get("clientId");
    if (clientId) {
      const supabase = createClient();
      supabase.from("clients").select("id, name, phone, whatsapp").eq("id", clientId).single()
        .then(({ data }) => { if (data) handleSelectClient(data as Client); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("users").select("id, role").eq("supabase_id", user.id).single()
        .then(({ data: profile }) => {
          if (!profile) return;
          const admin = ["ADMIN","SUPER_ADMIN","MANAGER"].includes(profile.role);
          setIsAdmin(admin);
          if (admin) supabase.from("users").select("id, name").eq("is_active", true).then(({ data }) => setAgents(data ?? []));
        });
    });
  }, []);

  // Client search
  useEffect(() => {
    if (!clientSearch.trim()) { setClientResults([]); return; }
    setClientLoading(true);
    const supabase = createClient();
    const q = clientSearch.trim();
    supabase.from("clients").select("id, name, phone, whatsapp")
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%,whatsapp.ilike.%${q}%`)
      .limit(8)
      .then(({ data }) => { setClientResults(data ?? []); setClientLoading(false); });
  }, [clientSearch]);

  // Property search (global — when no client selected)
  useEffect(() => {
    if (selectedClient) return;
    if (!propSearch.trim()) { setPropResults([]); return; }
    setPropLoading(true);
    const supabase = createClient();
    const q = propSearch.trim();
    supabase.from("properties").select("id, name, unit, project, type")
      .or(`name.ilike.%${q}%,unit.ilike.%${q}%,project.ilike.%${q}%`)
      .limit(8)
      .then(({ data }) => { setPropResults(data ?? []); setPropLoading(false); });
  }, [propSearch, selectedClient]);

  // Load client's properties when client selected
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch("");
    setSelectedProp(null);
    setPropSearch("");
    setClientProps([]);

    const supabase = createClient();
    supabase.from("client_properties")
      .select("property:properties(id, name, unit, project, type)")
      .eq("client_id", client.id)
      .then(({ data }) => {
        const props = (data ?? []).map((cp: ClientProperty) => Array.isArray(cp.property) ? cp.property[0] : cp.property).filter(Boolean) as Property[];
        setClientProps(props);
        // Auto-select if only one property
        if (props.length === 1 && props[0]) setSelectedProp(props[0]);
      });
  };

  const handleSelectProp = (prop: Property) => {
    setSelectedProp(prop);
    if (prop.project) set("project", prop.project);
  };

  // Property results: client props or global search
  const displayPropResults = selectedClient
    ? clientProps.filter(p => !propSearch || p.name?.toLowerCase().includes(propSearch.toLowerCase()) || p.unit?.toLowerCase().includes(propSearch.toLowerCase()))
    : propResults;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          clientId: selectedClient?.id ?? "",
          propertyId: selectedProp?.id ?? "",
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
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
        {error && (
          <div className="mb-4 p-3 rounded-[8px] text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">

            {/* ── Main ── */}
            <div className="xl:col-span-2 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>TICKET DETAILS</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block">Title *</Label>
                    <Input placeholder="Brief description of the issue" value={form.title} onChange={e => set("title", e.target.value)} required />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Description *</Label>
                    <Textarea placeholder="Detailed description…" value={form.description} onChange={e => set("description", e.target.value)} rows={5} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block">Source</Label>
                      <Select value={form.source} onValueChange={v => set("source", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TICKET_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Category</Label>
                      <Select value={form.category} onValueChange={v => set("category", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Project</Label>
                      <Select value={form.project} onValueChange={v => set("project", v)}>
                        <SelectTrigger><SelectValue placeholder="Select project…" /></SelectTrigger>
                        <SelectContent>{NOS_PROJECTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-1.5 block">Due Date</Label>
                      <Input type="datetime-local" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Tags</Label>
                    <Input placeholder="urgent, vip-client…" value={form.tags} onChange={e => set("tags", e.target.value)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Sidebar ── */}
            <div className="space-y-4">

              {/* Status & Priority */}
              <Card>
                <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>STATUS & PRIORITY</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="mb-1.5 block">Status</Label>
                    <Select value={form.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Priority</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(TICKET_PRIORITY_LABELS).map(p => (
                        <button key={p} type="button" onClick={() => set("priority", p)}
                          className="py-1.5 px-2 rounded-[6px] text-xs font-semibold transition-all"
                          style={{
                            background: form.priority === p ? "var(--gold-glow)" : "var(--black-700)",
                            border: form.priority === p ? "1px solid var(--gold-500)" : "1px solid var(--black-500)",
                            color: form.priority === p ? "var(--gold-400)" : p === "URGENT" ? "var(--danger)" : p === "HIGH" ? "var(--warning)" : p === "MEDIUM" ? "var(--info)" : "var(--text-muted)",
                          }}>
                          {TICKET_PRIORITY_LABELS[p as keyof typeof TICKET_PRIORITY_LABELS]}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client & Property */}
              <Card>
                <CardHeader><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>CLIENT & PROPERTY</CardTitle></CardHeader>
                <CardContent className="space-y-4">

                  {/* Client Search */}
                  <div>
                    <Label className="mb-1.5 block">Client</Label>
                    <SearchCombobox
                      placeholder="Search by name or phone…"
                      value={selectedClient ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
                            {selectedClient.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none" style={{ color: "var(--text-primary)" }}>{selectedClient.name}</p>
                            <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                              <Phone className="w-2.5 h-2.5" />{selectedClient.phone}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      onSelect={item => handleSelectClient(item as Client)}
                      onClear={() => { setSelectedClient(null); setSelectedProp(null); setClientProps([]); }}
                      search={clientSearch}
                      setSearch={setClientSearch}
                      results={clientResults}
                      loading={clientLoading}
                      renderResult={item => {
                        const c = item as Client;
                        return (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>
                              {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                              <p className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                                <Phone className="w-2.5 h-2.5" />{c.phone}
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>

                  {/* Property Search */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label>Property</Label>
                      {selectedClient && clientProps.length > 0 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>
                          {clientProps.length} unit{clientProps.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <SearchCombobox
                      placeholder={selectedClient ? "Search client units…" : "Search by name or unit…"}
                      value={selectedProp ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
                          <div>
                            <p className="text-sm font-medium leading-none" style={{ color: "var(--text-primary)" }}>{selectedProp.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {[selectedProp.project, selectedProp.unit && `Unit ${selectedProp.unit}`].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      onSelect={item => handleSelectProp(item as Property)}
                      onClear={() => setSelectedProp(null)}
                      search={propSearch}
                      setSearch={setPropSearch}
                      results={displayPropResults}
                      loading={propLoading}
                      renderResult={item => {
                        const p = item as Property;
                        return (
                          <div className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                {[p.project, p.unit && `Unit ${p.unit}`, p.type].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                    {/* Show all client units as quick pills if ≤ 5 */}
                    {selectedClient && !selectedProp && clientProps.length > 0 && clientProps.length <= 5 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {clientProps.map(p => (
                          <button key={p.id} type="button" onClick={() => handleSelectProp(p)}
                            className="flex items-center gap-1 px-2 py-1 rounded-[6px] text-xs transition-all"
                            style={{ background: "var(--black-600)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--gold-500)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-500)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}>
                            <Building2 className="w-3 h-3" />
                            {p.unit ? `Unit ${p.unit}` : p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Agent assign — admin only */}
                  {isAdmin && (
                    <div>
                      <Label className="mb-1.5 block flex items-center gap-2">
                        Assign To
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>Admin</span>
                      </Label>
                      <Select value={form.assignedToId} onValueChange={v => set("assignedToId", v)}>
                        <SelectTrigger><SelectValue placeholder="Select agent…" /></SelectTrigger>
                        <SelectContent>
                          {agents.map(a => (
                            <SelectItem key={a.id} value={a.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                                {a.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button type="submit" className="w-full" loading={loading}>
                  <Save className="w-4 h-4" />{loading ? "Creating…" : "Create Ticket"}
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
