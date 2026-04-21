"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Ticket, Users, Building2,
  BarChart3, Settings, LogOut, MessageSquare, Bell, Target, ShieldCheck, Star,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";

const ADMIN_NAV = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
      { href: "/dashboard/properties", label: "Properties", icon: Building2 },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      { href: "/dashboard/kpi", label: "KPI Dashboard", icon: Target },
      { href: "/dashboard/calls", label: "Interactions", icon: MessageSquare },
      { href: "/dashboard/csat", label: "CSAT Scores", icon: Star },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/dashboard/sla", label: "SLA Settings", icon: ShieldCheck },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

const AGENT_NAV = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/tickets", label: "My Tickets", icon: Ticket },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
      { href: "/dashboard/properties", label: "Properties", icon: Building2 },
    ],
  },
  {
    title: "My Work",
    items: [
      { href: "/dashboard/my-kpi", label: "My KPIs", icon: Target },
      { href: "/dashboard/calls", label: "Interactions", icon: MessageSquare },
      { href: "/dashboard/csat", label: "CSAT Scores", icon: Star },
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

interface SidebarProps { user?: User | null; }

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.role === "MANAGER";
  const NAV_SECTIONS = isAdmin ? ADMIN_NAV : AGENT_NAV;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const initials = user?.name ? getInitials(user.name) : "NOS";

  return (
    <aside className="sidebar flex-col fixed left-0 top-0 h-screen z-40" style={{ width: 260 }}>
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] overflow-hidden flex items-center justify-center shrink-0" style={{ background: "var(--black-700)" }}>
            <Image src="/logo.png" alt="NOS" width={36} height={36} className="w-full h-full object-contain" priority />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "var(--gold-400)" }}>
              Nations of Sky
            </h1>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Customer Care CRM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} className={cn("nav-item", active && "active")}>
                    <item.icon className="w-4 h-4 shrink-0" style={{ color: active ? "var(--gold-500)" : "var(--text-muted)" }} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="gold-divider" />

      <div className="p-3">
        <div className="flex items-center gap-3 p-2.5 rounded-[10px]">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatar ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.name ?? "Agent"}</p>
            <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{user?.role?.replace("_", " ") ?? "Agent"}</p>
          </div>
          <button onClick={handleSignOut} className="p-1.5 rounded-[6px] transition-all hover:bg-red-500/10 hover:text-red-400 shrink-0" style={{ color: "var(--text-muted)" }} title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
