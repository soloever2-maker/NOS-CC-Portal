"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Search, Phone, Mail, MapPin, Users, AlertCircle, MoreHorizontal, Eye, Trash2, AlignJustify, Pencil, X, Save, Upload, FileText } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate, getInitials } from "@/lib/utils";

interface Client {
  id: string; code: string; name: string; email?: string; phone: string;
  nationality?: string; city?: string; tags: string[]; created_at: string;
}

const TAG_COLORS: Record<string, "gold" | "medium" | "open" | "resolved"> = {
  vip: "gold", owner: "medium", tenant: "open", investor: "resolved",
};

export default function ClientsPage() {
  const [clients,    setClients]    = useState<Client[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [view,       setView]       = useState<"table" | "cards">("table");
  const [compact,    setCompact]    = useState(false);
  const [isAdmin,    setIsAdmin]    = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editForm,   setEditForm]   = useState<Partial<Client>>({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nos-compact-clients");
      if (saved === "true") setCompact(true);
    }
  }, []);

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    localStorage.setItem("nos-compact-clients", String(next));
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      if (json.success) setClients(json.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const sb = createClient();
      sb.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        const { data } = await sb.from("users").select("role").eq("supabase_id", user.id).single();
        if (data && ["ADMIN","SUPER_ADMIN"].includes(data.role)) setIsAdmin(true);
      });
    });
  }, []);

  const startEdit = (client: Client) => {
    setEditingId(client.id);
    setEditForm({ name: client.name, phone: client.phone, email: client.email ?? "", nationality: client.nationality ?? "", city: client.city ?? "", tags: client.tags });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/clients/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...editForm } : c));
        setEditingId(null);
      }
    } finally { setEditSaving(false); }
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Clients" subtitle={`${clients.length} clients`}
        actions={<Button size="sm" asChild><Link href="/dashboard/clients/new"><Plus className="w-3.5 h-3.5" /> New Client</Link></Button>}
      />
      <div className="flex-1 p-5 space-y-4">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Clients", value: clients.length, color: "var(--gold-500)" },
            { label: "VIP Clients", value: clients.filter(c => c.tags?.includes("vip")).length, color: "var(--warning)" },
            { label: "Owners", value: clients.filter(c => c.tags?.includes("owner")).length, color: "var(--info)" },
            { label: "Tenants", value: clients.filter(c => c.tags?.includes("tenant")).length, color: "var(--success)" },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "var(--black-700)" }}>
                <Users className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-lg font-bold leading-none" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2.5 items-center justify-between flex-wrap">
          <div className="w-full sm:max-w-xs">
            <Input placeholder="Search clients…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="flex items-center gap-2">
            {/* Compact toggle — only for table view */}
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
            {/* View toggle */}
            <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
              {(["table", "cards"] as const).map((v) => (
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
        ) : view === "table" ? (
          <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
            <table className={`crm-table${compact ? " compact" : ""}`}>
              <thead><tr><th>Client</th><th>Contact</th><th>Location</th><th>Tags</th><th>Since</th><th></th></tr></thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                    <AlertCircle className="w-7 h-7 mx-auto mb-2 opacity-40" /><p className="text-sm">No clients yet</p>
                  </td></tr>
                ) : clients.map((client) => (
                  <tr key={client.id} className="group">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="avatar-sm h-7 w-7 shrink-0"><AvatarFallback className="text-[10px]">{getInitials(client.name)}</AvatarFallback></Avatar>
                        <div>
                          <Link href={`/dashboard/clients/${client.id}`} className="font-medium hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{client.name}</Link>
                          <p className="text-[11px] row-subtitle" style={{ color: "var(--text-muted)" }}>{client.code}{client.nationality ? ` · ${client.nationality}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}><Phone className="w-3 h-3" />{client.phone}</div>
                        {client.email && <div className="flex items-center gap-1.5 text-xs row-subtitle" style={{ color: "var(--text-muted)" }}><Mail className="w-3 h-3" />{client.email}</div>}
                      </div>
                    </td>
                    <td><div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}><MapPin className="w-3 h-3" style={{ color: "var(--text-muted)" }} />{client.city ?? "—"}</div></td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(client.tags ?? []).map((tag) => (
                          <Badge key={tag} variant={TAG_COLORS[tag] ?? "outline"}>{tag}</Badge>
                        ))}
                      </div>
                    </td>
                    <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(client.created_at)}</span></td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-6 h-6 rounded-[6px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }}><MoreHorizontal className="w-3.5 h-3.5" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/dashboard/clients/${client.id}`}><Eye className="w-4 h-4" /> View</Link></DropdownMenuItem>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {clients.length === 0 ? (
              <div className="col-span-full text-center py-16" style={{ color: "var(--text-muted)" }}>
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No clients yet</p>
              </div>
            ) : clients.map((client) => {
              const isEditing = editingId === client.id;
              return isEditing ? (
                // ── Edit Card ──
                <div key={client.id} className="crm-card p-4 space-y-3" style={{ border: "1px solid var(--gold-500)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold" style={{ color: "var(--gold-500)" }}>EDITING</p>
                    <button onClick={() => setEditingId(null)} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Name</p>
                      <input className="crm-input w-full h-8 text-sm" value={editForm.name ?? ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Phone</p>
                      <input className="crm-input w-full h-8 text-sm" value={editForm.phone ?? ""} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Email</p>
                      <input className="crm-input w-full h-8 text-sm" value={editForm.email ?? ""} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Nationality</p>
                      <input className="crm-input w-full h-8 text-sm" value={editForm.nationality ?? ""} onChange={e => setEditForm(p => ({ ...p, nationality: e.target.value }))} />
                    </div>
                    <div>
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>City</p>
                      <input className="crm-input w-full h-8 text-sm" value={editForm.city ?? ""} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Tags (comma separated)</p>
                      <input className="crm-input w-full h-8 text-sm"
                        value={(editForm.tags ?? []).join(", ")}
                        onChange={e => setEditForm(p => ({ ...p, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} disabled={editSaving}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[8px] text-xs font-semibold transition-all"
                      style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
                      <Save className="w-3 h-3" />{editSaving ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="flex-1 py-1.5 rounded-[8px] text-xs font-semibold"
                      style={{ background: "var(--black-700)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // ── Normal Card ──
                <div key={client.id} className="crm-card p-4 transition-all hover:border-[var(--border-strong)] hover:shadow-[0_0_20px_var(--gold-glow)] group relative">
                  {isAdmin && (
                    <button onClick={() => startEdit(client)}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border)" }}>
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  <Link href={`/dashboard/clients/${client.id}`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar className="h-10 w-10"><AvatarFallback>{getInitials(client.name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-[var(--gold-400)] transition-colors" style={{ color: "var(--text-primary)" }}>{client.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{client.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: "var(--text-muted)" }}><Phone className="w-3 h-3" />{client.phone}</div>
                    <div className="flex flex-wrap gap-1">{(client.tags ?? []).map(tag => <Badge key={tag} variant={TAG_COLORS[tag] ?? "outline"}>{tag}</Badge>)}</div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
