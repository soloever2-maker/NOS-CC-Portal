"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import type { User } from "@/types";

export function SidebarLayout({ user, children }: { user: User | null; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--black-950)" }}>
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: "fixed",
          top: 16,
          left: collapsed ? 12 : 268,
          zIndex: 50,
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "var(--black-800)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "left 0.25s ease",
        }}
        title={collapsed ? "Show sidebar" : "Hide sidebar"}
      >
        {collapsed
          ? <PanelLeftOpen className="w-3.5 h-3.5" />
          : <PanelLeftClose className="w-3.5 h-3.5" />
        }
      </button>

      <main
        className="flex-1 flex flex-col min-h-screen overflow-x-hidden"
        style={{ marginLeft: collapsed ? 0 : 260, transition: "margin-left 0.25s ease" }}
      >
        {children}
      </main>
    </div>
  );
}
