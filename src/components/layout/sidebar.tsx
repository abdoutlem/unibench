"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  GitCompare,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileStack,
  Webhook,
  Sparkles,
  TrendingUp,
  FileBarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & KPIs",
  },
  {
    name: "Portfolio",
    href: "/portfolio",
    icon: Briefcase,
    description: "Internal data",
    badge: "internal",
  },
  {
    name: "Data sources",
    href: "/documents",
    icon: FileStack,
    description: "Sources & config",
    badge: "internal",
  },
  {
    name: "Benchmarks",
    href: "/benchmarks",
    icon: BarChart3,
    description: "External data",
    badge: "external",
  },
  {
    name: "Compare",
    href: "/compare",
    icon: GitCompare,
    description: "Side-by-side",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    description: "Data visualization",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileBarChart2,
    description: "Saved reports",
  },
  {
    name: "Glossary",
    href: "/glossary",
    icon: BookOpen,
    description: "Definitions",
  },
  {
    name: "Webhook",
    href: "/webhook",
    icon: Webhook,
    description: "n8n Integration",
    badge: "internal",
  },
  {
    name: "Exploration",
    href: "/exploration",
    icon: Sparkles,
    description: "Discover metrics",
    badge: "internal",
  },
];

const bottomNavigation = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300 relative",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
            U
          </div>
          {!collapsed && (
            <span className="font-display text-base font-semibold tracking-tight">
              UniBench
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors group",
                isActive
                  ? "bg-primary/8 text-primary border-l-2 border-primary -ml-px"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-px text-[10px] font-medium uppercase tracking-wider",
                        item.badge === "internal"
                          ? "bg-internal/8 text-internal"
                          : "bg-external/8 text-external"
                      )}
                    >
                      {item.badge === "internal" ? "int" : "ext"}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="border-t py-2 px-2">
        {bottomNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mt-1"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
