"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, Search, Building2, Bed, Bath, Maximize2, DollarSign,
  MoreHorizontal, Eye, Edit, Trash2, AlertCircle, MapPin,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, type PropertyType, type PropertyStatus } from "@/types";

const MOCK_PROPERTIES = [
  { id: "1", code: "BHA-401", name: "Bloom Heights Tower A - 401", type: "APARTMENT" as PropertyType, status: "RENTED" as PropertyStatus, project: "Bloom Heights", unit: "401", floor: 4, bedrooms: 2, bathrooms: 2, area: 1250, price: 2100000, city: "Dubai", building: "Tower A" },
  { id: "2", code: "MBR-201", name: "Marina Bay Residence - 201", type: "APARTMENT" as PropertyType, status: "AVAILABLE" as PropertyStatus, project: "Marina Bay Residences", unit: "201", floor: 2, bedrooms: 1, bathrooms: 1, area: 750, price: 1100000, city: "Dubai", building: null },
  { id: "3", code: "BHV-05", name: "Bloom Villas - Villa 05", type: "VILLA" as PropertyType, status: "RESERVED" as PropertyStatus, project: "Bloom Villas Phase 3", unit: "V05", floor: null, bedrooms: 4, bathrooms: 4, area: 4800, price: 9500000, city: "Dubai", building: null },
  { id: "4", code: "DS-1502", name: "Downtown Suites - 1502", type: "PENTHOUSE" as PropertyType, status: "SOLD" as PropertyStatus, project: "Downtown Suites", unit: "1502", floor: 15, bedrooms: 3, bathrooms: 3, area: 2900, price: 14000000, city: "Dubai", building: null },
  { id: "5", code: "CVA-305", name: "Creek View Apt - 305", type: "STUDIO" as PropertyType, status: "AVAILABLE" as PropertyStatus, project: "Creek View Apartments", unit: "305", floor: 3, bedrooms: 0, bathrooms: 1, area: 480, price: 680000, city: "Sharjah", building: null },
  { id: "6", code: "TPC-PH1", name: "The Penthouse Collection - PH1", type: "PENTHOUSE" as PropertyType, status: "AVAILABLE" as PropertyStatus, project: "The Penthouse Collection", unit: "PH1", floor: 32, bedrooms: 5, bathrooms: 5, area: 6200, price: 28000000, city: "Dubai", building: null },
  { id: "7", code: "PR-208", name: "Palm Residences - 208", type: "APARTMENT" as PropertyType, status: "RENTED" as PropertyStatus, project: "Palm Residences", unit: "208", floor: 2, bedrooms: 2, bathrooms: 2, area: 1400, price: 2800000, city: "Dubai", building: null },
  { id: "8", code: "AR3-TH12", name: "Arabian Ranches 3 - TH12", type: "TOWNHOUSE" as PropertyType, status: "SOLD" as PropertyStatus, project: "Arabian Ranches 3", unit: "TH12", floor: null, bedrooms: 3, bathrooms: 3, area: 2200, price: 4800000, city: "Dubai", building: null },
];

const STATUS_BADGE: Record<PropertyStatus, BadgeProps["variant"]> = {
  AVAILABLE: "resolved", RESERVED: "in-progress", SOLD: "closed",
  RENTED: "medium", UNDER_MAINTENANCE: "urgent",
};

