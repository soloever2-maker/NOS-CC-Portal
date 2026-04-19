import {
  Ticket,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardCharts } from "@/components/dashboard/charts";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { formatRelativeTime } from "@/lib/utils";

// Mock stats — replace with real Prisma queries
const STATS = [
  {
    label: "Total Tickets",
    value: "1,284",
    change: "+12%",
    up: true,
    icon: Ticket,
    accent: "var(--gold-500)",
    bg: "var(--gold-glow)",
  },
  {
    label: "Open Tickets",
    value: "87",
    change: "-5%",
    up: false,
    icon: AlertCircle,
    accent: "var(--warning)",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    label: "Resolved Today",
    value: "23",
    change: "+8%",
    up: true,
    icon: CheckCircle2,
    accent: "var(--success)",
    bg: "rgba(34,197,94,0.1)",
  },
  {
    label: "Active Clients",
    value: "432",
    change: "+3%",
    up: true,
    icon: Users,
    accent: "var(--info)",
    bg: "rgba(59,130,246,0.1)",
  },
  {
    label: "Active Leads",
    value: "61",
    change: "+18%",
    up: true,
    icon: TrendingUp,
    accent: "var(--gold-500)",
    bg: "var(--gold-glow)",
  },
  {
    label: "Avg. Resolution",
    value: "4.2h",
    change: "-15%",
    up: true,
    icon: Clock,
    accent: "var(--success)",
    bg: "rgba(34,197,94,0.1)",
  },
];

const PRIORITY_BREAKDOWN = [
  { label: "Urgent", count: 8, variant: "urgent" as const, color: "var(--danger)" },
  { label: "High", count: 19, variant: "high" as const, color: "var(--warning)" },
  { label: "Medium", count: 43, variant: "medium" as const, color: "var(--info)" },
  { label: "Low", count: 17, variant: "low" as const, color: "var(--text-muted)" },
];

const CATEGORY_BREAKDOWN = [
  { label: "Maintenance", count: 31, pct: 36 },
  { label: "Complaint", count: 18, pct: 21 },
  { label: "Inquiry", count: 15, pct: 17 },
  { label: "Payment", count: 12, pct: 14 },
  { label: "Lease", count: 7, pct: 8 },
  { label: "Other", count: 4, pct: 4 },
];

const TOP_AGENTS = [
  { name: "Sarah Mitchell", resolved: 28, open: 4, avatar: null },
  { name: "Omar Al-Rashid", resolved: 24, open: 7, avatar: null },
  { name: "Priya Sharma", resolved: 21, open: 3, avatar: null },
  { name: "James Thornton", resolved: 18, open: 5, avatar: null },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title="Dashboard"
        subtitle={`Good morning — ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`}
        notificationCount={3}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* ── KPI Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="stat-card group">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                  style={{ background: stat.bg }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
                </div>
                <span
                  className="flex items-center gap-0.5 text-xs font-medium"
                  style={{ color: stat.up ? "var(--success)" : "var(--danger)" }}
                >
                  {stat.up ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stat.change}
                </span>
              </div>
              <p
                className="text-2xl font-bold leading-none mb-1"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  color: "var(--text-primary)",
                }}
              >
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <DashboardCharts />
          </div>

          {/* Priority Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                TICKETS BY PRIORITY
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PRIORITY_BREAKDOWN.map((p) => (
                <div key={p.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: p.color }}
                    />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {p.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.round((p.count / 87) * 80)}px`,
                        background: p.color,
                        opacity: 0.4,
                      }}
                    />
                    <span
                      className="text-sm font-semibold w-6 text-right"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {p.count}
                    </span>
                  </div>
                </div>
              ))}

              <div className="gold-divider my-4" />

              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                By Category
              </p>
              {CATEGORY_BREAKDOWN.map((c) => (
                <div key={c.label} className="flex items-center justify-between gap-2">
                  <span className="text-xs flex-1" style={{ color: "var(--text-secondary)" }}>
                    {c.label}
                  </span>
                  <div
                    className="h-1 rounded-full flex-1 max-w-[80px]"
                    style={{
                      background: `linear-gradient(90deg, var(--gold-500) ${c.pct}%, var(--black-600) ${c.pct}%)`,
                    }}
                  />
                  <span className="text-xs font-medium w-8 text-right" style={{ color: "var(--text-muted)" }}>
                    {c.pct}%
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Recent Tickets */}
          <div className="xl:col-span-2">
            <RecentTickets />
          </div>

          {/* Top Agents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                TOP AGENTS THIS WEEK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {TOP_AGENTS.map((agent, i) => (
                <div
                  key={agent.name}
                  className="flex items-center gap-3 p-2 rounded-[8px] transition-colors"
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = "var(--gold-glow)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                  }
                >
                  <span
                    className="w-6 text-xs font-bold text-center"
                    style={{ color: i === 0 ? "var(--gold-500)" : "var(--text-muted)" }}
                  >
                    #{i + 1}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: i === 0 ? "var(--gold-glow)" : "var(--black-600)",
                      color: i === 0 ? "var(--gold-500)" : "var(--text-secondary)",
                      border: i === 0 ? "1px solid var(--border-strong)" : "1px solid var(--border)",
                    }}
                  >
                    {agent.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {agent.name}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {agent.resolved} resolved · {agent.open} open
                    </p>
                  </div>
                  {i === 0 && (
                    <Activity className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--gold-500)" }} />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
