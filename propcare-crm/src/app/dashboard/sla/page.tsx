"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Save, Plus, Trash2, Clock } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-elements";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { TICKET_CATEGORY_LABELS } from "@/types";

const SOURCES = [
  { value: "all", label: "All Sources (Default)" },
  { value: "walk_in", label: "Walk-in Client" },
  { value: "call_center", label: "Call Center" },
  { value: "email", label: "Email" },
];

interface SLASetting {
  id: string;
  ticket_type: string;
  source: string | null;
  hours: number;
  is_active: boolean;
}

export default function SLASettingsPage() {
  const [settings, setSettings] = useState<SLASetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newSLA, setNewSLA] = useState({ ticket_type: "MAINTENANCE", source: "all", hours: 24 });

  useEffect(() => {
    const supabase = createClient();
    supabase.from("sla_settings").select("*").order("ticket_type")
      .then(({ data }) => { setSettings(data ?? []); setLoading(false); });
  }, []);

  const updateHours = async (id: string, hours: number) => {
    setSaving(id);
    const supabase = createClient();
    await supabase.from("sla_settings").update({ hours, updated_at: new Date().toISOString() }).eq("id", id);
    setSettings(prev => prev.map(s => s.id === id ? { ...s, hours } : s));
    setSaving(null);
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    const supabase = createClient();
    await supabase.from("sla_settings").update({ is_active }).eq("id", id);
    setSettings(prev => prev.map(s => s.id === id ? { ...s, is_active } : s));
  };

  const deleteSLA = async (id: string) => {
    const supabase = createClient();
    await supabase.from("sla_settings").delete().eq("id", id);
    setSettings(prev => prev.filter(s => s.id !== id));
  };

  const addSLA = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("sla_settings").insert({
      ticket_type: newSLA.ticket_type,
      source: newSLA.source === "all" ? null : newSLA.source || null,
      hours: newSLA.hours,
      is_active: true,
    }).select().single();
    if (data) { setSettings(prev => [...prev, data]); setNewSLA({ ticket_type: "MAINTENANCE", source: "", hours: 24 }); }
  };

  const getSLAColor = (hours: number) => {
    if (hours <= 4) return "var(--danger)";
    if (hours <= 24) return "var(--warning)";
    return "var(--success)";
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="SLA Settings" subtitle="Configure service level agreement timeframes" />
      <div className="flex-1 p-6 space-y-6 max-w-4xl">

        {/* Info */}
        <div className="p-4 rounded-[10px]" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid var(--border-strong)" }}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--gold-500)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>SLA Configuration</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Set the maximum hours allowed to resolve each type of ticket. Source-specific rules override the default. Tickets exceeding SLA will be flagged as overdue.
              </p>
            </div>
          </div>
        </div>

        {/* Existing SLAs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>CURRENT SLA RULES</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr><th>Category</th><th>Source</th><th>SLA (Hours)</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {settings.map(s => (
                    <tr key={s.id}>
                      <td>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {TICKET_CATEGORY_LABELS[s.ticket_type as keyof typeof TICKET_CATEGORY_LABELS] ?? s.ticket_type}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {s.source ? SOURCES.find(src => src.value === s.source)?.label : "All Sources"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" style={{ color: getSLAColor(s.hours) }} />
                          <Input
                            type="number"
                            value={s.hours}
                            onChange={e => updateHours(s.id, parseInt(e.target.value))}
                            className="w-20 h-7 text-xs"
                            min={1}
                          />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>hrs</span>
                          {saving === s.id && <div className="w-3 h-3 border border-t-[var(--gold-500)] rounded-full animate-spin" />}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleActive(s.id, !s.is_active)}
                          className="text-xs font-semibold px-2 py-1 rounded-full transition-all"
                          style={{
                            background: s.is_active ? "rgba(34,197,94,0.1)" : "rgba(96,96,96,0.1)",
                            color: s.is_active ? "var(--success)" : "var(--text-muted)",
                            border: `1px solid ${s.is_active ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                          }}
                        >
                          {s.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => deleteSLA(s.id)} className="w-7 h-7 flex items-center justify-center rounded-[6px] transition-all hover:bg-red-500/10" style={{ color: "var(--text-muted)" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Add New SLA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>ADD NEW SLA RULE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <Label className="mb-1.5 block">Category</Label>
                <Select value={newSLA.ticket_type} onValueChange={v => setNewSLA(p => ({ ...p, ticket_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TICKET_CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Source (Optional)</Label>
                <Select value={newSLA.source} onValueChange={v => setNewSLA(p => ({ ...p, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Hours</Label>
                <Input type="number" value={newSLA.hours} onChange={e => setNewSLA(p => ({ ...p, hours: parseInt(e.target.value) }))} min={1} />
              </div>
            </div>
            <Button className="mt-4" onClick={addSLA}>
              <Plus className="w-4 h-4" /> Add SLA Rule
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
