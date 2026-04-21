"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Building2, Bed, Bath, Maximize2, MoreHorizontal, Eye, Trash2, MapPin, AlertCircle, AlignJustify } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, type PropertyType, type PropertyStatus } from "@/types";

const STATUS_BADGE: Record<PropertyStatus, BadgeProps["variant"]> = {
  AVAILABLE: "resolved", RESERVED: "in-progress", SOLD: "closed",
  RENTED: "medium", UNDER_MAINTENANCE: "urgent",
};
const TYPE_COLOR: Record<PropertyType, string> = {
  APARTMENT: "var(--info)", VILLA: "var(--gold-500)", TOWNHOUSE: "var(--warning)",
  PENTHOUSE: "var(--gold-400)", STUDIO: "var(--success)", DUPLEX: "var(--info)", COMMERCIAL: "var(--text-muted)",
};

interface Property {
  id: string; code: string; name: string; type: PropertyType; status: PropertyStatus;
  project?: string | null; unit?: string | null; floor?: number | null;
  bedrooms?: number | null; bathrooms?: number | null; area?: number | null;
  price?: number | null; city?: string | null;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nos-compact-properties");
    if (saved === "true") setCompact(true);
  }, []);

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    localStorage.setItem("nos-compact-properties", String(next));
  };

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      const res = await fetch(`/api/properties?${params}`);
      const json = await res.json();
      if (json.success) setProperties(json.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Properties" subtitle={`${properties.length} properties`}
        actions={<Button size="sm" asChild><Link href="/dashboard/properties/new"><Plus className="w-3.5 h-3.5" /> Add Property</Link></Button>}
      />
      <div className="flex-1 p-5 space-y-4">

        {/* Status filter */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(["ALL","AVAILABLE","RESERVED","SOLD","RENTED"] as const).map((s) => {
            const count = s === "ALL" ? properties.length : properties.filter(p => p.status === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className="crm-card p-3 text-left transition-all cursor-pointer"
                style={{ borderColor: filterStatus === s ? "var(--gold-500)" : "var(--border)", background: filterStatus === s ? "rgba(201,168,76,0.08)" : "var(--black-800)" }}>
                <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{count}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s === "ALL" ? "All" : PROPERTY_STATUS_LABELS[s]}</p>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-2.5 items-center justify-between flex-wrap">
          <div className="max-w-xs w-full">
            <Input placeholder="Search properties…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            {view === "table" && (
              <button
                onClick={toggleCompact}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-xs font-medium transition-all"
                style={{
                  background: compact ? "var(--gold-glow)" : "transparent",
                  color: compact ? "var(--gold-500)" : "var(--text-muted)",
                  border: `0.5px solid ${compact ? "var(--gold-500)" : "var(--border)"}`,
                }}
              >
                <AlignJustify className="w-3.5 h-3.5" />
                {compact ? "Compact" : "Normal"}
              </button>
            )}
            <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
              {(["grid","table"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all"
                  style={{ background: view === v ? "var(--gold-glow)" : "transparent", color: view === v ? "var(--gold-500)" : "var(--text-muted)" }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-7 h-7 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
        ) : properties.length === 0 ? (
          <div className="crm-card flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="w-12 h-12 mb-4 opacity-20" style={{ color: "var(--gold-500)" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No properties yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add your first property to get started</p>
            <Button asChild className="mt-4"><Link href="/dashboard/properties/new"><Plus className="w-4 h-4" />Add Property</Link></Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {properties.map(prop => (
              <div key={prop.id} className="crm-card overflow-hidden group transition-all hover:border-[var(--border-strong)] hover:shadow-[0_0_24px_var(--gold-glow)]">
                <div className="h-32 relative flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--black-700), var(--black-600))" }}>
                  <Building2 className="w-9 h-9 opacity-20" style={{ color: TYPE_COLOR[prop.type] }} />
                  <div className="absolute top-2.5 left-2.5"><Badge variant={STATUS_BADGE[prop.status]}>{PROPERTY_STATUS_LABELS[prop.status]}</Badge></div>
                  <div className="absolute top-2.5 right-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-6 h-6 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100" style={{ background: "var(--black-800)", color: "var(--text-muted)" }}><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link href={`/dashboard/properties/${prop.id}`}><Eye className="w-4 h-4" />View</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive><Trash2 className="w-4 h-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="p-4">
                  <Link href={`/dashboard/properties/${prop.id}`}>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{prop.name}</h3>
                  </Link>
                  {(prop.project || prop.city) && (
                    <div className="flex items-center gap-1 mb-2.5"><MapPin className="w-3 h-3" style={{ color: "var(--text-muted)" }} /><p className="text-xs" style={{ color: "var(--text-muted)" }}>{[prop.project, prop.city].filter(Boolean).join(" · ")}</p></div>
                  )}
                  <div className="flex items-center gap-3 mb-2.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {prop.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{prop.bedrooms === 0 ? "Studio" : `${prop.bedrooms} Bed`}</span>}
                    {prop.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" />{prop.bathrooms} Bath</span>}
                    {prop.area && <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{prop.area.toLocaleString()} ft²</span>}
                  </div>
                  <div className="flex items-center justify-between pt-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{prop.code}</span>
                    {prop.price && <span className="text-sm font-bold" style={{ color: "var(--gold-400)", fontFamily: "'Playfair Display', serif" }}>{formatCurrency(prop.price)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
            <table className={`crm-table${compact ? " compact" : ""}`}>
              <thead><tr><th>Property</th><th>Type</th><th>Status</th><th>Specs</th><th>Price</th><th>City</th><th></th></tr></thead>
              <tbody>
                {properties.map(prop => (
                  <tr key={prop.id} className="group">
                    <td>
                      <Link href={`/dashboard/properties/${prop.id}`} className="font-medium hover:text-[var(--gold-400)]" style={{ color: "var(--text-primary)" }}>{prop.name}</Link>
                      <p className="text-[11px] row-subtitle" style={{ color: "var(--text-muted)" }}>{prop.code}</p>
                    </td>
                    <td><span className="text-xs" style={{ color: TYPE_COLOR[prop.type] }}>{PROPERTY_TYPE_LABELS[prop.type]}</span></td>
                    <td><Badge variant={STATUS_BADGE[prop.status]}>{PROPERTY_STATUS_LABELS[prop.status]}</Badge></td>
                    <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{prop.bedrooms != null ? (prop.bedrooms === 0 ? "Studio" : `${prop.bedrooms}BR`) : "—"}{prop.floor != null ? ` · Fl ${prop.floor}` : ""}</span></td>
                    <td><span className="text-sm font-semibold" style={{ color: "var(--gold-400)" }}>{prop.price ? formatCurrency(prop.price) : "—"}</span></td>
                    <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{prop.city ?? "—"}</span></td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-6 h-6 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100" style={{ color: "var(--text-muted)" }}><MoreHorizontal className="w-3.5 h-3.5" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/dashboard/properties/${prop.id}`}><Eye className="w-4 h-4" />View</Link></DropdownMenuItem>
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
