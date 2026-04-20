"use client";

import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";

export default function CallLogsPage() {
  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <Topbar title="Call Logs" subtitle="Track all inbound and outbound calls" />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Calls", value: 0, icon: Phone, color: "var(--gold-500)" },
            { label: "Inbound", value: 0, icon: PhoneIncoming, color: "var(--success)" },
            { label: "Outbound", value: 0, icon: PhoneOutgoing, color: "var(--info)" },
            { label: "Missed", value: 0, icon: PhoneMissed, color: "var(--danger)" },
          ].map((s) => (
            <div key={s.label} className="crm-card p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "var(--black-700)" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "var(--text-primary)" }}>0</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="crm-card flex flex-col items-center justify-center py-24 text-center">
          <Phone className="w-12 h-12 mb-4 opacity-20" style={{ color: "var(--gold-500)" }} />
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No call logs yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Call logs will appear here once recorded</p>
        </div>
      </div>
    </div>
  );
}
