"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Ticket, Plus, AlertCircle, MessageCircle, Building2, Clock } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, INTERACTION_TYPE_LABELS, type TicketStatus, type TicketPriority, type InteractionType } from "@/types";

interface Client {
  id: string; code: string; name: string; email?: string; phone: string;
  whatsapp?: string; nationality?: string; id_number?: string;
  address?: string; city?: string; notes?: string; tags: string[]; created_at: string;
}
interface TicketItem {
  id: string; code: string; title: string; status: TicketStatus; priority: TicketPriority; created_at: string; due_date?: string | null;
}
interface InteractionItem {
  id: string; type: InteractionType; summary: string; details?: string | null;
  duration?: number | null; created_at: string; user: { name: string } | null;
}
interface PropertyItem {
  id: string; name: string; unit?: string | null; project?: string | null;
  type: string; relation: string;
}

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

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tickets" | "interactions" | "properties">("tickets");

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from("clients").select("*").eq("id", params.id).single(),
      supabase.from("tickets").select("id, code, title, status, priority, created_at, due_date").eq("client_id", params.id).order("created_at", { ascending: false }),
      supabase.from("interactions").select("id, type, summary, details, duration, created_at, user:users(name)").eq("client_id", params.id).order("created_at", { ascending: false }),
      supabase.from("client_properties").select("id, relation, property:properties(id, name, unit, project, type)").eq("client_id", params.id),
    ]).then(([clientRes, ticketsRes, intRes, propsRes]) => {
      if (clientRes.data) setClient(clientRes.data);
      setTickets(ticketsRes.data ?? []);
      setInteractions(intRes.data ?? []);
      setProperties((propsRes.data ?? []).map((cp: Record<string, unknown>) => {
        const p = cp.property as Record<string, unknown>;
        return { id: p?.id as string, name: p?.name as string, unit: p?.unit as string, project: p?.project as string, type: p?.type as string, relation: cp.relation as string };
      }));
      setLoading(false);
    });
  }, [params.id]);

  if (loading) return (
    <div className="flex flex-col min-h-screen"><Topbar title="Loading…" />
      <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
    </div>
  );

  if (!client) return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Client not found" actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>} />
      <div className="flex-1 flex items-center justify-center"><AlertCircle className="w-10 h-10 opacity-30" style={{ color: "var(--text-muted)" }} /></div>
    </div>
  );

  const phone = client.whatsapp ?? client.phone;

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title={client.name} subtitle={`${client.code}${client.nationality ? ` · ${client.nationality}` : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>
            <Button size="sm" asChild><Link href={`/dashboard/tickets/new?clientId=${client.id}`}><Plus className="w-3.5 h-3.5" /> New Ticket</Link></Button>
          </div>
        }
      />

      <div className="flex-1 p-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 max-w-6xl">

          {/* ── Profile Card ── */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-5">
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarFallback className="text-xl font-semibold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)" }}>
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{client.name}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{client.code}</p>
                  {client.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap justify-center mt-2">
                      {client.tags.map(tag => <Badge key={tag} variant="gold">{tag}</Badge>)}
                    </div>
                  )}
                </div>

                {/* Quick contact */}
                <div className="flex gap-2 mb-4">
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-medium flex-1 justify-center transition-all"
                    style={{ background: "var(--black-700)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-medium flex-1 justify-center transition-all"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                </div>

                <div className="space-y-2.5 text-sm">
                  {client.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-secondary)" }} className="truncate">{client.email}</span>
                    </div>
                  )}
                  {(client.address || client.city) && (
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>{[client.address, client.city].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Tickets", value: tickets.length, icon: Ticket },
                { label: "Interactions", value: interactions.length, icon: MessageCircle },
                { label: "Properties", value: properties.length, icon: Building2 },
              ].map(s => (
                <div key={s.label} className="crm-card p-3 text-center">
                  <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{s.value}</p>
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

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>Client since {formatDate(client.created_at)}</p>
          </div>

          {/* ── 360° Tabs ── */}
          <div className="xl:col-span-2 space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 p-1 rounded-[10px] w-fit" style={{ background: "var(--black-800)", border: "1px solid var(--border)" }}>
              {(["tickets","interactions","properties"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-4 py-1.5 rounded-[7px] text-xs font-medium transition-all capitalize"
                  style={{ background: tab === t ? "var(--gold-glow)" : "transparent", color: tab === t ? "var(--gold-500)" : "var(--text-muted)", border: tab === t ? "1px solid var(--gold-500)" : "1px solid transparent" }}>
                  {t} {tab === t && `(${t === "tickets" ? tickets.length : t === "interactions" ? interactions.length : properties.length})`}
                </button>
              ))}
            </div>

            {/* Tickets Tab */}
            {tab === "tickets" && (
              <Card>
                <CardContent className="p-0">
                  {tickets.length === 0 ? (
                    <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                      <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No tickets yet</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {tickets.map(t => {
                        const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !["RESOLVED","CLOSED"].includes(t.status);
                        return (
                          <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--gold-glow)]">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{t.code}</span>
                                {isOverdue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)" }}>OVERDUE</span>}
                              </div>
                              <p className="text-sm font-medium truncate mt-0.5" style={{ color: "var(--text-primary)" }}>{t.title}</p>
                              <div className="flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                                <Clock className="w-3 h-3" />
                                <span className="text-[11px]">{formatRelativeTime(t.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Badge variant={PRIORITY_BADGE[t.priority]}>{TICKET_PRIORITY_LABELS[t.priority]}</Badge>
                              <Badge variant={STATUS_BADGE[t.status]}>{TICKET_STATUS_LABELS[t.status]}</Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Interactions Tab */}
            {tab === "interactions" && (
              <Card>
                <CardContent className="p-0">
                  {interactions.length === 0 ? (
                    <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No interactions logged</p>
                      <Link href="/dashboard/calls" className="text-xs mt-1 inline-block" style={{ color: "var(--gold-500)" }}>Log one →</Link>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {interactions.map(i => (
                        <div key={i.id} className="flex items-start gap-3 px-5 py-3.5">
                          <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold" style={{ background: "var(--black-700)", color: INTERACTION_COLORS[i.type] }}>
                            {i.type[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold" style={{ color: INTERACTION_COLORS[i.type] }}>{INTERACTION_TYPE_LABELS[i.type]}</span>
                              {i.duration && <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{i.duration} min</span>}
                            </div>
                            <p className="text-sm mt-0.5" style={{ color: "var(--text-primary)" }}>{i.summary}</p>
                            {i.details && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{i.details}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{formatRelativeTime(i.created_at)}</p>
                            {i.user && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>by {i.user.name}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Properties Tab */}
            {tab === "properties" && (
              <Card>
                <CardContent className="p-0">
                  {properties.length === 0 ? (
                    <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No properties linked</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {properties.map(p => (
                        <Link key={p.id} href={`/dashboard/properties/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--gold-glow)]">
                          <Building2 className="w-5 h-5 shrink-0" style={{ color: "var(--gold-500)" }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {[p.project, p.unit && `Unit ${p.unit}`, p.type].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>{p.relation}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
