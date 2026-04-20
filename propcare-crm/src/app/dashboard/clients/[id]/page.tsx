"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Edit, Ticket, Plus, AlertCircle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Client {
  id: string; code: string; name: string; email?: string; phone: string;
  whatsapp?: string; nationality?: string; id_number?: string;
  address?: string; city?: string; notes?: string; tags: string[]; created_at: string;
}

interface TicketItem {
  id: string; code: string; title: string; status: string; priority: string; created_at: string;
}

const TAG_COLORS: Record<string, "gold" | "medium" | "open" | "resolved"> = {
  vip: "gold", owner: "medium", tenant: "open", investor: "resolved",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open", IN_PROGRESS: "In Progress", PENDING_CLIENT: "Pending",
  RESOLVED: "Resolved", CLOSED: "Closed",
};

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.from("clients").select("*").eq("id", params.id).single()
      .then(({ data }) => { if (data) setClient(data); setLoading(false); });

    supabase.from("tickets").select("id, code, title, status, priority, created_at")
      .eq("client_id", params.id).order("created_at", { ascending: false })
      .then(({ data }) => setTickets(data ?? []));
  }, [params.id]);

  if (loading) return (
    <div className="flex flex-col min-h-screen"><Topbar title="Loading…" />
      <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
    </div>
  );

  if (!client) return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Client not found" actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: "var(--text-muted)" }} /><p style={{ color: "var(--text-muted)" }}>Client not found</p></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title={client.name} subtitle={`${client.code}${client.nationality ? ` · ${client.nationality}` : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
          {/* Left */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center mb-4">
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarFallback className="text-xl">{getInitials(client.name)}</AvatarFallback>
                  </Avatar>
                  <h2 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{client.name}</h2>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{client.code}</p>
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {(client.tags ?? []).map(tag => <Badge key={tag} variant={TAG_COLORS[tag] ?? "outline"}>{tag}</Badge>)}
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />{client.phone}
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />{client.email}
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                      {[client.address, client.city].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>DETAILS</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { label: "Nationality", value: client.nationality },
                  { label: "ID Number", value: client.id_number },
                  { label: "WhatsApp", value: client.whatsapp },
                  { label: "Client Since", value: formatDate(client.created_at) },
                ].filter(d => d.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {client.notes && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>NOTES</CardTitle></CardHeader>
                <CardContent><p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{client.notes}</p></CardContent>
              </Card>
            )}
          </div>

          {/* Right */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKETS ({tickets.length})</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/tickets/new`}><Plus className="w-3.5 h-3.5" /> New Ticket</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {tickets.length === 0 ? (
                  <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tickets for this client yet</p>
                  </div>
                ) : (
                  <table className="crm-table">
                    <thead><tr><th>Ticket</th><th>Status</th><th>Priority</th><th>Created</th></tr></thead>
                    <tbody>
                      {tickets.map(t => (
                        <tr key={t.id}>
                          <td>
                            <Link href={`/dashboard/tickets/${t.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{t.title}</Link>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t.code}</p>
                          </td>
                          <td>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--black-600)", color: "var(--text-secondary)" }}>
                              {STATUS_LABEL[t.status] ?? t.status}
                            </span>
                          </td>
                          <td><span className="text-xs" style={{ color: t.priority === "URGENT" ? "var(--danger)" : t.priority === "HIGH" ? "var(--warning)" : "var(--text-muted)" }}>{t.priority}</span></td>
                          <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(t.created_at)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
