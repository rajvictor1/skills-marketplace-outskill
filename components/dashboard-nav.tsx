"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleDollarSign,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: ChartNoAxesCombined,
    exact: true,
  },
  {
    href: "/dashboard/skills",
    label: "My recipes",
    icon: Package,
    exact: false,
  },
  {
    href: "/dashboard/runs",
    label: "Agents & runs",
    icon: Activity,
    exact: false,
  },
  { href: "/skills", label: "Marketplace", icon: Sparkles, exact: false },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <>
      <nav
        aria-label="Dashboard"
        className="hidden w-56 shrink-0 border-r border-border/80 px-4 py-8 md:block"
      >
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </p>
        <div className="grid gap-1">
          {ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-8 rounded-xl border border-border bg-card/70 p-4">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          <p className="mt-3 text-sm font-medium">Security first</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Every submitted recipe is scanned before it can be listed.
          </p>
          <Link
            href="/security"
            className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            How it works <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </div>
        <div className="mt-4 rounded-xl border border-caution/25 bg-caution/5 p-4">
          <CircleDollarSign className="size-4 text-caution" aria-hidden />
          <p className="mt-3 text-sm font-medium">Payouts not connected</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Paid listings and creator earnings are not available in this
            release.
          </p>
        </div>
      </nav>
      <nav
        aria-label="Dashboard"
        className="flex gap-1 overflow-x-auto border-b border-border/80 px-4 py-2 md:hidden"
      >
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
