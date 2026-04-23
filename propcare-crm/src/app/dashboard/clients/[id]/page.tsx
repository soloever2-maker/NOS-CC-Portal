"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Ticket, Plus, AlertCircle,
  MessageCircle, Building2, Clock, Download, Upload, X,
  FileText, Image as ImgIcon, Search, ChevronRight, Star,
  Users, Hash,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { createClient as supabase } from "@/lib/supabase/client";
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS,
  INTERACTION_TYPE_LABELS,
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
interface PropertyLink {
  link_id: string; relation: string;
  id: string; name: string; unit?: string | null;
  project?: string | null; type: string;
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

// ─── Attachments per property ──────────────────────
function PropertyCard({
  prop, clientId, onUnlink,
}: {
  prop: PropertyLink;
  clientId: string;
  onUnlink: (linkId: string) => void;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading,   setUploading]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rel = RELATION_STYLE[prop.relation] ?? { bg: 'rgba(100,100,100,0.1)', color: 'var(--text-muted)' };

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

  const handleDelete = async (path: string) => {
    await supabase().storage.from("client-attachments").remove([path]);
    await loadFiles();
  };

  const isImage = (n: string) => /\.(jpg|jpeg|png|webp)$/i.test(n);

  return (
    <div className="p-3 rounded-[12px] space-y-2.5" style={{ background: "var(--black-700)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
          <div className="min-w-0">
            <Link href={`/dashboard/properties/${prop.id}`} className="text-sm font-semibold hover:underline truncate block" style={{ color: "var(--text-primary)" }}>
              {prop.name}
            </Link>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {[prop.project, prop.unit && `Unit ${prop.unit}`, prop.type].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold"
            style={{ background: rel.bg, color: rel.color, border: `1px solid ${rel.color}44` }}>
            {prop.relation}
          </span>
          <button onClick={() => onUnlink(prop.link_id)}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-500/10 transition-all"
            style={{ color: "var(--text-muted)" }} title="Unlink">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

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
                <button onClick={() => handleDelete(a.path)} className="opacity-0 group-hover:opacity-100 hover:text-red-400" style={{ color: "var(--text-muted)" }}>
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

// ─── Link Unit Panel ───────────────────────────────
function LinkUnitPanel({
  clientId, onLinked, onClose,
}: { clientId: string; onLinked: () => void; onClose: () => void; }) {
  const [search,   setSearch]   = useState("");
  const [results,  setResults]  = useState<PropResult[]>([]);
  const [selected, setSelected] = useState<PropResult | null>(null);
  const [relation, setRelation] = useState("owner");
  const [saving,   setSaving]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const sb = supabase();
    sb.from("properties").select("id, name, unit, project, type")
      .or(`name.ilike.%${search}%,unit.ilike.%${search}%,project.ilike.%${search}%,code.ilike.%${search}%`)
      .limit(6)
      .then(({ data }) => setResults(data ?? []));
  }, [search]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setResults([]); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase().from("client_properties").upsert({
      id: crypto.randomUUID(), client_id: clientId,
      property_id: selected.id, relation,
    }, { onConflict: "client_id,property_id" });
    setSaving(false);
    if (error) { alert("Failed to link unit: " + error.message); return; }
    await onLinked();
  };

  return (
    <div className="p-4 rounded-[12px] space-y-3" style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Link a Unit</p>
        <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
      </div>

      {/* Unit search */}
      <div ref={ref} className="relative">
        {selected ? (
          <div className="flex items-center justify-between p-2.5 rounded-[8px]"
            style={{ background: "var(--black-600)", border: "1px solid var(--border-strong)" }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selected.name}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{[selected.project, selected.unit && `Unit ${selected.unit}`].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ color: "var(--text-muted)" }}><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <>
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
            <input className="crm-input w-full text-sm h-9 pl-8" placeholder="Search by unit name, number, or project…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {results.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full rounded-[10px] overflow-hidden shadow-xl max-h-52 overflow-y-auto"
                style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
                {results.map(p => (
                  <button key={p.id} onClick={() => { setSelected(p); setSearch(""); setResults([]); }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-[var(--gold-glow)] border-b last:border-b-0"
                    style={{ borderColor: "var(--border)" }}>
                    <Building2 className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{[p.project, p.unit && `Unit ${p.unit}`, p.type].filter(Boolean).join(" · ")}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Relation */}
      <div className="flex gap-2">
        {RELATIONS.map(r => {
          const s = RELATION_STYLE[r] ?? { bg: "rgba(100,100,100,0.1)", color: "var(--text-muted)" };
          return (
            <button key={r} onClick={() => setRelation(r)}
              className="flex-1 py-1.5 rounded-[8px] text-xs font-semibold capitalize transition-all"
              style={{ background: relation === r ? s.bg : "var(--black-600)", border: relation === r ? `1px solid ${s.color}` : "1px solid var(--border)", color: relation === r ? s.color : "var(--text-muted)" }}>
              {r}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={handleSave} loading={saving} disabled={!selected || saving}>
          {saving ? "Linking…" : "Link Unit"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────
export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client,       setClient]       = useState<Client | null>(null);
  const [properties,   setProperties]   = useState<PropertyLink[]>([]);
  const [tickets,      setTickets]      = useState<TicketItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showLink,     setShowLink]     = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [showAllTkts,  setShowAllTkts]  = useState(false);

  const loadProperties = async () => {
    const { data } = await supabase().from("client_properties")
      .select("id, relation, property:properties(id, name, unit, project, type)")
      .eq("client_id", params.id);
    setProperties((data ?? []).map((cp: Record<string, unknown>) => {
      const p = (Array.isArray(cp.property) ? cp.property[0] : cp.property) as Record<string, unknown>;
      return { link_id: cp.id as string, relation: cp.relation as string, id: p?.id as string, name: p?.name as string, unit: p?.unit as string | null, project: p?.project as string | null, type: p?.type as string };
    }).filter(p => p.id));
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

  const handleUnlink = async (linkId: string) => {
    await supabase().from("client_properties").delete().eq("id", linkId);
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
      ["Units", properties.map(p => `${p.name}${p.unit ? ` Unit ${p.unit}` : ""} (${p.relation})`).join(" | ")],
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

                {/* All contact info */}
                <div className="space-y-2 text-sm">
                  {/* Primary phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                    <span style={{ color: "var(--text-secondary)" }}>{client.phone}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>Primary</span>
                  </div>
                  {/* Secondary phone */}
                  {client.phone2 && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>{client.phone2}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "var(--black-600)", color: "var(--text-muted)" }}>Secondary</span>
                    </div>
                  )}
                  {/* Referral */}
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
                    UNITS & ATTACHMENTS ({properties.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowLink(v => !v)}>
                    <Plus className="w-3.5 h-3.5" /> Link Unit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {showLink && (
                  <LinkUnitPanel
                    clientId={client.id}
                    onLinked={async () => { await loadProperties(); setShowLink(false); }}
                    onClose={() => setShowLink(false)}
                  />
                )}
                {properties.length === 0 && !showLink ? (
                  <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No units linked yet</p>
                    <button onClick={() => setShowLink(true)} className="text-xs mt-1" style={{ color: "var(--gold-500)" }}>Link a unit →</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {properties.map(p => (
                      <PropertyCard key={p.link_id} prop={p} clientId={client.id} onUnlink={handleUnlink} />
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
