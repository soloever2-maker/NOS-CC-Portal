"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CheckCircle, Clock, Users } from "lucide-react";

interface Stats {
  totalTickets: number; openTickets: number; resolvedToday: number;
  totalClients: number; byCategory: Record<string, number>; byStatus: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6", IN_PROGRESS: "#f59e0b", PENDING_CLIENT: "#f59e0b",
  RESOLVED: "#22c55e", CLOSED: "#606060",
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open", IN_PROGRESS: "In Progress", PENDING_CLIENT: "Pending",
  RESOLVED: "Resolved", CLOSED: "Closed",
};
const CAT_LABELS: Record<string, string> = {
  MAINTENANCE: "Maintenance", COMPLAINT: "Complaint", INQUIRY: "Inquiry",
  PAYMENT: "Payment", LEASE: "Lease", HANDOVER: "Handover", OTHER: "Other",
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] p-3 text-xs shadow-xl" style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
      <p className="font-semibold mb-1.5" style={{ color: "var(--gold-400)" }}>{label}</p>
      {payload.map(e => (
        <div key={e.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{e.name}:</span>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{e.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(j => { if (j.success) setStats(j.data); }).finally(() => setLoading(false));
  }, []);

  const categoryData = Object.entries(stats?.byCategory ?? {}).map(([k, v]) => ({ name: CAT_LABELS[k] ?? k, value: v }));
  const statusData = Object.entries(stats?.byStatus ?? {}).map(([k, v]) => ({ name: STATUS_LABELS[k] ?? k, value: v, fill: STATUS_COLORS[k] ?? "#606060" }));

  const kpis = [
    { label: "Total Tickets", value: stats?.totalTickets ?? 0, icon: TrendingUp, color: "var(--gold-500)" },
    { label: "Open Tickets", value: stats?.openTickets ?? 0, icon: TrendingUp, color: "var(--danger)" },
    { label: "Resolved Today", value: stats?.resolvedToday ?? 0, icon: CheckCircle, color: "var(--success)" },
    { label: "Total Clients", value: stats?.totalClients ?? 0, icon: Users, color: "var(--info)" },
  ];

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Reports" subtitle="Analytics & performance insights" />
      <div className="flex-1 p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-3" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              {loading ? <div className="skeleton h-7 w-12 mb-1" /> : (
                <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{s.value}</p>
              )}
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* By Category */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKETS BY CATEGORY</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="skeleton h-48 w-full" /> : categoryData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Tickets" fill="#C9A84C" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TICKETS BY STATUS</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="skeleton h-48 w-full" /> : statusData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]} opacity={0.85}>
                      {statusData.map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
