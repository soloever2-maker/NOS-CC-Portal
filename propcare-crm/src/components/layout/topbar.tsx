"use client";

import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  notificationCount?: number;
}

export function Topbar({
  title,
  subtitle,
  actions,
  showSearch = false,
  onSearch,
  notificationCount = 0,
}: TopbarProps) {
  return (
    <header
      className="page-header flex items-center justify-between sticky top-0 z-30"
      style={{ height: 64 }}
    >
      {/* Left: Title */}
      <div>
        <h1
          className="text-xl font-semibold leading-none"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: Search + Actions + Notifications */}
      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="w-56">
            <Input
              placeholder="Search…"
              startIcon={<Search className="w-3.5 h-3.5" />}
              onChange={(e) => onSearch?.(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        )}

        {actions}

        {/* Notification Bell */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-[8px] transition-all"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--gold-glow)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--gold-500)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: "var(--danger)", color: "white" }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
