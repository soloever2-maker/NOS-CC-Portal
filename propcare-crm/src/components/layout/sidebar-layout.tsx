"use client";

import { useState, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react";
// 1. استدعاء usePathname عشان نعرف الرابط اتغير ولا لأ
import { usePathname } from "next/navigation"; 
import { Sidebar } from "@/components/layout/sidebar";
import type { User } from "@/types";

export function SidebarLayout({ user, children }: { user: User | null; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 2. أخد قيمة الرابط الحالي
  const pathname = usePathname();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 3. التعديل هنا: كلما اتغير الـ pathname، اقفل الموبايل سايد بار
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isMobile) {
    return (
      <div className="flex min-h-screen" style={{ backgroundColor: "var(--black-950)" }}>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 39,
            }}
          />
        )}

        {/* Sidebar — slides in from left */}
        <div style={{
          position: "fixed", top: 0, left: 0, height: "100%",
          transform: mobileOpen ? "translateX(0)" : "translateX(-260px)",
          transition: "transform 0.25s ease",
          zIndex: 40, width: 260,
        }}>
          <Sidebar
            user={user}
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
          />
        </div>

        {/* Main */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden" style={{ marginLeft: 0 }}>
          {/* Mobile topbar hamburger */}
          <div style={{
            position: "sticky", top: 0, zIndex: 30,
            display: "flex", alignItems: "center",
            padding: "0 12px",
            height: 60,
            background: "var(--black-900)",
            borderBottom: "1px solid var(--border)",
            gap: 12,
          }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <Menu className="w-4 h-4" />
            </button>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "var(--gold-400)",
              fontSize: 15, fontWeight: 700,
            }}>
              Nations of Sky
            </span>
          </div>

          {children}
        </main>
      </div>
    );
  }

  // Desktop
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--black-950)" }}>
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: "fixed", top: "50%", left: 8,
            transform: "translateY(-50%)",
            zIndex: 50, width: 24, height: 48,
            borderRadius: 6,
            background: "var(--black-800)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
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
