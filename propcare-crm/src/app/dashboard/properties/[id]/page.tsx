"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Bed, Bath, Maximize2, MapPin, DollarSign, AlertCircle, Ticket, Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, type PropertyType, type PropertyStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string; code: string; name: string; type: PropertyType; status: PropertyStatus;
  project?: string | null; building?: string | null; unit?: string | null;
  floor?: number | null; bedrooms?: number | null; bathrooms?: number | null;
  area?: number | null; price?: number | null; address?: string | null;
  city?: string | null; description?: string | null; created_at: string;
}

interface TicketItem {
  id: string; code: string; title: string; status: string; priority: string; created_at: string;
}

const STATUS_BADGE: Record<PropertyStatus, BadgeProps["variant"]> = {
  AVAILABLE: "resolved", RESERVED: "in-progress", SOLD: "closed",
  RENTED: "medium", UNDER_MAINTENANCE: "urgent",
};

const TYPE_COLOR: Record<PropertyType, string> = {
  APARTMENT: "var(--info)", VILLA: "var(--gold-500)", TOWNHOUSE: "var(--warning)",
  PENTHOUSE: "var(--gold-400)", STUDIO: "var(--success)", DUPLEX: "var(--info)", COMMERCIAL: "var(--text-muted)",
};

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.from("properties").select("*").eq("id", params.id).single()
      .then(({ data }) => { if (data) setProperty(data); setLoading(false); });

    supabase.from("tickets").select("id, code, title, status, priority, created_at")
      .eq("property_id", params.id).order("created_at", { ascending: false })
      .then(({ data }) => setTickets(data ?? []));
  }, [params.id]);

  if (loading) return (
    <div className="flex flex-col min-h-screen"><Topbar title="Loading…" />
      <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
    </div>
  );

  if (!property) return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Property not found" actions={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/properties"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" style={{ color: "var(--text-muted)" }} /><p style={{ color: "var(--text-muted)" }}>Property not found</p></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title={property.name}
        subtitle={`${property.code} · ${PROPERTY_TYPE_LABELS[property.type]}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/properties"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link></Button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
          {/* Left */}
          <div className="space-y-4">
            {/* Image placeholder */}
            <div className="rounded-[12px] h-48 flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--black-700), var(--black-600))", border: "0.5px solid var(--border)" }}>
              <Building2 className="w-16 h-16 opacity-20" style={{ color: TYPE_COLOR[property.type] }} />
              <div className="absolute top-3 left-3"><Badge variant={STATUS_BADGE[property.status]}>{PROPERTY_STATUS_LABELS[property.status]}</Badge></div>
            </div>

            <Card>
              <CardContent className="pt-5 space-y-3">
                {/* Type */}
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Type</span>
                  <span className="text-sm font-semibold" style={{ color: TYPE_COLOR[property.type] }}>{PROPERTY_TYPE_LABELS[property.type]}</span>
                </div>

                {/* Price */}
                {property.price && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Price</span>
                    <span className="text-sm font-bold" style={{ color: "var(--gold-400)", fontFamily: "'Playfair Display', serif" }}>{formatCurrency(property.price)}</span>
                  </div>
                )}

                {/* Specs */}
                <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  {property.bedrooms != null && (
                    <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Bed className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                      {property.bedrooms === 0 ? "Studio" : `${property.bedrooms} Bed`}
                    </div>
                  )}
                  {property.bathrooms != null && (
                    <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Bath className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                      {property.bathrooms} Bath
                    </div>
                  )}
                  {property.area && (
                    <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Maximize2 className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                      {property.area.toLocaleString()} m²
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>DETAILS</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { label: "Code", value: property.code },
                  { label: "Project", value: property.project },
                  { label: "Unit", value: property.unit },
                  { label: "Floor", value: property.floor?.toString() },
                  { label: "Building", value: property.building },
                  { label: "City", value: property.city },
                  { label: "Added", value: formatDate(property.created_at) },
                ].filter(d => d.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {property.description && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>DESCRIPTION</CardTitle></CardHeader>
                <CardContent><p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{property.description}</p></CardContent>
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
                    <Link href="/dashboard/tickets/new"><Plus className="w-3.5 h-3.5" /> New Ticket</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {tickets.length === 0 ? (
                  <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No tickets for this property yet</p>
                  </div>
                ) : (
                  <table className="crm-table">
                    <thead><tr><th>Ticket</th><th>Status</th><th>Priority</th><th>Date</th></tr></thead>
                    <tbody>
                      {tickets.map(t => (
                        <tr key={t.id}>
                          <td>
                            <Link href={`/dashboard/tickets/${t.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{t.title}</Link>
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t.code}</p>
                          </td>
                          <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--black-600)", color: "var(--text-secondary)" }}>{t.status.replace("_", " ")}</span></td>
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
