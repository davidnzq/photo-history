"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useT } from "@/lib/i18n";
import {
  TimelineIcon,
  NetworkIcon,
  MovementsIcon,
  LineageIcon,
} from "@/components/shell/ViewIcons";

type Tab = {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/",
    labelKey: "view.timeline",
    icon: <TimelineIcon />,
    match: (p) => p === "/" || p === "",
  },
  {
    href: "/network",
    labelKey: "view.network",
    icon: <NetworkIcon />,
    match: (p) => p.startsWith("/network"),
  },
  {
    href: "/movements",
    labelKey: "view.movements",
    icon: <MovementsIcon />,
    match: (p) => p.startsWith("/movements") || p.startsWith("/m/"),
  },
  {
    href: "/lineage",
    labelKey: "view.lineage",
    icon: <LineageIcon />,
    match: (p) => p.startsWith("/lineage"),
  },
];

export function ViewSwitcher() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav
      aria-label={t("view.timeline")}
      className="border-b border-rule bg-bg-elev/40 backdrop-blur-sm sticky top-14 z-20"
    >
      <div className="px-6 h-12 flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = tab.match(pathname || "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex items-center gap-2 px-3 h-9 transition-colors whitespace-nowrap",
                "border-b-2 -mb-px",
                active
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-2 hover:text-ink hover:border-rule-2"
              )}
            >
              <span className={clsx("opacity-90", active && "text-accent")}>
                {tab.icon}
              </span>
              <span className="font-display text-[13px] font-medium tracking-tight">
                {t(tab.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
