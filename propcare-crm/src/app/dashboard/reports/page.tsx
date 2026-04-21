"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, CheckCircle, Clock, Users, Download } from "lucide-react";

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
const CAT_COLORS = ["#c9a84c","#3b82f6","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] p-3 text-xs shadow-xl" style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
      <p className="font-semibold mb-2" style={{ color: "var(--gold-400)" }}>{label}</p>
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
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export/tickets");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const categoryData = Object.entries(stats?.byCategory ?? {})
    .map(([name, value]) => ({ name: CAT_LABELS[name] ?? name, value }))
    .sort((a, b) => b.value - a.value);

  const statusData = Object.entries(stats?.byStatus ?? {})
    .map(([name, value]) => ({ name: STATUS_LABELS[name] ?? name, value, fill: STATUS_COLORS[name] ?? "#888" }));

  const statCards = [
    { label: "Total Tickets", value: stats?.totalTickets ?? 0, icon: TrendingUp, color: "var(--gold-500)" },
    { label: "Open", value: stats?.openTickets ?? 0, icon: Clock, color: "var(--danger)" },
    { label: "Resolved Today", value: stats?.resolvedToday ?? 0, icon: CheckCircle, color: "var(--success)" },
    { label: "Clients", value: stats?.totalClients ?? 0, icon: Users, color: "var(--info)" },
  ];

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Reports"
        subtitle="Live data from your database"
        actions={
          <Button size="sm" variant="outline" onClick={handleExport} loading={exporting}>
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />
      <div className="flex-1 p-5 space-y-5">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "var(--black-700)" }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>
                {loading ? "—" : s.value}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Category Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>TICKETS BY CATEGORY</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
              ) : categoryData.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                      {categoryData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} opacity={0.85} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>TICKETS BY STATUS</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-t-[var(--gold-500)] rounded-full animate-spin" /></div>
              ) : statusData.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: "var(--text-muted)", strokeWidth: 0.5 }}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
