"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Edit, Clock, User, Building2, Tag, MessageSquare,
  Send, Lock, CheckCircle, AlertTriangle, RefreshCw, X,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-elements";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import {
  TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, TICKET_CATEGORY_LABELS,
  type TicketStatus, type TicketPriority,
} from "@/types";

// Mock data
const TICKET = {
  id: "1", code: "TKT-A1B2C",
  title: "AC unit not working in Unit 4B",
  description: "The air conditioning unit in apartment 4B has completely stopped functioning. The tenant reports that it stopped working yesterday evening around 8 PM. The outdoor unit appears to be running but no cold air is coming through the vents. This is a high-priority issue given the current temperatures.\n\nTenant has already tried resetting the thermostat and the circuit breaker without success.",
  status: "IN_PROGRESS" as TicketStatus,
  priority: "URGENT" as TicketPriority,
  category: "MAINTENANCE",
  client: { name: "Ahmed Al-Farsi", phone: "+971 50 123 4567", email: "ahmed@example.com" },
  property: { name: "Bloom Heights - Tower A", unit: "4B", city: "Dubai" },
  assignedTo: { name: "Sarah Mitchell", initials: "SM" },
  createdBy: { name: "Omar Al-Rashid", initials: "OR" },
  createdAt: new Date(Date.now() - 1000 * 60 * 90),
  dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
  tags: ["ac", "hvac", "urgent-maintenance"],
  comments: [
    { id: "1", author: { name: "Omar Al-Rashid", initials: "OR" }, content: "Ticket created and assigned to maintenance team. Sarah will be on site within 2 hours.", isInternal: false, createdAt: new Date(Date.now() - 1000 * 60 * 85) },
    { id: "2", author: { name: "Sarah Mitchell", initials: "SM" }, content: "On my way to the property. Will assess the issue and update.", isInternal: false, createdAt: new Date(Date.now() - 1000 * 60 * 60) },
    { id: "3", author: { name: "Sarah Mitchell", initials: "SM" }, content: "Internal note: The outdoor compressor unit has a refrigerant leak. Need to contact HVAC contractor. Part may need to be ordered — could take 24-48 hours.", isInternal: true, createdAt: new Date(Date.now() - 1000 * 60 * 40) },
  ],
};

const STATUS_BADGE: Record<TicketStatus, BadgeProps["variant"]> = {
  OPEN: "open", IN_PROGRESS: "in-progress", PENDING_CLIENT: "in-progress",
  RESOLVED: "resolved", CLOSED: "closed",
};
const PRIORITY_BADGE: Record<TicketPriority, BadgeProps["variant"]> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
};

const STATUS_ACTIONS: { status: TicketStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: "IN_PROGRESS", label: "Start Progress", icon: RefreshCw, color: "var(--warning)" },
  { status: "PENDING_CLIENT", label: "Pending Client", icon: Clock, color: "var(--info)" },
  { status: "RESOLVED", label: "Mark Resolved", icon: CheckCircle, color: "var(--success)" },
  { status: "CLOSED", label: "Close Ticket", icon: X, color: "var(--text-muted)" },
];

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(TICKET.status);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setComment("");
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar
        title={TICKET.code}
        subtitle={TICKET.title}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/tickets">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Link>
            </Button>
            <Button variant="secondary" size="sm">
              <Edit className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl">
          {/* ── Main Content ── */}
          <div className="xl:col-span-2 space-y-4">
            {/* Ticket Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant={STATUS_BADGE[currentStatus]}>
                    {TICKET_STATUS_LABELS[currentStatus]}
                  </Badge>
                  <Badge variant={PRIORITY_BADGE[TICKET.priority]}>
                    {TICKET_PRIORITY_LABELS[TICKET.priority]}
                  </Badge>
                  <Badge variant="outline">
                    {TICKET_CATEGORY_LABELS[TICKET.category as keyof typeof TICKET_CATEGORY_LABELS]}
                  </Badge>
                  {TICKET.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: "var(--black-600)", color: "var(--text-muted)" }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                <h2
                  className="text-xl font-semibold mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--text-primary)" }}
                >
                  {TICKET.title}
                </h2>

                <div
                  className="text-sm whitespace-pre-line leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {TICKET.description}
                </div>
              </CardContent>
            </Card>

            {/* Status Change Actions */}
            <div className="flex flex-wrap gap-2">
              {STATUS_ACTIONS.map(({ status, label, icon: Icon, color }) => (
                <button
                  key={status}
                  onClick={() => setCurrentStatus(status)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all"
                  style={{
                    background: currentStatus === status ? "rgba(201,168,76,0.15)" : "var(--black-700)",
                    border: currentStatus === status ? "1px solid var(--gold-500)" : "1px solid var(--black-500)",
                    color: currentStatus === status ? "var(--gold-500)" : color,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Comments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  ACTIVITY & COMMENTS ({TICKET.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {TICKET.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarFallback className="text-xs">{c.author.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`rounded-[10px] p-3 ${c.isInternal ? "border border-dashed" : ""}`}
                        style={{
                          background: c.isInternal ? "rgba(245,158,11,0.05)" : "var(--black-700)",
                          borderColor: c.isInternal ? "rgba(245,158,11,0.3)" : "transparent",
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                              {c.author.name}
                            </span>
                            {c.isInternal && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}>
                                <Lock className="w-2.5 h-2.5" /> Internal
                              </span>
                            )}
                          </div>
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {formatRelativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {c.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <Avatar className="h-8 w-8 shrink-0 mt-1">
                    <AvatarFallback className="text-xs">ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Write a comment…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsInternal(!isInternal)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: isInternal ? "var(--warning)" : "var(--text-muted)" }}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {isInternal ? "Internal note" : "Make internal"}
                      </button>
                      <Button size="sm" onClick={handleComment} loading={submitting} disabled={!comment.trim()}>
                        <Send className="w-3.5 h-3.5" />
                        {submitting ? "Sending…" : "Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            {/* Client Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  CLIENT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: "var(--gold-glow)", color: "var(--gold-500)", border: "1px solid var(--border-strong)" }}>
                    {TICKET.client.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{TICKET.client.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{TICKET.client.phone}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1.5 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Email</span>
                    <span style={{ color: "var(--text-secondary)" }}>{TICKET.client.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>PROPERTY</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--gold-500)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{TICKET.property.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Unit {TICKET.property.unit} · {TICKET.property.city}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>ASSIGNMENT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Assigned to</span>
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">{TICKET.assignedTo.initials}</AvatarFallback>
                    </Avatar>
                    <span style={{ color: "var(--text-primary)" }}>{TICKET.assignedTo.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Created by</span>
                  <span style={{ color: "var(--text-secondary)" }}>{TICKET.createdBy.name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm" style={{ color: "var(--text-secondary)" }}>TIMELINE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  { label: "Created", value: formatDateTime(TICKET.createdAt) },
                  { label: "Due Date", value: formatDateTime(TICKET.dueDate), warning: TICKET.dueDate < new Date() },
                  { label: "Last Update", value: formatRelativeTime(TICKET.comments.at(-1)?.createdAt) },
                ].map(({ label, value, warning }) => (
                  <div key={label} className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ color: warning ? "var(--danger)" : "var(--text-secondary)" }}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
