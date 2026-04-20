"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Edit, Plus, Save, X } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea, Label } from "@/components/ui/form-elements";
import { formatDate, getInitials } from "@/lib/utils";

interface Client {
  id: string; code: string; name: string; email?: string; phone: string;
  whatsapp?: string; nationality?: string; id_number?: string;
  address?: string; city?: string; notes?: string; tags: string[];
  created_at: string;
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", whatsapp: "",
    nationality: "", idNumber: "", address: "", city: "", notes: "", tags: "",
  });

  useEffect(() => {
    async function fetchClient() {
      setLoading(true);
      try {
        const res = await fetch(`/api/clients/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setClient(json.data);
        setForm({
          name: json.data.name ?? "",
          email: json.data.email ?? "",
          phone: json.data.phone ?? "",
          whatsapp: json.data.whatsapp ?? "",
          nationality: json.data.nationality ?? "",
          idNumber: json.data.id_number ?? "",
          address: json.data.address ?? "",
          city: json.data.city ?? "",
          notes: json.data.notes ?? "",
          tags: (json.data.tags ?? []).join(", "),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load client");
      } finally {
        setLoading(false);
      }
    }
    fetchClient();
  }, [id]);

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setClient(json.data);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!client) return;
    setForm({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      whatsapp: client.whatsapp ?? "",
      nationality: client.nationality ?? "",
      idNumber: client.id_number ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      notes: client.notes ?? "",
      tags: (client.tags ?? []).join(", "),
    });
    setEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen animate-fade-in">
        <Topbar title="Client" subtitle="Loading…" actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
          </Button>
        } />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col min-h-screen animate-fade-in">
        <Topbar title="Client Not Found" subtitle="" actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
          </Button>
        } />
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
          {error ?? "Client not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title={editing ? "Edit Client" : client.name}
        subtitle={editing ? `Editing ${client.code}` : `${client.code}${client.nationality ? ` · ${client.nationality}` : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
            </Button>
            {editing ? (
              <>
                <Button variant="secondary" size="sm" onClick={handleCancel} disabled={saving}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} loading={saving}>
                  <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Edit className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 p-6">
        {error && (
          <div className="mb-4 p-3 rounded-[8px] text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {editing ? (
          <div className="max-w-2xl space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>CLIENT INFORMATION</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="mb-1.5 block">Full Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} required /></div>
                  <div><Label className="mb-1.5 block">Nationality</Label><Input value={form.nationality} onChange={e => set("nationality", e.target.value)} /></div>
                  <div><Label className="mb-1.5 block">Phone *</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} required /></div>
                  <div><Label className="mb-1.5 block">WhatsApp</Label><Input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} /></div>
                  <div><Label className="mb-1.5 block">Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
                  <div><Label className="mb-1.5 block">ID Number</Label><Input value={form.idNumber} onChange={e => set("idNumber", e.target.value)} /></div>
                  <div><Label className="mb-1.5 block">City</Label><Input value={form.city} onChange={e => set("city", e.target.value)} /></div>
                  <div><Label className="mb-1.5 block">Address</Label><Input value={form.address} onChange={e => set("address", e.target.value)} /></div>
                </div>
                <div><Label className="mb-1.5 block">Tags</Label><Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="vip, owner, tenant, investor" /></div>
                <div><Label className="mb-1.5 block">Notes</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} /></div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center mb-4">
                    <Avatar className="h-16 w-16 mb-3">
                      <AvatarFallback className="text-xl">{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <h2 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{client.name}</h2>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{client.code}</p>
                    <div className="flex gap-1 mt-2 flex-wrap justify-center">
                      {(client.tags ?? []).map(tag => <Badge key={tag} variant={tag === "vip" ? "gold" : "medium"}>{tag}</Badge>)}
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                      {client.phone}
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                        <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        {client.email}
                      </div>
                    )}
                    {(client.address || client.city) && (
                      <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        {[client.address, client.city].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>DETAILS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    { label: "Nationality", value: client.nationality },
                    { label: "ID Number", value: client.id_number },
                    { label: "Client Since", value: formatDate(client.created_at) },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="flex justify-between">
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                    </div>
                  ) : null)}
                </CardContent>
              </Card>

              {client.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>NOTES</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{client.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="xl:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>PROPERTIES</CardTitle>
                    <Button variant="ghost" size="icon-sm"><Plus className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No properties linked yet.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKETS</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5" /> New Ticket</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tickets yet.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
