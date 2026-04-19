"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Phone, Mail, MapPin, Ticket,
  MoreHorizontal, Eye, Edit, Trash2, Users, AlertCircle,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getInitials } from "@/lib/utils";

const MOCK_CLIENTS = [
  { id: "1", code: "CLT-001", name: "Ahmed Al-Farsi", email: "ahmed.alfarsi@email.com", phone: "+971 50 123 4567", nationality: "UAE", city: "Dubai", tags: ["vip", "owner"], tickets: 3, openTickets: 1, createdAt: new Date("2023-06-15") },
  { id: "2", code: "CLT-002", name: "Fatima Hassan", email: "fatima.h@email.com", phone: "+971 55 987 6543", nationality: "UAE", city: "Abu Dhabi", tags: ["tenant"], tickets: 7, openTickets: 2, createdAt: new Date("2023-08-22") },
  { id: "3", code: "CLT-003", name: "James Thornton", email: "j.thornton@business.com", phone: "+971 52 456 7890", nationality: "UK", city: "Dubai", tags: ["owner", "investor"], tickets: 2, openTickets: 0, createdAt: new Date("2023-11-01") },
  { id: "4", code: "CLT-004", name: "Nour Al-Din", email: "nour.aldin@email.com", phone: "+971 56 234 5678", nationality: "Jordan", city: "Sharjah", tags: ["tenant"], tickets: 4, openTickets: 1, createdAt: new Date("2024-01-10") },
  { id: "5", code: "CLT-005", name: "Emma Richardson", email: "emma.r@email.com", phone: "+971 54 876 5432", nationality: "Australia", city: "Dubai", tags: ["tenant", "vip"], tickets: 1, openTickets: 0, createdAt: new Date("2024-02-28") },
  { id: "6", code: "CLT-006", name: "Rania Malik", email: "rania.malik@email.com", phone: "+971 50 345 6789", nationality: "Egypt", city: "Dubai", tags: ["owner"], tickets: 5, openTickets: 2, createdAt: new Date("2023-09-14") },
  { id: "7", code: "CLT-007", name: "David Clarke", email: "d.clarke@corp.com", phone: "+971 55 678 9012", nationality: "USA", city: "Dubai", tags: ["investor", "vip"], tickets: 8, openTickets: 1, createdAt: new Date("2022-12-05") },
  { id: "8", code: "CLT-008", name: "Layla Nasser", email: "layla.n@email.com", phone: "+971 52 901 2345", nationality: "Lebanon", city: "Ajman", tags: ["tenant"], tickets: 2, openTickets: 0, createdAt: new Date("2024-03-18") },
];

const TAG_COLORS: Record<string, string> = {
  vip: "gold",
  owner: "medium",
  tenant: "open",
  investor: "resolved",
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"table" | "cards">("table");

  const filtered = MOCK_CLIENTS.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Clients"
        subtitle={`${MOCK_CLIENTS.length} clients in database`}
        actions={
          <Button size="sm" asChild>
            <Link href="/dashboard/clients/new">
              <Plus className="w-3.5 h-3.5" /> New Client
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Clients", value: MOCK_CLIENTS.length, icon: Users, color: "var(--gold-500)" },
            { label: "VIP Clients", value: MOCK_CLIENTS.filter(c => c.tags.includes("vip")).length, icon: Users, color: "var(--warning)" },
            { label: "With Open Tickets", value: MOCK_CLIENTS.filter(c => c.openTickets > 0).length, icon: Ticket, color: "var(--danger)" },
            { label: "New This Month", value: 3, icon: Users, color: "var(--success)" },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="w-full sm:max-w-xs">
            <Input
              placeholder="Search clients…"
              startIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
            {(["table", "cards"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all"
                style={{
                  background: view === v ? "var(--gold-glow)" : "transparent",
                  color: view === v ? "var(--gold-500)" : "var(--text-muted)",
                }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table View ── */}
        {view === "table" ? (
          <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Tags</th>
                  <th>Tickets</th>
                  <th>Since</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No clients found</p>
                    </td>
                  </tr>
                ) : filtered.map((client) => (
                  <tr key={client.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/dashboard/clients/${client.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>
                            {client.name}
                          </Link>
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{client.code} · {client.nationality}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                          <Phone className="w-3 h-3" />{client.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          <Mail className="w-3 h-3" />{client.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <MapPin className="w-3 h-3" style={{ color: "var(--text-muted)" }} />{client.city}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {client.tags.map((tag) => (
                          <Badge key={tag} variant={(TAG_COLORS[tag] ?? "outline") as "gold" | "medium" | "open" | "resolved" | "outline"}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{client.tickets}</span>
                        {client.openTickets > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>
                            {client.openTickets} open
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(client.createdAt)}</span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/clients/${client.id}`}><Eye className="w-4 h-4" /> View Profile</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/clients/${client.id}/edit`}><Edit className="w-4 h-4" /> Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Cards View ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((client) => (
              <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
                <div className="crm-card p-4 transition-all hover:border-[var(--border-strong)] hover:shadow-[0_0_20px_var(--gold-glow)] cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{client.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{client.code}</p>
                      </div>
                    </div>
                    {client.openTickets > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>
                        {client.openTickets}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Phone className="w-3 h-3" />{client.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <MapPin className="w-3 h-3" />{client.city} · {client.nationality}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {client.tags.map((tag) => (
                      <Badge key={tag} variant={(TAG_COLORS[tag] ?? "outline") as "gold" | "medium" | "open" | "resolved" | "outline"}>
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{client.tickets} total tickets</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Since {formatDate(client.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
