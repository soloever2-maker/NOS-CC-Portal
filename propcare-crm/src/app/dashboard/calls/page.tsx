"use client";

import { useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Clock, User } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

const MOCK_CALLS = [
  { id: "1", type: "INBOUND", client: "Ahmed Al-Farsi", phone: "+971 50 123 4567", agent: "Sarah Mitchell", duration: 342, notes: "AC complaint follow-up — scheduled maintenance visit", createdAt: new Date(Date.now() - 1000 * 60 * 20) },
  { id: "2", type: "OUTBOUND", client: "Fatima Hassan", phone: "+971 55 987 6543", agent: "Omar Al-Rashid", duration: 128, notes: "Payment reminder for service charges Q1", createdAt: new Date(Date.now() - 1000 * 60 * 55) },
  { id: "3", type: "MISSED", client: "James Thornton", phone: "+971 52 456 7890", agent: null, duration: 0, notes: "", createdAt: new Date(Date.now() - 1000 * 60 * 90) },
  { id: "4", type: "INBOUND", client: "Nour Al-Din", phone: "+971 56 234 5678", agent: "Priya Sharma", duration: 215, notes: "Water leakage update — contractor booked for tomorrow", createdAt: new Date(Date.now() - 1000 * 60 * 140) },
  { id: "5", type: "OUTBOUND", client: "Emma Richardson", phone: "+971 54 876 5432", agent: "Sarah Mitchell", duration: 89, notes: "Lease renewal confirmation", createdAt: new Date(Date.now() - 1000 * 60 * 200) },
  { id: "6", type: "MISSED", client: "Rania Malik", phone: "+971 50 345 6789", agent: null, duration: 0, notes: "", createdAt: new Date(Date.now() - 1000 * 60 * 260) },
  { id: "7", type: "INBOUND", client: "David Clarke", phone: "+971 55 678 9012", agent: "Omar Al-Rashid", duration: 478, notes: "Investment portfolio discussion — interested in 3 more units", createdAt: new Date(Date.now() - 1000 * 60 * 320) },
  { id: "8", type: "OUTBOUND", client: "Layla Nasser", phone: "+971 52 901 2345", agent: "Priya Sharma", duration: 156, notes: "Pool area complaint resolved", createdAt: new Date(Date.now() - 1000 * 60 * 400) },
];

const formatDuration = (seconds: number) => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function CallLogsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filtered = MOCK_CALLS.filter((c) => {
    const matchSearch = !search || c.client.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchFilter = filter === "ALL" || c.type === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: MOCK_CALLS.length,
    inbound: MOCK_CALLS.filter(c => c.type === "INBOUND").length,
    outbound: MOCK_CALLS.filter(c => c.type === "OUTBOUND").length,
    missed: MOCK_CALLS.filter(c => c.type === "MISSED").length,
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Call Logs" subtitle="All inbound and outbound calls" />

      <div className="flex-1 p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Calls", value: stats.total, icon: Phone, color: "var(--gold-500)" },
            { label: "Inbound", value: stats.inbound, icon: PhoneIncoming, color: "var(--success)" },
            { label: "Outbound", value: stats.outbound, icon: PhoneOutgoing, color: "var(--info)" },
            { label: "Missed", value: stats.missed, icon: PhoneMissed, color: "var(--danger)" },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="max-w-xs w-full">
            <Input placeholder="Search calls…" startIcon={<Search className="w-3.5 h-3.5" />} value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
          </div>
          <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
            {["ALL", "INBOUND", "OUTBOUND", "MISSED"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all" style={{ background: filter === f ? "var(--gold-glow)" : "transparent", color: filter === f ? "var(--gold-500)" : "var(--text-muted)" }}>
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-[12px] overflow-hidden" style={{ border: "0.5px solid var(--border)", background: "var(--black-800)" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Client</th>
                <th>Phone</th>
                <th>Agent</th>
                <th>Duration</th>
                <th>Notes</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((call) => (
                <tr key={call.id}>
                  <td>
                    {call.type === "INBOUND" && <Badge variant="resolved"><PhoneIncoming className="w-3 h-3 mr-1" />Inbound</Badge>}
                    {call.type === "OUTBOUND" && <Badge variant="medium"><PhoneOutgoing className="w-3 h-3 mr-1" />Outbound</Badge>}
                    {call.type === "MISSED" && <Badge variant="urgent"><PhoneMissed className="w-3 h-3 mr-1" />Missed</Badge>}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{call.client}</span>
                    </div>
                  </td>
                  <td><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{call.phone}</span></td>
                  <td><span className="text-sm" style={{ color: call.agent ? "var(--text-secondary)" : "var(--text-muted)" }}>{call.agent ?? "—"}</span></td>
                  <td>
                    <div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">{formatDuration(call.duration)}</span>
                    </div>
                  </td>
                  <td><span className="text-xs line-clamp-1" style={{ color: "var(--text-muted)", maxWidth: 200 }}>{call.notes || "—"}</span></td>
                  <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDateTime(call.createdAt)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
