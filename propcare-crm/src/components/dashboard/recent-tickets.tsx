import Link from "next/link";
import { ArrowRight, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { BadgeProps } from "@/components/ui/badge";

// Mock data — will be replaced with Prisma
const RECENT_TICKETS = [
  {
    id: "1",
    code: "TKT-A1B2C",
    title: "AC unit not working in Unit 4B",
    status: "OPEN" as const,
    priority: "URGENT" as const,
    client: "Ahmed Al-Farsi",
    property: "Bloom Heights - Tower A",
    createdAt: new Date(Date.now() - 1000 * 60 * 14),
    assignedTo: "Sarah M.",
  },
  {
    id: "2",
    code: "TKT-D3E4F",
    title: "Elevator maintenance request - Building C",
    status: "IN_PROGRESS" as const,
    priority: "HIGH" as const,
    client: "Fatima Hassan",
    property: "Marina Bay Residences",
    createdAt: new Date(Date.now() - 1000 * 60 * 47),
    assignedTo: "Omar R.",
  },
  {
    id: "3",
    code: "TKT-G5H6I",
    title: "Query about service charge breakdown",
    status: "PENDING_CLIENT" as const,
    priority: "MEDIUM" as const,
    client: "James Thornton",
    property: "Creek View Apartments",
    createdAt: new Date(Date.now() - 1000 * 60 * 90),
    assignedTo: "Priya S.",
  },
  {
    id: "4",
    code: "TKT-J7K8L",
    title: "Water leakage from bathroom ceiling",
    status: "OPEN" as const,
    priority: "HIGH" as const,
    client: "Nour Al-Din",
    property: "Downtown Suites",
    createdAt: new Date(Date.now() - 1000 * 60 * 142),
    assignedTo: null,
  },
  {
    id: "5",
    code: "TKT-M9N0O",
    title: "Lease renewal documentation request",
    status: "RESOLVED" as const,
    priority: "LOW" as const,
    client: "Emma Richardson",
    property: "Palm Residences",
    createdAt: new Date(Date.now() - 1000 * 60 * 210),
    assignedTo: "James T.",
  },
];

const STATUS_BADGE: Record<string, BadgeProps["variant"]> = {
  OPEN: "open",
  IN_PROGRESS: "in-progress",
  PENDING_CLIENT: "in-progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

const PRIORITY_BADGE: Record<string, BadgeProps["variant"]> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  PENDING_CLIENT: "Pending",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export function RecentTickets() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            RECENT TICKETS
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link href="/dashboard/tickets">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Client</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TICKETS.map((ticket) => (
                <tr key={ticket.id} className="cursor-pointer">
                  <td>
                    <div>
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="text-sm font-medium hover:text-[var(--gold-400)] transition-colors line-clamp-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {ticket.title}
                      </Link>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {ticket.code} · {ticket.property}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {ticket.client}
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge variant={STATUS_BADGE[ticket.status]}>
                      {STATUS_LABEL[ticket.status]}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={PRIORITY_BADGE[ticket.priority]}>
                      {ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: ticket.assignedTo ? "var(--text-secondary)" : "var(--text-muted)" }}>
                      {ticket.assignedTo ?? "Unassigned"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatRelativeTime(ticket.createdAt)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
