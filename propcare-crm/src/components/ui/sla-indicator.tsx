"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { calculateSLA, type SLAInfo } from "@/lib/sla";
import { createClient } from "@/lib/supabase/client";

interface SLAIndicatorProps {
  ticketId: string;
  category: string;
  source?: string | null;
  createdAt: string;
  status: string;
  resolvedAt?: string | null;
  slaHours?: number | null; // Manual override from ticket
  size?: "sm" | "md";
}

let slaCache: Record<string, number> | null = null;

async function getSLAHours(category: string, source: string | null): Promise<number | null> {
  if (!slaCache) {
    const supabase = createClient();
    const { data } = await supabase.from("sla_settings").select("*").eq("is_active", true);
    slaCache = {};
    for (const s of data ?? []) {
      const key = s.source ? `${s.ticket_type}:${s.source}` : `${s.ticket_type}:default`;
      slaCache[key] = s.hours;
    }
  }
  if (source && slaCache[`${category}:${source}`]) return slaCache[`${category}:${source}`] ?? null;
  return slaCache[`${category}:default`] ?? null;
}

export function SLAIndicator({ category, source, createdAt, status, resolvedAt, slaHours, size = "sm" }: SLAIndicatorProps) {
  const [sla, setSLA] = useState<SLAInfo | null>(null);

  useEffect(() => {
    // If ticket has manual SLA hours — use it directly
    if (slaHours) {
      setSLA(calculateSLA(createdAt, status, resolvedAt ?? null, slaHours));
      return;
    }
    // Otherwise fetch from SLA settings
    getSLAHours(category, source ?? null).then(hours => {
      setSLA(calculateSLA(createdAt, status, resolvedAt ?? null, hours));
    });
  }, [category, source, createdAt, status, resolvedAt, slaHours]);

  useEffect(() => {
    if (["RESOLVED", "CLOSED"].includes(status)) return;
    const interval = setInterval(async () => {
      const hours = slaHours ?? await getSLAHours(category, source ?? null);
      setSLA(calculateSLA(createdAt, status, resolvedAt ?? null, hours));
    }, 60000);
    return () => clearInterval(interval);
  }, [category, source, createdAt, status, resolvedAt, slaHours]);

  if (!sla || sla.status === "no_sla") return null;

  const icons = {
    within: <Clock className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
    at_risk: <AlertTriangle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
    overdue: <XCircle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
    resolved: <CheckCircle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
    no_sla: null,
  };

  if (size === "sm") {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap"
        style={{ fontSize: 10, background: sla.bg, color: sla.color, border: `1px solid ${sla.color}44` }}
        title={`SLA: ${sla.hoursAllowed}h allowed · ${sla.hoursElapsed}h elapsed`}
      >
        {icons[sla.status]}
        {sla.label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" style={{ color: sla.color }}>
          {icons[sla.status]}
          <span className="text-sm font-semibold">{sla.label}</span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {sla.percentUsed}% of {sla.hoursAllowed}h
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--black-600)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${sla.percentUsed}%`, background: sla.color }} />
      </div>
      <div className="flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
        <span>Created: {new Date(createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        <span>SLA: {sla.hoursAllowed}h</span>
      </div>
    </div>
  );
}
