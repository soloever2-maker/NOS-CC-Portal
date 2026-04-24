"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Ticket, Plus, AlertCircle,
  MessageCircle, Building2, Clock, Download, Upload, X,
  FileText, Image as ImgIcon, ChevronRight, Star,
  Users, Hash, Pencil,
} from "lucide-react";
import { NOS_PROJECTS } from "@/lib/constants";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { createClient as supabase } from "@/lib/supabase/client";
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS,
  INTERACTION_TYPE_LABELS, PROPERTY_TYPE_LABELS,
  type TicketStatus, type TicketPriority, type InteractionType,
} from "@/types";

// ─── Types ───────────────────────────────────────────
interface Client {
  id: string; code: string; name: string; email?: string;
  phone: string; phone2?: string | null; whatsapp?: string | null;
  referral_number?: string | null; nationality?: string; id_number?: string;
  address?: string; city?: string; notes?: string;
  tags: string[]; created_at: string;
}
interface Unit {
  id: string; client_id: string; unit_number: string;
  project?: string | null; type: string; relation: string;
  floor?: number | null; bedrooms?: number | null; area?: number | null;
}
interface TicketItem {
  id: string; code: string; title: string;
  status: TicketStatus; priority: TicketPriority;
  created_at: string; due_date?: string | null;
}
interface InteractionItem {
  id: string; type: InteractionType; summary: string;
  details?: string | null; duration?: number | null;
  created_at: string;
  user: { name: string } | { name: string }[] | null;
}
interface PropResult { id: string; name: string; unit?: string | null; project?: string | null; type: string; }
interface Attachment  { name: string; url: string; path: string; }

// ─── Constants ───────────────────────────────────────
const STATUS_BADGE: Record<TicketStatus, BadgeProps["variant"]> = {
  OPEN: "open", IN_PROGRESS: "in-progress", PENDING_CLIENT: "in-progress",
  RESOLVED: "resolved", CLOSED: "closed",
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};
const INTERACTION_COLORS: Record<InteractionType, string> = {
  CALL: "var(--gold-500)", EMAIL: "var(--info)", WHATSAPP: "#22c55e",
  MEETING: "var(--warning)", SITE_VISIT: "var(--danger)", NOTE: "var(--text-muted)",
};
const RELATION_STYLE: Record<string, { bg: string; color: string }> = {
  owner:    { bg: "rgba(201,168,76,0.1)",  color: "var(--gold-500)" },
  tenant:   { bg: "rgba(59,130,246,0.1)",  color: "var(--info)" },
  prospect: { bg: "rgba(100,100,100,0.1)", color: "var(--text-muted)" },
};
const RELATIONS = ["owner", "tenant", "prospect"];

function getUserName(u: InteractionItem["user"]): string {
  if (!u) return "—";
  return Array.isArray(u) ? (u[0]?.name ?? "—") : u.name;
}