const TYPE_ICON_COLOR: Record<PropertyType, string> = {
  APARTMENT: "var(--info)", VILLA: "var(--gold-500)", TOWNHOUSE: "var(--warning)",
  PENTHOUSE: "var(--gold-400)", STUDIO: "var(--success)", DUPLEX: "var(--info)", COMMERCIAL: "var(--text-muted)",
};

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const filtered = MOCK_PROPERTIES.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()) || p.project?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "ALL" || p.type === filterType;
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Properties"
        subtitle={`${MOCK_PROPERTIES.length} properties in portfolio`}
        actions={
          <Button size="sm" asChild>
            <Link href="/dashboard/properties/new">
              <Plus className="w-3.5 h-3.5" /> Add Property
            </Link>
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* ── Status Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["ALL","AVAILABLE","RESERVED","SOLD","RENTED"] as const).map((s) => {
            const count = s === "ALL" ? MOCK_PROPERTIES.length : MOCK_PROPERTIES.filter(p => p.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="crm-card p-3 text-left transition-all"
                style={{ borderColor: filterStatus === s ? "var(--gold-500)" : "var(--border)", background: filterStatus === s ? "rgba(201,168,76,0.08)" : "var(--black-800)" }}
              >
                <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{count}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s === "ALL" ? "All Properties" : PROPERTY_STATUS_LABELS[s]}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Filters + View ── */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <div className="w-56">
              <Input placeholder="Search properties…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="flex gap-1 items-center">
              {["ALL", "APARTMENT", "VILLA", "PENTHOUSE", "STUDIO", "TOWNHOUSE"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className="px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all"
                  style={{ background: filterType === t ? "var(--gold-glow)" : "var(--black-700)", color: filterType === t ? "var(--gold-500)" : "var(--text-muted)", border: filterType === t ? "1px solid var(--border-strong)" : "1px solid transparent" }}
                >
                  {t === "ALL" ? "All" : PROPERTY_TYPE_LABELS[t as PropertyType]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
            {(["grid", "table"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all" style={{ background: view === v ? "var(--gold-glow)" : "transparent", color: view === v ? "var(--gold-500)" : "var(--text-muted)" }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid View ── */}
        {view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-16" style={{ color: "var(--text-muted)" }}>
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No properties found</p>
              </div>
            ) : filtered.map((prop) => (
              <div key={prop.id} className="crm-card overflow-hidden group transition-all hover:border-[var(--border-strong)] hover:shadow-[0_0_24px_var(--gold-glow)] cursor-pointer">
                {/* Image placeholder */}
                <div className="h-40 relative overflow-hidden" style={{ background: `linear-gradient(135deg, var(--black-700) 0%, var(--black-600) 100%)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="w-12 h-12 opacity-20" style={{ color: TYPE_ICON_COLOR[prop.type] }} />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge variant={STATUS_BADGE[prop.status]}>{PROPERTY_STATUS_LABELS[prop.status]}</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--black-800)", color: "var(--text-muted)" }}>
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/dashboard/properties/${prop.id}`}><Eye className="w-4 h-4" />View</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href={`/dashboard/properties/${prop.id}/edit`}><Edit className="w-4 h-4" />Edit</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--black-800)", color: TYPE_ICON_COLOR[prop.type], border: "1px solid var(--border)" }}>
                      {PROPERTY_TYPE_LABELS[prop.type]}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <Link href={`/dashboard/properties/${prop.id}`}>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>
                      {prop.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{prop.project} · {prop.city}</p>
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {prop.bedrooms != null && (
                      <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{prop.bedrooms === 0 ? "Studio" : `${prop.bedrooms} Bed`}</span>
                    )}
                    {prop.bathrooms != null && (
                      <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{prop.bathrooms} Bath</span>
                    )}
                    {prop.area && (
                      <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{prop.area.toLocaleString()} sq.ft</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{prop.code}</span>
                    {prop.price && (
                      <span className="text-sm font-bold" style={{ color: "var(--gold-400)", fontFamily: "'Playfair Display', serif" }}>
                        {formatCurrency(prop.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Table View ── */
          <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Specs</th>
                  <th>Area</th>
                  <th>Price</th>
                  <th>City</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prop) => (
                  <tr key={prop.id} className="group">
                    <td>
                      <div>
                        <Link href={`/dashboard/properties/${prop.id}`} className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{prop.name}</Link>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{prop.code} · {prop.project}</p>
                      </div>
                    </td>
                    <td><span className="text-sm" style={{ color: TYPE_ICON_COLOR[prop.type] }}>{PROPERTY_TYPE_LABELS[prop.type]}</span></td>
                    <td><Badge variant={STATUS_BADGE[prop.status]}>{PROPERTY_STATUS_LABELS[prop.status]}</Badge></td>
                    <td>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {prop.bedrooms != null && <span>{prop.bedrooms === 0 ? "Studio" : `${prop.bedrooms}BR`}</span>}
                        {prop.bathrooms != null && <span>· {prop.bathrooms}BA</span>}
                        {prop.floor != null && <span>· Fl {prop.floor}</span>}
                      </div>
                    </td>
                    <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{prop.area ? `${prop.area.toLocaleString()} ft²` : "—"}</span></td>
                    <td><span className="text-sm font-semibold" style={{ color: "var(--gold-400)" }}>{prop.price ? formatCurrency(prop.price) : "—"}</span></td>
                    <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{prop.city}</span></td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}>
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/dashboard/properties/${prop.id}`}><Eye className="w-4 h-4" />View</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/dashboard/properties/${prop.id}/edit`}><Edit className="w-4 h-4" />Edit</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
