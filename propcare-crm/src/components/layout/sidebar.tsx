"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Building2,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Phone,
  Bell,
  ChevronDown,
  Crown,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/types";

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
      { href: "/dashboard/leads", label: "Leads", icon: TrendingUp },
      { href: "/dashboard/properties", label: "Properties", icon: Building2 },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/calls", label: "Call Logs", icon: Phone },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  user?: User | null;
  onSignOut?: () => void;
}

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar flex-col fixed left-0 top-0 h-screen z-40" style={{ width: 260 }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: "var(--gold-500)" }}
          >
            <Crown className="w-5 h-5" style={{ color: "var(--black-950)" }} />
          </div>
          <div>
            <h1
              className="text-base font-bold leading-none"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "var(--gold-400)",
              }}
            >
              PropCare
            </h1>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              CRM Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p
              className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "nav-item",
                      active && "active"
                    )}
                  >
                    <item.icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: active ? "var(--gold-500)" : "var(--text-muted)" }}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Gold Divider */}
      <div className="gold-divider mx-4" />

      {/* User Profile */}
      <div className="p-3">
        <div
          className="flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer transition-all group"
          style={{ color: "var(--text-secondary)" }}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar ?? undefined} />
            <AvatarFallback className="text-xs">
              {user?.name ? getInitials(user.name) : "PC"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {user?.name ?? "Agent"}
            </p>
            <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
              {user?.role?.replace("_", " ") ?? "Agent"}
            </p>
          </div>
          <button
            onClick={onSignOut}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
            style={{ color: "var(--text-muted)" }}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