// ─── Property Card with Edit + New Ticket ──────────
function PropertyCard({
  prop, clientId, onUnlink, onRefresh,
}: {
  prop: Unit;
  clientId: string;
  onUnlink: (linkId: string) => void;
  onRefresh: () => void;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading,   setUploading]   = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editForm,    setEditForm]    = useState({
    unit: prop.unit_number ?? "", project: prop.project ?? "",
    type: prop.type ?? "APARTMENT", floor: prop.floor ? String(prop.floor) : "",
    bedrooms: prop.bedrooms ? String(prop.bedrooms) : "",
    area: prop.area ? String(prop.area) : "", relation: prop.relation,
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rel = RELATION_STYLE[prop.relation] ?? { bg: "rgba(100,100,100,0.1)", color: "var(--text-muted)" };

  useEffect(() => { loadFiles(); }, []); // eslint-disable-line

  const loadFiles = async () => {
    const sb = supabase();
    const prefix = `${clientId}/${prop.id}/`;
    const { data } = await sb.storage.from("client-attachments").list(prefix);
    if (!data) return;
    setAttachments(data.map(f => {
      const path = `${prefix}${f.name}`;
      const { data: { publicUrl } } = sb.storage.from("client-attachments").getPublicUrl(path);
      return { name: f.name, url: publicUrl, path };
    }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const sb = supabase();
    const ext = file.name.split(".").pop();
    const path = `${clientId}/${prop.id}/${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("client-attachments").upload(path, file);
    if (!error) await loadFiles();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeleteFile = async (path: string) => {
    await supabase().storage.from("client-attachments").remove([path]);
    await loadFiles();
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await supabase().from("client_units").update({
      unit_number: editForm.unit || prop.unit_number,
      project: editForm.project || null,
      type: editForm.type,
      floor: editForm.floor ? parseInt(editForm.floor) : null,
      bedrooms: editForm.bedrooms ? parseInt(editForm.bedrooms) : null,
      area: editForm.area ? parseFloat(editForm.area) : null,
      relation: editForm.relation,
    }).eq("id", prop.id);
    setSaving(false);
    setEditing(false);
    onRefresh();
  };

  const isImage = (n: string) => /\.(jpg|jpeg|png|webp)$/i.test(n);

  return (
    <div className="p-3 rounded-[12px] space-y-2.5" style={{ background: "var(--black-700)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {prop.unit_number ? `Unit ${prop.unit_number}` : "—"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {[prop.project, prop.type, prop.floor && `Floor ${prop.floor}`, prop.bedrooms && `${prop.bedrooms}BR`, prop.area && `${prop.area}m²`].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold"
            style={{ background: rel.bg, color: rel.color, border: `1px solid ${rel.color}44` }}>
            {prop.relation}
          </span>
          <Link href={`/dashboard/tickets/new?clientId=${clientId}&unitId=${prop.id}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-semibold transition-all"
            style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
            + Ticket
          </Link>
          <button onClick={() => setEditing(v => !v)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--gold-glow)] transition-all"
            style={{ color: "var(--text-muted)" }} title="Edit">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => onUnlink(prop.id)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-all"
            style={{ color: "var(--text-muted)" }} title="Remove">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Inline Edit Form */}
      {editing && (
        <div className="p-3 rounded-[10px] space-y-2.5" style={{ background: "var(--black-600)", border: "1px solid var(--border-strong)" }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Unit Number</p>
              <input className="crm-input w-full h-7 text-xs" value={editForm.unit} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))} placeholder="2401" />
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Project</p>
              <select className="crm-input w-full h-7 text-xs" value={editForm.project} onChange={e => setEditForm(p => ({ ...p, project: e.target.value }))}>
                <option value="">— None —</option>
                {NOS_PROJECTS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Floor</p>
              <input className="crm-input w-full h-7 text-xs" type="number" value={editForm.floor} onChange={e => setEditForm(p => ({ ...p, floor: e.target.value }))} placeholder="24" />
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Bedrooms</p>
              <input className="crm-input w-full h-7 text-xs" type="number" value={editForm.bedrooms} onChange={e => setEditForm(p => ({ ...p, bedrooms: e.target.value }))} placeholder="3" />
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Area (m²)</p>
              <input className="crm-input w-full h-7 text-xs" type="number" value={editForm.area} onChange={e => setEditForm(p => ({ ...p, area: e.target.value }))} placeholder="180" />
            </div>
          </div>
          <div className="flex gap-1.5">
            {RELATIONS.map(r => {
              const s = RELATION_STYLE[r] ?? { bg: "rgba(100,100,100,0.1)", color: "var(--text-muted)" };
              return (
                <button key={r} type="button" onClick={() => setEditForm(p => ({ ...p, relation: r }))}
                  className="flex-1 py-1 rounded-[6px] text-[10px] font-semibold capitalize transition-all"
                  style={{ background: editForm.relation === r ? s.bg : "var(--black-700)", border: editForm.relation === r ? `1px solid ${s.color}` : "1px solid var(--border)", color: editForm.relation === r ? s.color : "var(--text-muted)" }}>
                  {r}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} disabled={saving}
              className="flex-1 py-1 rounded-[6px] text-[10px] font-semibold transition-all"
              style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              className="flex-1 py-1 rounded-[6px] text-[10px] font-semibold"
              style={{ background: "var(--black-700)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Attachments */}
      <div>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {attachments.map(a => (
              <div key={a.path} className="group flex items-center gap-1 px-2 py-1 rounded-[6px]"
                style={{ background: "var(--black-600)", border: "1px solid var(--border)" }}>
                {isImage(a.name)
                  ? <ImgIcon className="w-3 h-3 shrink-0" style={{ color: "var(--info)" }} />
                  : <FileText className="w-3 h-3 shrink-0" style={{ color: "var(--warning)" }} />}
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] hover:underline max-w-[100px] truncate" style={{ color: "var(--text-secondary)" }}>
                  {a.name.replace(/^\d+\./, "file.")}
                </a>
                <a href={a.url} download className="opacity-0 group-hover:opacity-100" style={{ color: "var(--text-muted)" }}>
                  <Download className="w-2.5 h-2.5" />
                </a>
                <button onClick={() => handleDeleteFile(a.path)} className="opacity-0 group-hover:opacity-100 hover:text-red-400" style={{ color: "var(--text-muted)" }}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[11px] transition-all"
          style={{ background: "var(--black-600)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
          <Upload className="w-3 h-3" />{uploading ? "Uploading…" : "Add file"}
        </button>
      </div>
    </div>
  );
}

// ─── Add Unit Panel ─────────────────────────────────
function AddUnitPanel({ clientId, onSaved, onClose }: { clientId: string; onSaved: () => void; onClose: () => void; }) {
  const [form, setForm] = useState({
    unit: "", project: "", type: "APARTMENT", floor: "", bedrooms: "", area: "", relation: "owner",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.unit.trim()) { setError("Unit number is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const { error: insertErr } = await supabase().from("client_units").insert({
        id: crypto.randomUUID(),
        client_id: clientId,
        unit_number: form.unit.trim(),
        project: form.project || null,
        type: form.type,
        floor: form.floor ? parseInt(form.floor) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        area: form.area ? parseFloat(form.area) : null,
        relation: form.relation,
      });
      if (insertErr) throw insertErr;
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add unit");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 rounded-[12px] space-y-3" style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Unit</p>
        <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
      </div>
      {error && <p className="text-xs px-2 py-1.5 rounded-[6px]" style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Unit Number *</p>
          <input className="crm-input w-full h-8 text-sm" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="2401" />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Project</p>
          <select className="crm-input w-full h-8 text-sm" value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))}>
            <option value="">— None —</option>
            {NOS_PROJECTS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Type</p>
          <select className="crm-input w-full h-8 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Floor</p>
          <input className="crm-input w-full h-8 text-sm" type="number" value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))} placeholder="24" />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Bedrooms</p>
          <input className="crm-input w-full h-8 text-sm" type="number" value={form.bedrooms} onChange={e => setForm(p => ({ ...p, bedrooms: e.target.value }))} placeholder="3" />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Area (m²)</p>
          <input className="crm-input w-full h-8 text-sm" type="number" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} placeholder="180" />
        </div>
      </div>
      <div className="flex gap-2">
        {RELATIONS.map(r => {
          const s = RELATION_STYLE[r] ?? { bg: "rgba(100,100,100,0.1)", color: "var(--text-muted)" };
          return (
            <button key={r} type="button" onClick={() => setForm(p => ({ ...p, relation: r }))}
              className="flex-1 py-1.5 rounded-[8px] text-xs font-semibold capitalize transition-all"
              style={{ background: form.relation === r ? s.bg : "var(--black-600)", border: form.relation === r ? `1px solid ${s.color}` : "1px solid var(--border)", color: form.relation === r ? s.color : "var(--text-muted)" }}>
              {r}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={handleSave} loading={saving} disabled={saving}>
          {saving ? "Adding…" : "Add Unit"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}


// ─── Main Page ─────────────────────────────────────
export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client,       setClient]       = useState<Client | null>(null);
  const [properties,   setProperties]   = useState<Unit[]>([]);
  const [tickets,      setTickets]      = useState<TicketItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showLink,     setShowLink]     = useState(false);
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  const [editForm,     setEditForm]     = useState<Partial<Client>>({});
  const [editSaving,   setEditSaving]   = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [showAllTkts,  setShowAllTkts]  = useState(false);

  useEffect(() => {
    supabase().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase().from("users").select("role").eq("supabase_id", user.id).single();
      if (data && ["ADMIN","SUPER_ADMIN"].includes(data.role)) setIsAdmin(true);
    });
  }, []);

  const handleSaveClient = async () => {
    if (!client) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setClient(prev => prev ? { ...prev, ...editForm } : prev);
        setEditMode(false);
      }
    } finally { setEditSaving(false); }
  };

  const loadProperties = async () => {
    const { data } = await supabase().from("client_units")
      .select("id, client_id, unit_number, project, type, relation, floor, bedrooms, area")
      .eq("client_id", params.id)
      .order("created_at", { ascending: true });
    setProperties((data ?? []) as Unit[]);
  };

  useEffect(() => {
    const sb = supabase();
    Promise.all([
      sb.from("clients").select("*").eq("id", params.id).single(),
      sb.from("tickets").select("id, code, title, status, priority, created_at, due_date").eq("client_id", params.id).order("created_at", { ascending: false }),
      sb.from("interactions").select("id, type, summary, details, duration, created_at, user:users(name)").eq("client_id", params.id).order("created_at", { ascending: false }),
    ]).then(([cRes, tRes, iRes]) => {
      if (cRes.data) setClient(cRes.data);
      setTickets(tRes.data ?? []);
      setInteractions(iRes.data ?? []);
      setLoading(false);
    });
    loadProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleUnlink = async (unitId: string) => {
    await supabase().from("client_units").delete().eq("id", unitId);
    await loadProperties();
  };

  const handleDownload = () => {
    if (!client) return;
    setDownloading(true);
    const rows = [
      ["Field","Value"],
      ["Code", client.code], ["Name", client.name],
      ["Phone", client.phone], ["Phone 2", client.phone2 ?? ""],
      ["WhatsApp", client.whatsapp ?? ""], ["Referral", client.referral_number ?? ""],
      ["Email", client.email ?? ""], ["Nationality", client.nationality ?? ""],
      ["ID Number", client.id_number ?? ""], ["City", client.city ?? ""],
      ["Address", client.address ?? ""], ["Tags", client.tags.join(", ")],
      ["Notes", client.notes ?? ""],
      ["Units", properties.map(p => `Unit ${p.unit_number}${p.project ? ` (${p.project})` : ""} — ${p.relation}`).join(" | ")],
      ["Total Tickets", String(tickets.length)],
      ["Open Tickets", String(tickets.filter(t => ["OPEN","IN_PROGRESS","PENDING_CLIENT"].includes(t.status)).length)],
      ["Member Since", formatDate(client.created_at)],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `client-${client.code}.csv`; a.click();
    setDownloading(false);
  };

  if (loading) return (
    <div className="flex flex-col min-h-screen"><Topbar title="Loading…" />
      <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
    </div>
  );
  if (!client) return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Not found" actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>} />
      <div className="flex-1 flex items-center justify-center"><AlertCircle className="w-10 h-10 opacity-30" style={{ color: "var(--text-muted)" }} /></div>
    </div>
  );

  const openTkts = tickets.filter(t => ["OPEN","IN_PROGRESS","PENDING_CLIENT"].includes(t.status));
  const shownTkts = showAllTkts ? tickets : tickets.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title={client.name} subtitle={`${client.code}${client.nationality ? ` · ${client.nationality}` : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>
            <Button variant="outline" size="sm" onClick={handleDownload} loading={downloading}><Download className="w-3.5 h-3.5" /> Export</Button>
            {isAdmin && !editMode && (
              <Button variant="outline" size="sm" onClick={() => { setEditForm({ ...client }); setEditMode(true); }}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
            <Button size="sm" asChild><Link href={`/dashboard/tickets/new?clientId=${client.id}`}><Plus className="w-3.5 h-3.5" /> New Ticket</Link></Button>
          </div>
        }
      />

      <div className="flex-1 p-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 max-w-7xl">

          {/* ══════════ LEFT: Profile ══════════ */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-5">
                {/* Avatar + name */}
                <div className="flex flex-col items-center text-center mb-4">
                  <Avatar className="h-14 w-14 mb-2">
                    <AvatarFallback className="text-lg font-bold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-base font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{client.name}</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{client.code}</p>
                  {client.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-center mt-1.5">
                      {client.tags.map(t => <Badge key={t} variant="gold">{t}</Badge>)}
                    </div>
                  )}
                </div>

                {/* Quick contact */}
                <div className="flex gap-2 mb-4">
                  <a href={`tel:${client.phone}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-medium flex-1 justify-center transition-all"
                    style={{ background: "var(--black-700)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`https://wa.me/${(client.whatsapp ?? client.phone).replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-medium flex-1 justify-center transition-all"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>

                {/* Contact info — view or edit */}
                {editMode ? (
                  <div className="space-y-2.5">
                    {[
                      { key: "name",             label: "Full Name",        type: "text"  },
                      { key: "phone",            label: "Primary Phone",    type: "tel"   },
                      { key: "phone2",           label: "Secondary Phone",  type: "tel"   },
                      { key: "whatsapp",         label: "WhatsApp",         type: "tel"   },
                      { key: "referral_number",  label: "Referral",         type: "text"  },
                      { key: "email",            label: "Email",            type: "email" },
                      { key: "nationality",      label: "Nationality",      type: "text"  },
                      { key: "id_number",        label: "ID Number",        type: "text"  },
                      { key: "city",             label: "City",             type: "text"  },
                      { key: "address",          label: "Address",          type: "text"  },
                    ].map(f => (
                      <div key={f.key}>
                        <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>{f.label}</p>
                        <input
                          type={f.type}
                          className="crm-input w-full h-8 text-xs"
                          value={(editForm as Record<string,string>)[f.key] ?? ""}
                          onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Notes</p>
                      <textarea
                        className="crm-input w-full text-xs p-2 resize-none"
                        rows={3}
                        value={editForm.notes ?? ""}
                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                      />
                    </div>
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Tags (comma separated)</p>
                      <input
                        className="crm-input w-full h-8 text-xs"
                        value={(editForm.tags ?? []).join(", ")}
                        onChange={e => setEditForm(p => ({ ...p, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSaveClient} disabled={editSaving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all"
                        style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
                        <Pencil className="w-3 h-3" />{editSaving ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => setEditMode(false)}
                        className="flex-1 py-1.5 rounded-[8px] text-xs font-semibold"
                        style={{ background: "var(--black-700)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>{client.phone}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>Primary</span>
                    </div>
                    {client.phone2 && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>{client.phone2}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "var(--black-600)", color: "var(--text-muted)" }}>Secondary</span>
                      </div>
                    )}
                    {client.referral_number && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>{client.referral_number}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(59,130,246,0.1)", color: "var(--info)" }}>Referral</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span className="truncate" style={{ color: "var(--text-secondary)" }}>{client.email}</span>
                      </div>
                    )}
                    {client.id_number && (
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>{client.id_number}</span>
                      </div>
                    )}
                    {(client.address || client.city) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>{[client.address, client.city].filter(Boolean).join(", ")}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Tickets", value: tickets.length, color: openTkts.length > 0 ? "var(--danger)" : "var(--text-primary)" },
                { label: "Units", value: properties.length, color: "var(--gold-500)" },
                { label: "History", value: interactions.length, color: "var(--text-primary)" },
              ].map(s => (
                <div key={s.label} className="crm-card p-3 text-center">
                  <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: s.color }}>{s.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {client.notes && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>NOTES</CardTitle></CardHeader>
                <CardContent><p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{client.notes}</p></CardContent>
              </Card>
            )}

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>Member since {formatDate(client.created_at)}</p>
          </div>

          {/* ══════════ RIGHT: Everything ══════════ */}
          <div className="xl:col-span-2 space-y-5">

            {/* ── UNITS & ATTACHMENTS ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                    <Building2 className="w-3.5 h-3.5" style={{ color: "var(--gold-500)" }} />
                    UNITS ({properties.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowLink(v => !v)}>
                    <Plus className="w-3.5 h-3.5" /> Add Unit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {showLink && (
                  <AddUnitPanel
                    clientId={client.id}
                    onSaved={async () => { await loadProperties(); setShowLink(false); }}
                    onClose={() => setShowLink(false)}
                  />
                )}
                {properties.length === 0 && !showLink ? (
                  <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No units yet</p>
                    <button onClick={() => setShowLink(true)} className="text-xs mt-1" style={{ color: "var(--gold-500)" }}>Add a unit →</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {properties.map(p => (
                      <PropertyCard key={p.id} prop={p} clientId={client.id} onUnlink={handleUnlink} onRefresh={loadProperties} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── OPEN TICKETS ALERT ── */}
            {openTkts.length > 0 && (
              <div className="p-4 rounded-[12px]" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--danger)" }}>
                    <AlertCircle className="w-4 h-4" /> {openTkts.length} Open Ticket{openTkts.length > 1 ? "s" : ""}
                  </p>
                  <Button size="sm" asChild><Link href={`/dashboard/tickets/new?clientId=${client.id}`}><Plus className="w-3.5 h-3.5" /> New</Link></Button>
                </div>
                <div className="space-y-1.5">
                  {openTkts.map(t => (
                    <Link key={t.id} href={`/dashboard/tickets/${t.id}`}
                      className="flex items-center justify-between p-2.5 rounded-[8px] transition-colors hover:bg-red-500/5"
                      style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t.code}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge variant={PRIORITY_BADGE[t.priority]}>{TICKET_PRIORITY_LABELS[t.priority]}</Badge>
                        <Badge variant={STATUS_BADGE[t.status]}>{TICKET_STATUS_LABELS[t.status]}</Badge>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--danger)" }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── ALL TICKETS ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                    <Ticket className="w-3.5 h-3.5" /> ALL TICKETS ({tickets.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/tickets/new?clientId=${client.id}`}><Plus className="w-3.5 h-3.5" /> New</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {tickets.length === 0 ? (
                  <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                    <Ticket className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tickets yet</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {shownTkts.map(t => {
                        const overdue = t.due_date && new Date(t.due_date) < new Date() && !["RESOLVED","CLOSED"].includes(t.status);
                        return (
                          <Link key={t.id} href={`/dashboard/tickets/${t.id}`}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--gold-glow)]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>{t.code}</span>
                                {overdue && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>OVERDUE</span>}
                              </div>
                              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                              <div className="flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                                <Clock className="w-3 h-3" /><span className="text-[11px]">{formatRelativeTime(t.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Badge variant={PRIORITY_BADGE[t.priority]}>{TICKET_PRIORITY_LABELS[t.priority]}</Badge>
                              <Badge variant={STATUS_BADGE[t.status]}>{TICKET_STATUS_LABELS[t.status]}</Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    {tickets.length > 4 && (
                      <button onClick={() => setShowAllTkts(v => !v)}
                        className="w-full py-2.5 text-xs font-medium transition-colors hover:bg-[var(--gold-glow)]"
                        style={{ color: "var(--gold-500)", borderTop: "1px solid var(--border)" }}>
                        {showAllTkts ? "Show less" : `Show all ${tickets.length} tickets`}
                      </button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── INTERACTIONS ── */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
                    <MessageCircle className="w-3.5 h-3.5" /> INTERACTION HISTORY ({interactions.length})
                  </CardTitle>
                  <Button size="sm" variant="ghost" asChild><Link href="/dashboard/calls">Log →</Link></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {interactions.length === 0 ? (
                  <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                    <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No interactions logged</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {interactions.slice(0,5).map(i => (
                      <div key={i.id} className="flex items-start gap-3 px-5 py-3">
                        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                          style={{ background: "var(--black-700)", color: INTERACTION_COLORS[i.type] }}>
                          {i.type[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: INTERACTION_COLORS[i.type] }}>{INTERACTION_TYPE_LABELS[i.type]}</span>
                            {i.duration && <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{i.duration}m</span>}
                          </div>
                          <p className="text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>{i.summary}</p>
                          {i.details && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>{i.details}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(i.created_at)}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>by {getUserName(i.user)}</p>
                        </div>
                      </div>
                    ))}
                    {interactions.length > 5 && (
                      <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
                        +{interactions.length - 5} more interactions
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
