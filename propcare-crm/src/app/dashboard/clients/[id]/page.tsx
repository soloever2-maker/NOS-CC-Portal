"use client";

import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Edit, Ticket, TrendingUp, Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";

const MOCK_CLIENT = {
  id: "1", code: "CLT-001", name: "Ahmed Al-Farsi", email: "ahmed.alfarsi@email.com",
  phone: "+971 50 123 4567", whatsapp: "+971 50 123 4567", nationality: "UAE",
  idNumber: "784-1985-1234567-1", address: "Villa 12, Palm Jumeirah", city: "Dubai",
  notes: "VIP client — owns 3 properties. Prefers WhatsApp communication. Very responsive.",
  tags: ["vip", "owner"], createdAt: new Date("2023-06-15"),
  properties: [
    { id: "1", code: "BHA-401", name: "Bloom Heights Tower A - 401", type: "APARTMENT", status: "RENTED" },
    { id: "3", code: "BHV-05", name: "Bloom Villas - Villa 05", type: "VILLA", status: "RESERVED" },
  ],
  tickets: [
    { id: "1", code: "TKT-A1B2C", title: "AC unit not working in Unit 4B", status: "IN_PROGRESS", priority: "URGENT", createdAt: new Date(Date.now() - 1000 * 60 * 90) },
    { id: "4", code: "TKT-J7K8L", title: "Water leakage from bathroom ceiling", status: "OPEN", priority: "HIGH", createdAt: new Date(Date.now() - 1000 * 60 * 142) },
  ],
};

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = MOCK_CLIENT;

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title={client.name}
        subtitle={`${client.code} · ${client.nationality}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/clients"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
            </Button>
            <Button variant="secondary" size="sm">
              <Edit className="w-3.5 h-3.5" /> Edit
            </Button>
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
                  <div className="flex gap-1 mt-2">
                    {client.tags.map(tag => <Badge key={tag} variant={tag === "vip" ? "gold" : "medium"}>{tag}</Badge>)}
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                    {client.address}, {client.city}
                  </div>
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
                  { label: "ID Number", value: client.idNumber },
                  { label: "Client Since", value: formatDate(client.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  </div>
                ))}
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

          {/* Right */}
          <div className="xl:col-span-2 space-y-4">
            {/* Properties */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>PROPERTIES ({client.properties.length})</CardTitle>
                  <Button variant="ghost" size="icon-sm"><Plus className="w-3.5 h-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.properties.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-[8px]" style={{ background: "var(--black-700)", border: "0.5px solid var(--border)" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.code} · {p.type}</p>
                    </div>
                    <Badge variant={p.status === "RENTED" ? "medium" : p.status === "RESERVED" ? "in-progress" : "resolved"}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tickets */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKETS ({client.tickets.length})</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5" /> New Ticket</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.tickets.map(t => (
                      <tr key={t.id}>
                        <td>
                          <Link href={`/dashboard/tickets/${t.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>
                            {t.title}
                          </Link>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t.code}</p>
                        </td>
                        <td><Badge variant={t.status === "OPEN" ? "open" : "in-progress"}>{t.status.replace("_", " ")}</Badge></td>
                        <td><Badge variant={t.priority === "URGENT" ? "urgent" : "high"}>{t.priority}</Badge></td>
                        <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(t.createdAt)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
