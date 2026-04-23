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

{/* Toggle Button — shown outside sidebar when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: "fixed",
            top: "50%",
            left: 8,
            transform: "translateY(-50%)",
            zIndex: 50,
            width: 24,
            height: 48,
            borderRadius: 6,
            background: "var(--black-800)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Show sidebar"
        >
          <PanelLeftOpen className="w-3.5 h-3.5" />
        </button>
      )}
      
      <main
        className="flex-1 flex flex-col min-h-screen overflow-x-hidden"
        style={{ marginLeft: collapsed ? 0 : 260, transition: "margin-left 0.25s ease" }}
      >
        {children}
      </main>
    </div>
  );
}
