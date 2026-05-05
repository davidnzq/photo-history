"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useMemo, useTransition } from "react";
import { clsx } from "clsx";
import { MOVEMENTS } from "@/lib/data";
import type { FilterState, Region } from "@/lib/types";
import { defaultFilter, parseFilter, toSearchParams } from "@/lib/filter";
import { useT, getMovementName } from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";

/**
 * FilterBar uses useSearchParams() under the hood — wrap inner in Suspense
 * so static prerendering doesn't bail out (Next.js 16 requirement).
 */
export function FilterBar() {
  return (
    <Suspense fallback={<FilterBarSkeleton />}>
      <FilterBarInner />
    </Suspense>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="border-b border-rule bg-bg/60 sticky top-[6.5rem] z-10">
      <div className="px-6 h-12" />
    </div>
  );
}

function FilterBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const t = useT();
  const { locale } = useLocale();

  const filter = useMemo(() => parseFilter(sp), [sp]);

  function update(next: FilterState) {
    const params = toSearchParams(next);
    const qs = params.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }

  const isClean =
    filter.movementIds.length === 0 && filter.regions.length === 0;

  const REGION_LABELS: Record<Region, string> = {
    europe: t("region.europe"),
    "n-america": t("region.n-america"),
    latin: t("region.latin"),
    asia: t("region.asia"),
    africa: t("region.africa"),
    oceania: t("region.oceania"),
    "middle-east": t("region.middle-east"),
  };

  return (
    <div className="border-b border-rule bg-bg/60 backdrop-blur-sm sticky top-[6.5rem] z-10">
      <div className="px-6 h-12 flex items-center gap-3 overflow-x-auto text-sm">
        <span className="font-display text-[10px] tracking-[0.18em] uppercase text-ink-3 mr-2">
          {t("filter.label")}
        </span>

        <Dropdown
          label={t("filter.movements")}
          summary={
            filter.movementIds.length === 0
              ? t("filter.all")
              : t("filter.nItems", { n: filter.movementIds.length })
          }
        >
          <div className="grid grid-cols-2 gap-1 p-1 max-h-72 overflow-y-auto min-w-[280px]">
            {MOVEMENTS.map((m) => {
              const on = filter.movementIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const next = on
                      ? filter.movementIds.filter((x) => x !== m.id)
                      : [...filter.movementIds, m.id];
                    update({ ...filter, movementIds: next });
                  }}
                  className={clsx(
                    "flex items-center gap-2 px-2 h-8 text-left transition-colors",
                    on
                      ? "bg-bg-2 text-ink"
                      : "text-ink-2 hover:bg-bg-elev hover:text-ink"
                  )}
                >
                  <span
                    className="w-2 h-2 shrink-0"
                    style={{ background: m.color }}
                  />
                  <span className="text-[12px]">{getMovementName(m, locale)}</span>
                </button>
              );
            })}
          </div>
        </Dropdown>

        <Dropdown
          label={t("filter.regions")}
          summary={
            filter.regions.length === 0
              ? t("filter.all")
              : filter.regions.map((r) => REGION_LABELS[r]).join(" · ")
          }
        >
          <div className="grid grid-cols-2 gap-1 p-1 min-w-[200px]">
            {(Object.keys(REGION_LABELS) as Region[]).map((r) => {
              const on = filter.regions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    const next = on
                      ? filter.regions.filter((x) => x !== r)
                      : [...filter.regions, r];
                    update({ ...filter, regions: next });
                  }}
                  className={clsx(
                    "px-2 h-8 text-left text-[12px] transition-colors",
                    on
                      ? "bg-bg-2 text-ink"
                      : "text-ink-2 hover:bg-bg-elev hover:text-ink"
                  )}
                >
                  {REGION_LABELS[r]}
                </button>
              );
            })}
          </div>
        </Dropdown>

        <div className="flex-1" />

        {!isClean && (
          <button
            type="button"
            onClick={() => update(defaultFilter())}
            className="text-[12px] text-ink-3 hover:text-accent transition-colors uppercase tracking-wider font-display"
          >
            {t("filter.clear")}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Subcomponents ──────────────────────────────────────────────── */

function Dropdown({
  label,
  summary,
  children,
}: {
  label: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="relative group">
      <summary className="list-none cursor-pointer flex items-center gap-2 px-3 h-8 border border-rule hover:border-rule-2 text-ink-2 group-open:text-ink group-open:border-accent transition-colors">
        <span className="text-[12px]">{label}</span>
        <span className="text-[12px] text-ink-3 group-open:text-ink">
          {summary}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="group-open:rotate-180 transition-transform"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="absolute top-full left-0 mt-1 bg-bg-elev border border-rule shadow-2xl z-30">
        {children}
      </div>
    </details>
  );
}

