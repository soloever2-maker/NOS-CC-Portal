"use client";

import { useState, useEffect, useCallback } from "react";
import { Phone, Mail, MessageCircle, Users, MapPin, FileText, Plus, X, Search } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { INTERACTION_TYPE_LABELS, type InteractionType } from "@/types";

type InteractionWithRelations = {
  id: string; type: InteractionType; summary: string; details?: string | null;
  duration?: number | null; created_at: string;
  client: { id: string; name: string; phone: string } | null;
  user: { name: string } | { name: string }[] | null;
};

const TYPE_ICONS: Record<InteractionType, React.ElementType> = {
  CALL: Phone, EMAIL: Mail, WHATSAPP: MessageCircle,
  MEETING: Users, SITE_VISIT: MapPin, NOTE: FileText,
};
const TYPE_COLORS: Record<InteractionType, string> = {
  CALL: "var(--gold-500)", EMAIL: "var(--info)", WHATSAPP: "#22c55e",
  MEETING: "var(--warning)", SITE_VISIT: "var(--danger)", NOTE: "var(--text-muted)",
};

const TYPES: InteractionType[] = ["CALL","EMAIL","WHATSAPP","MEETING","SITE_VISIT","NOTE"];

interface NewForm {
  type: InteractionType; summary: string; details: string;
  duration: string; clientSearch: string; clientId: string; clientName: string;
}

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<InteractionWithRelations[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [clientResults, setClientResults] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<InteractionType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<NewForm>({
    type: "CALL", summary: "", details: "", duration: "", clientSearch: "", clientId: "", clientName: "",
  });

  const fetchInteractions = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("interactions")
      .select("*, client:clients(id, name, phone), user:users(name)")
      .order("created_at", { ascending: false })
      .limit(100);
    setInteractions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInteractions();
    const supabase = createClient();
    supabase.from("clients").select("id, name, phone").order("name").then(({ data }) => setClients(data ?? []));
  }, [fetchInteractions]);

  useEffect(() => {
    if (!form.clientSearch.trim()) { setClientResults([]); return; }
    const q = form.clientSearch.toLowerCase();
    setClientResults(clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5));
  }, [form.clientSearch, clients]);

  const handleSave = async () => {
    if (!form.summary.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("id").eq("supabase_id", user.id).single();
      if (!profile) return;
      await supabase.from("interactions").insert({
        id: crypto.randomUUID(),
        type: form.type,
        summary: form.summary,
        details: form.details || null,
        duration: form.duration ? parseInt(form.duration) : null,
        client_id: form.clientId || null,
        user_id: profile.id,
      });
      setForm({ type: "CALL", summary: "", details: "", duration: "", clientSearch: "", clientId: "", clientName: "" });
      setShowForm(false);
      fetchInteractions();
    } finally { setSaving(false); }
  };

  const filtered = interactions.filter(i => {
    const matchType = filter === "ALL" || i.type === filter;
    const matchSearch = !search || i.summary.toLowerCase().includes(search.toLowerCase()) || i.client?.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts = TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = interactions.filter(i => i.type === t).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Interactions"
        subtitle={`${interactions.length} total logged`}
        actions={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5" /> Log Interaction</Button>}
      />

      <div className="flex-1 p-5 space-y-4">

        {/* Stat mini cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {TYPES.map(t => {
            const Icon = TYPE_ICONS[t];
            return (
              <button key={t} onClick={() => setFilter(filter === t ? "ALL" : t)}
                className="flex items-center gap-2 p-3 rounded-[10px] transition-all text-left"
                style={{ background: filter === t ? "var(--gold-glow)" : "var(--black-800)", border: filter === t ? "1px solid var(--gold-500)" : "1px solid var(--border)" }}>
                <Icon className="w-4 h-4 shrink-0" style={{ color: TYPE_COLORS[t] }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{counts[t] ?? 0}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{INTERACTION_TYPE_LABELS[t].split(" ")[0]}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="max-w-xs">
          <Input placeholder="Search interactions…" startIcon={<Search className="w-3.5 h-3.5" />}
            value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs" />
        </div>

        {/* Log form */}
        {showForm && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Log New Interaction</p>
                <button onClick={() => setShowForm(false)} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
              </div>
              {/* Type */}
              <div className="flex gap-1.5 flex-wrap">
                {TYPES.map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className="px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all"
                    style={{ background: form.type === t ? "var(--gold-glow)" : "var(--black-700)", border: form.type === t ? "1px solid var(--gold-500)" : "1px solid var(--border)", color: form.type === t ? "var(--gold-500)" : "var(--text-muted)" }}>
                    {INTERACTION_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              {/* Client search */}
              <div className="relative">
                <Input placeholder="Search client (optional)…" value={form.clientSearch}
                  onChange={e => setForm(f => ({ ...f, clientSearch: e.target.value, clientId: "", clientName: "" }))}
                  className="h-8 text-xs" startIcon={<Search className="w-3.5 h-3.5" />} />
                {clientResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full rounded-[8px] overflow-hidden shadow-lg" style={{ background: "var(--black-700)", border: "1px solid var(--border)" }}>
                    {clientResults.map(c => (
                      <button key={c.id} onClick={() => setForm(f => ({ ...f, clientId: c.id, clientName: c.name, clientSearch: c.name }))}
                        className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[var(--gold-glow)]">
                        <span style={{ color: "var(--text-primary)" }}>{c.name}</span>
                        <span className="ml-2" style={{ color: "var(--text-muted)" }}>{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.clientId && <p className="text-[11px] mt-1" style={{ color: "var(--success)" }}>✓ {form.clientName} selected</p>}
              </div>
              {/* Summary */}
              <Input placeholder="Summary *" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} className="h-8 text-xs" />
              {/* Details */}
              <textarea placeholder="Details (optional)…" value={form.details}
                onChange={e => setForm(f => ({ ...f, details: e.target.value }))} rows={2}
                className="crm-input w-full text-xs resize-none" />
              {/* Duration */}
              {["CALL","MEETING","SITE_VISIT"].includes(form.type) && (
                <Input placeholder="Duration (minutes)" type="number" value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="h-8 text-xs w-40" />
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} loading={saving} disabled={!form.summary.trim()}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--black-800)" }}>
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No interactions logged yet</p>
              <p className="text-xs mt-1">Log your first interaction using the button above</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map(i => {
                const Icon = TYPE_ICONS[i.type];
                return (
                  <div key={i.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--gold-glow)]">
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--black-700)" }}>
                      <Icon className="w-4 h-4" style={{ color: TYPE_COLORS[i.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--black-700)", color: TYPE_COLORS[i.type], border: `1px solid ${TYPE_COLORS[i.type]}33` }}>
                          {INTERACTION_TYPE_LABELS[i.type]}
                        </span>
                        {i.client && <span className="text-xs font-medium" style={{ color: "var(--gold-400)" }}>{i.client.name}</span>}
                        {i.duration && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{i.duration} min</span>}
                      </div>
                      <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>{i.summary}</p>
                      {i.details && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{i.details}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(i.created_at)}</p>
                      {i.user && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>by {(Array.isArray(i.user) ? i.user[0] : i.user)?.name}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
