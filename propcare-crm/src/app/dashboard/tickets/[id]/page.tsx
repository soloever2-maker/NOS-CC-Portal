"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Building2, Tag, MessageSquare, Send, Lock, CheckCircle, RefreshCw, X, AlertCircle, Star, Phone, MessageCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-elements";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS, CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS, type TicketStatus, type TicketPriority, type ContactStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SLAIndicator } from "@/components/ui/sla-indicator";

const SOURCE_LABELS: Record<string, string> = {
  walk_in: "Walk-in", call_center: "Call Center", email: "Email",
};

const STATUS_BADGE: Record<TicketStatus, BadgeProps["variant"]> = {
  OPEN: "open", IN_PROGRESS: "in-progress", PENDING_CLIENT: "in-progress",
  RESOLVED: "resolved", CLOSED: "closed",
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};
const STATUS_ACTIONS = [
  { status: "IN_PROGRESS" as TicketStatus, label: "In Progress", icon: RefreshCw, color: "var(--warning)" },
  { status: "PENDING_CLIENT" as TicketStatus, label: "Pending Client", icon: Clock, color: "var(--info)" },
  { status: "RESOLVED" as TicketStatus, label: "Resolved", icon: CheckCircle, color: "var(--success)" },
  { status: "CLOSED" as TicketStatus, label: "Closed", icon: X, color: "var(--text-muted)" },
];
const CONTACT_STATUSES: ContactStatus[] = ["NOT_CONTACTED","NO_ANSWER","NOT_REACHABLE","REACHED","CALLBACK_REQUESTED"];

