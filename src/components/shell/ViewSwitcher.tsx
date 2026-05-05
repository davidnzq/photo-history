"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useT } from "@/lib/i18n";

type Tab = {
  href: string;
  /** translation key for primary label */
  labelKey: string;
  /** translation key for secondary label */
  subKey: string;
  icon: React.ReactNode;
  /** path prefixes that should mark this tab active */
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/",
    labelKey: "view.timeline",
    subKey: "view.timeline.sub",
    icon: <TimelineIcon />,
    match: (p) => p === "/" || p === "",
  },
  {
    href: "/network",
    labelKey: "view.network",
    subKey: "view.network.sub",
    icon: <NetworkIcon />,
    match: (p) => p.startsWith("/network"),
  },
  {
    href: "/movements",
    labelKey: "view.movements",
    subKey: "view.movements.sub",
    icon: <MovementsIcon />,
    match: (p) => p.startsWith("/movements") || p.startsWith("/m/"),
  },
  {
    href: "/lineage",
    labelKey: "view.lineage",
    subKey: "view.lineage.sub",
    icon: <LineageIcon />,
    match: (p) => p.startsWith("/lineage"),
  },
];

export function ViewSwitcher() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav
      aria-label="视图切换"
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
              <span className="font-display text-[10px] tracking-[0.18em] uppercase text-ink-3">
                {t(tab.subKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* Icons — simple line glyphs to match the editorial dark gallery feel */

function TimelineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M3 12h18" />
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
      <path d="M3 7v10" opacity=".4" />
      <path d="M21 7v10" opacity=".4" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M6 6L12 12M18 6L12 12M12 18L12 12" />
    </svg>
  );
}

function MovementsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function LineageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3v4" />
      <path d="M12 7c-3 0-6 2-6 5v3" />
      <path d="M12 7c3 0 6 2 6 5v3" />
      <path d="M12 7v8" />
      <circle cx="6" cy="17" r="1.5" fill="currentColor" />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
      <circle cx="18" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}
