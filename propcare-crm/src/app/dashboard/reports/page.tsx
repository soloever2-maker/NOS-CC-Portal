"use client";

import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, CheckCircle, Users, Ticket } from "lucide-react";

const MONTHLY_TICKET_DATA = [
  { month: "Oct", created: 98, resolved: 89, closed: 75 },
  { month: "Nov", created: 112, resolved: 105, closed: 92 },
  { month: "Dec", created: 87, resolved: 91, closed: 80 },
  { month: "Jan", created: 124, resolved: 118, closed: 104 },
  { month: "Feb", created: 109, resolved: 103, closed: 95 },
  { month: "Mar", created: 138, resolved: 129, closed: 112 },
  { month: "Apr", created: 142, resolved: 134, closed: 121 },
];

const RESOLUTION_TIME_DATA = [
  { month: "Oct", avgHours: 6.2 },
  { month: "Nov", avgHours: 5.8 },
  { month: "Dec", avgHours: 7.1 },
  { month: "Jan", avgHours: 5.4 },
  { month: "Feb", avgHours: 4.9 },
  { month: "Mar", avgHours: 4.3 },
  { month: "Apr", avgHours: 4.1 },
];

const CATEGORY_PIE_DATA = [
  { name: "Maintenance", value: 36, color: "#C9A84C" },
  { name: "Complaint", value: 21, color: "#ef4444" },
  { name: "Inquiry", value: 17, color: "#3b82f6" },
  { name: "Payment", value: 14, color: "#f59e0b" },
  { name: "Lease", value: 8, color: "#22c55e" },
  { name: "Other", value: 4, color: "#606060" },
];

const AGENT_PERF = [
  { name: "Sarah M.", resolved: 134, avg: 3.8, csat: 4.8 },
  { name: "Omar R.", resolved: 118, avg: 4.2, csat: 4.6 },
  { name: "Priya S.", resolved: 107, avg: 4.5, csat: 4.7 },
  { name: "James T.", resolved: 89, avg: 5.1, csat: 4.4 },
  { name: "Aisha K.", resolved: 76, avg: 4.9, csat: 4.5 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] p-3 text-xs shadow-xl" style={{ background: "var(--black-700)", border: "1px solid var(--border-strong)" }}>
      <p className="font-semibold mb-1.5" style={{ color: "var(--gold-400)" }}>{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span style={{ color: "var(--text-muted)" }}>{e.name}:</span>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{e.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Reports" subtitle="Analytics & performance insights" />

      <div className="flex-1 p-6 space-y-6">
        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Time period:</p>
          <div className="flex gap-1 p-1 rounded-[8px]" style={{ background: "var(--black-800)", border: "0.5px solid var(--border)" }}>
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all" style={{ background: period === p ? "var(--gold-glow)" : "transparent", color: period === p ? "var(--gold-500)" : "var(--text-muted)" }}>
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Tickets Created", value: "142", change: "+8%", up: true, icon: Ticket, color: "var(--gold-500)" },
            { label: "Resolution Rate", value: "94.4%", change: "+2.1%", up: true, icon: CheckCircle, color: "var(--success)" },
            { label: "Avg Resolution Time", value: "4.1h", change: "-18%", up: true, icon: Clock, color: "var(--info)" },
            { label: "Active Agents", value: "12", change: "+2", up: true, icon: Users, color: "var(--warning)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-[8px] flex items-center justify-center" style={{ background: "var(--black-700)" }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <span className="text-xs font-semibold flex items-center gap-0.5" style={{ color: s.up ? "var(--success)" : "var(--danger)" }}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Monthly Tickets */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>MONTHLY TICKET VOLUME</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={MONTHLY_TICKET_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)", paddingTop: 8 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="created" name="Created" fill="#C9A84C" radius={[3, 3, 0, 0]} opacity={0.9} barSize={16} />
                  <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[3, 3, 0, 0]} opacity={0.8} barSize={16} />
                  <Bar dataKey="closed" name="Closed" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.7} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>BY CATEGORY</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={CATEGORY_PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {CATEGORY_PIE_DATA.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} contentStyle={{ background: "var(--black-700)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {CATEGORY_PIE_DATA.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                    </div>
                    <span className="font-semibold" style={{ color: "var(--text-muted)" }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Resolution Time Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>AVG RESOLUTION TIME (hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={RESOLUTION_TIME_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.08)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} domain={[3, 8]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="avgHours" name="Avg Hours" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill: "#C9A84C", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Agent Performance Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>AGENT PERFORMANCE</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Resolved</th>
                    <th>Avg Time</th>
                    <th>CSAT</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENT_PERF.map((a, i) => (
                    <tr key={a.name}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-xs font-bold text-center" style={{ color: i === 0 ? "var(--gold-500)" : "var(--text-muted)" }}>#{i + 1}</span>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: i === 0 ? "var(--gold-glow)" : "var(--black-600)", color: i === 0 ? "var(--gold-500)" : "var(--text-muted)", border: "1px solid var(--border)" }}>
                            {a.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-sm" style={{ color: "var(--text-primary)" }}>{a.name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{a.resolved}</span></td>
                      <td><span className="text-sm" style={{ color: a.avg < 4.5 ? "var(--success)" : "var(--warning)" }}>{a.avg}h</span></td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold" style={{ color: "var(--gold-400)" }}>★ {a.csat}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