interface Ticket {
  id: string; code: string; title: string; description: string;
  status: TicketStatus; priority: TicketPriority; category: string;
  contact_status?: ContactStatus | null;
  project?: string; tags: string[]; due_date?: string;
  created_at: string; updated_at: string; resolved_at?: string | null;
  source?: string | null; sla_hours?: number | null;
  client: { id: string; name: string; phone: string; email?: string; whatsapp?: string | null } | null;
  property: { id: string; name: string; unit?: string; city?: string } | null;
  assigned_to: { id: string; name: string } | null;
  created_by: { id: string; name: string } | null;
}
interface Comment {
  id: string; content: string; is_internal: boolean; created_at: string;
  user: { name: string } | null;
}
interface SLASetting {
  id: string; ticket_type: string; source: string | null; hours: number; is_active: boolean;
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>("OPEN");
  const [contactStatus, setContactStatus] = useState<ContactStatus | null>(null);
  const [agents, setAgents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [assignedTo, setAssignedTo] = useState<{ id: string; name: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignKey, setAssignKey] = useState(0);
  const [slaHours, setSlaHours] = useState<number | null>(null);
  const [slaSaving, setSlaSaving] = useState(false);
  const [slaSettings, setSlaSettings] = useState<SLASetting[]>([]);
  const [csatScore, setCsatScore] = useState<number | null>(null);
  const [csatNotes, setCsatNotes] = useState("");
  const [csatSaving, setCsatSaving] = useState(false);
  const [csatSaved, setCsatSaved] = useState(false);
  const [existingCsat, setExistingCsat] = useState<{ score: number; notes?: string } | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.from("tickets").select(`*, client:clients(id, name, phone, email), property:properties(id, name, unit, city), assigned_to:users!tickets_assigned_to_id_fkey(id, name), created_by:users!tickets_created_by_id_fkey(id, name)`)
      .eq("id", params.id).single()
      .then(({ data }) => {
        if (data) {
          setTicket(data);
          setCurrentStatus(data.status);
          setAssignedTo(data.assigned_to ?? null);
          setSlaHours(data.sla_hours ?? null);
          setContactStatus(data.contact_status ?? null);
        }
        setLoading(false);
      });

    supabase.from("csat_scores").select("score, notes").eq("ticket_id", params.id)
      .eq("month", new Date().getMonth() + 1).eq("year", new Date().getFullYear()).maybeSingle()
      .then(({ data }) => { if (data) { setExistingCsat(data); setCsatScore(data.score); setCsatNotes(data.notes ?? ""); } });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("users").select("id, role").eq("supabase_id", user.id).single()
        .then(({ data: profile }) => {
          if (!profile) return;
          setMyUserId(profile.id);
          const admin = ["ADMIN","SUPER_ADMIN","MANAGER"].includes(profile.role);
          setIsAdmin(admin);
          if (admin) {
            supabase.from("users").select("id, name, email").eq("is_active", true)
              .then(({ data }) => setAgents(data ?? []));
            supabase.from("sla_settings").select("*").eq("is_active", true).order("ticket_type")
              .then(({ data }) => setSlaSettings(data ?? []));
          }
        });
    });

    supabase.from("ticket_comments").select(`*, user:users(name)`)
      .eq("ticket_id", params.id).order("created_at", { ascending: true })
      .then(({ data }) => setComments(data ?? []));
  }, [params.id]);

  const handleStatusChange = async (status: TicketStatus) => {
    const supabase = createClient();
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "RESOLVED") updates.resolved_at = new Date().toISOString();
    if (status === "CLOSED") updates.closed_at = new Date().toISOString();
    await supabase.from("tickets").update(updates).eq("id", params.id);
    setCurrentStatus(status);
  };

  const handleContactStatus = async (cs: ContactStatus) => {
    const supabase = createClient();
    await supabase.from("tickets").update({ contact_status: cs, updated_at: new Date().toISOString() }).eq("id", params.id);
    setContactStatus(cs);
  };

  const handleAssign = async (agentId: string) => {
    setAssigning(true);
    const supabase = createClient();
    const agent = agents.find(a => a.id === agentId) ?? null;
    await supabase.from("tickets").update({ assigned_to_id: agentId, updated_at: new Date().toISOString() }).eq("id", params.id);
    setAssignKey(k => k + 1);
    // Send in-app notification
    if (ticket && myUserId) {
      await supabase.from("notifications").insert({
        id: crypto.randomUUID(),
        user_id: agentId,
        type: "TICKET_ASSIGNED",
        title: "Ticket Assigned to You",
        message: `${ticket.code} — ${ticket.title}`,
        link: `/dashboard/tickets/${params.id}`,
        is_read: false,
      });
    }
    setAssignedTo(agent);
    setAssigning(false);
  };

  const handleCSAT = async () => {
    if (!csatScore || !ticket) return;
    setCsatSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("id").eq("supabase_id", user.id).single();
      if (!profile) return;
      await supabase.from("csat_scores").upsert({
        ticket_id: params.id, agent_id: assignedTo?.id ?? profile.id,
        score: csatScore, notes: csatNotes,
        month: new Date().getMonth() + 1, year: new Date().getFullYear(),
      }, { onConflict: "ticket_id" });
      setExistingCsat({ score: csatScore, notes: csatNotes });
      setCsatSaved(true);
      setTimeout(() => setCsatSaved(false), 3000);
    } finally { setCsatSaving(false); }
  };

  const handleSLA = async (hours: number) => {
    setSlaSaving(true);
    const supabase = createClient();
    await supabase.from("tickets").update({ sla_hours: hours, updated_at: new Date().toISOString() }).eq("id", params.id);
    setSlaHours(hours);
    setSlaSaving(false);
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("id").eq("supabase_id", user.id).single();
      if (!profile) return;
      const { data: newComment } = await supabase.from("ticket_comments").insert({
        id: crypto.randomUUID(), ticket_id: params.id, user_id: profile.id,
        content: comment, is_internal: isInternal, attachments: [],
      }).select("*, user:users(name)").single();
      if (newComment) setComments(prev => [...prev, newComment]);
      setComment("");
    } finally { setSubmitting(false); }
  };

  const csContact = contactStatus ? CONTACT_STATUS_COLORS[contactStatus] : null;

  if (loading) return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Loading…" />
      <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
    </div>
  );
  if (!ticket) return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Not found" actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/tickets"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>} />
      <div className="flex-1 flex items-center justify-center"><AlertCircle className="w-10 h-10 opacity-30" style={{ color: "var(--text-muted)" }} /></div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title={ticket.code} subtitle={ticket.title}
        actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/tickets"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>}
      />
      <div className="flex-1 p-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 max-w-7xl">

          {/* ── Main ── */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={STATUS_BADGE[currentStatus]}>{TICKET_STATUS_LABELS[currentStatus]}</Badge>
                  <Badge variant={PRIORITY_BADGE[ticket.priority]}>{TICKET_PRIORITY_LABELS[ticket.priority]}</Badge>
                  <Badge variant="outline">{TICKET_CATEGORY_LABELS[ticket.category as keyof typeof TICKET_CATEGORY_LABELS] ?? ticket.category}</Badge>
                  {ticket.project && <Badge variant="gold">{ticket.project}</Badge>}
                  {ticket.source && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--black-600)", color: "var(--text-muted)" }}>{SOURCE_LABELS[ticket.source] ?? ticket.source}</span>}
                  {(ticket.tags ?? []).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--black-600)", color: "var(--text-muted)" }}>
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                  {/* Contact Status badge */}
                  {contactStatus && csContact && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: csContact.bg, color: csContact.color, border: `1px solid ${csContact.color}44` }}>
                      <Phone className="w-2.5 h-2.5" />{CONTACT_STATUS_LABELS[contactStatus]}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{ticket.title}</h2>
                <div className="text-sm whitespace-pre-line leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ticket.description}</div>
              </CardContent>
            </Card>

            {/* Status + Contact Status Actions */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {STATUS_ACTIONS.map(({ status, label, icon: Icon, color }) => (
                  <button key={status} onClick={() => handleStatusChange(status)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all"
                    style={{ background: currentStatus === status ? "rgba(201,168,76,0.15)" : "var(--black-700)", border: currentStatus === status ? "1px solid var(--gold-500)" : "1px solid var(--black-500)", color: currentStatus === status ? "var(--gold-500)" : color }}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
              {/* Contact Status */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>Contact:</span>
                {CONTACT_STATUSES.map(cs => {
                  const col = CONTACT_STATUS_COLORS[cs];
                  const active = contactStatus === cs;
                  return (
                    <button key={cs} onClick={() => handleContactStatus(cs)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all"
                      style={{ background: active ? col.bg : "var(--black-700)", border: active ? `1px solid ${col.color}` : "1px solid var(--black-500)", color: active ? col.color : "var(--text-muted)" }}>
                      <Phone className="w-2.5 h-2.5" />{CONTACT_STATUS_LABELS[cs]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>ACTIVITY & COMMENTS ({comments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 && (
                  <div className="text-center py-5" style={{ color: "var(--text-muted)" }}>
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                )}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5"><AvatarFallback className="text-[10px]">{c.user?.name ? getInitials(c.user.name) : "?"}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="rounded-[10px] p-3" style={{ background: c.is_internal ? "rgba(245,158,11,0.05)" : "var(--black-700)", border: c.is_internal ? "1px dashed rgba(245,158,11,0.3)" : "none" }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{c.user?.name ?? "Unknown"}</span>
                            {c.is_internal && <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}><Lock className="w-2.5 h-2.5" /> Internal</span>}
                          </div>
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(c.created_at)}</span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{c.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <Avatar className="h-7 w-7 shrink-0 mt-1"><AvatarFallback className="text-[10px]">ME</AvatarFallback></Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea placeholder="Write a comment…" value={comment} onChange={e => setComment(e.target.value)} rows={3} />
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => setIsInternal(!isInternal)} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: isInternal ? "var(--warning)" : "var(--text-muted)" }}>
                        <Lock className="w-3.5 h-3.5" />{isInternal ? "Internal note" : "Make internal"}
                      </button>
                      <Button size="sm" onClick={handleComment} loading={submitting} disabled={!comment.trim()}>
                        <Send className="w-3.5 h-3.5" />{submitting ? "Sending…" : "Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Client card with WhatsApp */}
            {ticket.client && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>CLIENT</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
                      {getInitials(ticket.client.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/clients/${ticket.client.id}`} className="font-semibold text-sm hover:underline" style={{ color: "var(--text-primary)" }}>{ticket.client.name}</Link>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{ticket.client.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${ticket.client.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all flex-1 justify-center"
                      style={{ background: "var(--black-700)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <a href={`https://wa.me/${(ticket.client.whatsapp ?? ticket.client.phone).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-medium transition-all flex-1 justify-center"
                      style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {ticket.property && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>PROPERTY</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--gold-500)" }} />
                    <div>
                      <Link href={`/dashboard/properties/${ticket.property.id}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text-primary)" }}>{ticket.property.name}</Link>
                      {(ticket.property.unit || ticket.property.city) && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {[ticket.property.unit && `Unit ${ticket.property.unit}`, ticket.property.city].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignment */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>ASSIGNMENT</CardTitle>
                  {isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>Admin</span>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Assigned to</span>
                  {assignedTo ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
                        {assignedTo.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                      </div>
                      <span style={{ color: "var(--text-primary)" }}>{assignedTo.name}</span>
                    </div>
                  ) : <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Unassigned</span>}
                </div>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Reassign</p>
                    <Select key={assignKey} onValueChange={handleAssign} disabled={assigning}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={assigning ? "Assigning…" : "Select agent…"} />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>
                                {a.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                              </div>
                              {a.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Created by</span>
                  <span style={{ color: "var(--text-secondary)" }}>{ticket.created_by?.name ?? "—"}</span>
                </div>
              </CardContent>
            </Card>

            {/* SLA */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>SLA STATUS</CardTitle>
                  {slaHours && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>{slaHours}h set</span>}
                </div>
              </CardHeader>
              <CardContent>
                <SLAIndicator ticketId={ticket.id} category={ticket.category} source={ticket.source} createdAt={ticket.created_at} status={currentStatus} resolvedAt={ticket.resolved_at} slaHours={slaHours} size="md" />
                {isAdmin && (
                  <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Set SLA</p>
                    {slaSettings.length > 0 && (
                      <Select key={slaHours ?? "sla"} onValueChange={(v) => handleSLA(parseInt(v))}>
                        <SelectTrigger className="h-8 text-xs w-full"><SelectValue placeholder="Choose preset…" /></SelectTrigger>
                        <SelectContent>
                          {slaSettings.map(s => (
                            <SelectItem key={s.id} value={String(s.hours)}>
                              <div className="flex items-center gap-3">
                                <span>{TICKET_CATEGORY_LABELS[s.ticket_type as keyof typeof TICKET_CATEGORY_LABELS] ?? s.ticket_type}</span>
                                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.source ? SOURCE_LABELS[s.source] : "All"} · {s.hours}h</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Custom hours…" className="crm-input flex-1 text-xs h-8 px-2.5" min={1}
                        onBlur={e => { if (e.target.value) { handleSLA(parseInt(e.target.value)); e.target.value = ""; } }} />
                      {slaSaving && <div className="w-4 h-4 border border-t-[var(--gold-500)] rounded-full animate-spin shrink-0" />}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CSAT */}
            {isAdmin && ["RESOLVED","CLOSED"].includes(currentStatus) && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>CSAT SCORE</CardTitle>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>Admin</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {csatSaved && <div className="flex items-center gap-1.5 text-xs p-2 rounded-[6px]" style={{ background: "rgba(34,197,94,0.1)", color: "var(--success)" }}><CheckCircle className="w-3.5 h-3.5" /> Saved</div>}
                  {existingCsat && !csatSaved && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current: {existingCsat.score}/5 ⭐</p>}
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setCsatScore(s)}
                        className="w-9 h-9 rounded-[8px] flex items-center justify-center transition-all"
                        style={{ background: csatScore && csatScore >= s ? "var(--gold-glow)" : "var(--black-700)", border: csatScore && csatScore >= s ? "1px solid var(--gold-500)" : "1px solid var(--black-500)", color: csatScore && csatScore >= s ? "var(--gold-400)" : "var(--text-muted)" }}>
                        <Star className="w-4 h-4" fill={csatScore && csatScore >= s ? "var(--gold-400)" : "none"} />
                      </button>
                    ))}
                  </div>
                  <textarea value={csatNotes} onChange={e => setCsatNotes(e.target.value)} placeholder="Notes…" rows={2} className="crm-input w-full text-xs resize-none" />
                  <button onClick={handleCSAT} disabled={!csatScore || csatSaving} className="w-full py-1.5 rounded-[8px] text-xs font-semibold transition-all"
                    style={{ background: csatScore ? "var(--gold-glow)" : "var(--black-700)", border: csatScore ? "1px solid var(--gold-500)" : "1px solid var(--black-500)", color: csatScore ? "var(--gold-400)" : "var(--text-muted)" }}>
                    {csatSaving ? "Saving…" : existingCsat ? "Update" : "Save Score"}
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>TIMELINE</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Created</span><span style={{ color: "var(--text-secondary)" }}>{formatDateTime(ticket.created_at)}</span></div>
                {ticket.due_date && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Due</span>
                    <span style={{ color: new Date(ticket.due_date) < new Date() ? "var(--danger)" : "var(--text-secondary)" }}>{formatDateTime(ticket.due_date)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Updated</span><span style={{ color: "var(--text-secondary)" }}>{formatRelativeTime(ticket.updated_at)}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
