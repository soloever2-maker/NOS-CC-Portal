"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const WEEKLY_DATA = [
  { day: "Mon", open: 14, resolved: 18, new: 22 },
  { day: "Tue", open: 18, resolved: 14, new: 17 },
  { day: "Wed", open: 12, resolved: 21, new: 19 },
  { day: "Thu", open: 16, resolved: 19, new: 24 },
  { day: "Fri", open: 20, resolved: 15, new: 18 },
  { day: "Sat", open: 9,  resolved: 12, new: 11 },
  { day: "Sun", open: 7,  resolved: 8,  new: 9  },
];

const MONTHLY_DATA = [
  { day: "Jan", open: 62, resolved: 71, new: 89 },
  { day: "Feb", open: 58, resolved: 65, new: 74 },
  { day: "Mar", open: 74, resolved: 82, new: 95 },
  { day: "Apr", open: 80, resolved: 78, new: 102 },
  { day: "May", open: 71, resolved: 90, new: 88 },
  { day: "Jun", open: 65, resolved: 85, new: 79 },
];

const CATEGORY_DATA = [
  { name: "Maintenance", value: 31 },
  { name: "Complaint",   value: 18 },
  { name: "Inquiry",     value: 15 },
  { name: "Payment",     value: 12 },
  { name: "Lease",       value: 7  },
  { name: "Other",       value: 4  },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[10px] p-3 text-xs shadow-xl"
      style={{
        background: "var(--black-700)",
        border: "1px solid var(--border-strong)",
        color: "var(--text-primary)",
      }}
    >
      <p className="font-semibold mb-2" style={{ color: "var(--gold-400)" }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: entry.color }}
          />
          <span style={{ color: "var(--text-secondary)" }}>{entry.name}:</span>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function DashboardCharts() {
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const data = range === "weekly" ? WEEKLY_DATA : MONTHLY_DATA;

  return (
    <div className="space-y-4">
      {/* Ticket Trends */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle
              className="text-sm font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              TICKET TRENDS
            </CardTitle>
            <div
              className="flex rounded-[8px] overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {(["weekly", "monthly"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="px-3 py-1 text-xs font-medium transition-all"
                  style={{
                    background: range === r ? "var(--gold-glow)" : "transparent",
                    color: range === r ? "var(--gold-500)" : "var(--text-muted)",
                    borderRight: r === "weekly" ? "1px solid var(--border)" : "none",
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(201,168,76,0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="new"
                name="New"
                stroke="#C9A84C"
                strokeWidth={2}
                fill="url(#colorNew)"
                dot={false}
                activeDot={{ r: 4, fill: "#C9A84C" }}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorResolved)"
                dot={false}
                activeDot={{ r: 4, fill: "#22c55e" }}
              />
              <Area
                type="monotone"
                dataKey="open"
                name="Open"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                fill="url(#colorOpen)"
                dot={false}
                activeDot={{ r: 4, fill: "#ef4444" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "var(--text-muted)", paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            TICKETS BY CATEGORY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={CATEGORY_DATA}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barSize={24}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(201,168,76,0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                name="Tickets"
                fill="#C9A84C"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
