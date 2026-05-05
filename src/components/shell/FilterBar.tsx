"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { MOVEMENTS } from "@/lib/data";
import type { FilterState, Region } from "@/lib/types";
import { defaultFilter, parseFilter, toSearchParams } from "@/lib/filter";
import { useT, getMovementName } from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";

export function FilterBar() {
  return (
    <Suspense fallback={<FilterBarSkeleton />}>
      <FilterBarInner />
    </Suspense>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="border-b border-rule bg-bg/60 sticky top-[6.5rem] z-30">
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

  const REGIONS: Array<{ id: Region; label: string }> = [
    { id: "europe", label: t("region.europe") },
    { id: "n-america", label: t("region.n-america") },
    { id: "latin", label: t("region.latin") },
    { id: "asia", label: t("region.asia") },
    { id: "africa", label: t("region.africa") },
    { id: "oceania", label: t("region.oceania") },
    { id: "middle-east", label: t("region.middle-east") },
  ];

  /**
   * z-30 (above main view's z auto, equal to TopNav's z-30 — that's fine
   * because TopNav is a different sticky region).
   * 关键: 内部容器只设 gap,不设 overflow:auto — 否则 dropdown 会被裁。
   * 小屏幕可横滚通过外层 wrapper.
   */
  return (
    <div className="border-b border-rule bg-bg/60 backdrop-blur-sm sticky top-[6.5rem] z-30">
      <div className="px-6 h-12 flex items-center gap-3 text-sm">
        <span className="font-display text-[10px] tracking-[0.18em] uppercase text-ink-3 mr-2 shrink-0">
          {t("filter.label")}
        </span>

        {/* 流派 */}
        <Dropdown
          label={t("filter.movements")}
          summary={
            filter.movementIds.length === 0
              ? t("filter.all")
              : t("filter.nItems", { n: filter.movementIds.length })
          }
        >
          <SearchableMultiSelect
            placeholder={t("filter.search")}
            items={MOVEMENTS.map((m) => ({
              id: m.id,
              label: getMovementName(m, locale),
              swatch: m.color,
            }))}
            selected={filter.movementIds}
            onToggle={(id) => {
              const on = filter.movementIds.includes(id);
              const next = on
                ? filter.movementIds.filter((x) => x !== id)
                : [...filter.movementIds, id];
              update({ ...filter, movementIds: next });
            }}
            emptyLabel={t("filter.empty")}
          />
        </Dropdown>

        {/* 地域 */}
        <Dropdown
          label={t("filter.regions")}
          summary={
            filter.regions.length === 0
              ? t("filter.all")
              : filter.regions
                  .map((r) => REGIONS.find((x) => x.id === r)?.label ?? r)
                  .join(" · ")
          }
        >
          <SearchableMultiSelect
            placeholder={t("filter.search")}
            items={REGIONS.map((r) => ({ id: r.id, label: r.label }))}
            selected={filter.regions as string[]}
            onToggle={(id) => {
              const r = id as Region;
              const on = filter.regions.includes(r);
              const next = on
                ? filter.regions.filter((x) => x !== r)
                : [...filter.regions, r];
              update({ ...filter, regions: next });
            }}
            emptyLabel={t("filter.empty")}
          />
        </Dropdown>

        <div className="flex-1" />

        {!isClean && (
          <button
            type="button"
            onClick={() => update(defaultFilter())}
            className="text-[12px] text-ink-3 hover:text-accent transition-colors uppercase tracking-wider font-display shrink-0"
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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx(
          "flex items-center gap-2 px-3 h-8 border transition-colors",
          open
            ? "border-accent text-ink"
            : "border-rule hover:border-rule-2 text-ink-2 hover:text-ink"
        )}
      >
        <span className="text-[12px]">{label}</span>
        <span className="text-[12px] text-ink-3">{summary}</span>
        <svg
          viewBox="0 0 24 24"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={clsx("transition-transform", open && "rotate-180")}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 z-40 bg-bg-elev border border-rule shadow-2xl"
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

type Item = { id: string; label: string; swatch?: string };

function SearchableMultiSelect({
  items,
  selected,
  onToggle,
  placeholder,
  emptyLabel,
}: {
  items: Item[];
  selected: string[];
  onToggle: (id: string) => void;
  placeholder: string;
  emptyLabel: string;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus search on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((it) => it.label.toLowerCase().includes(t));
  }, [items, q]);

  return (
    <div className="min-w-[260px] max-w-[320px]">
      <div className="px-2 pt-2">
        <div className="flex items-center gap-2 px-2 h-8 border border-rule">
          <svg
            viewBox="0 0 24 24"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="text-ink-3 shrink-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-ink outline-none text-[12px] placeholder:text-ink-3"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="text-ink-3 hover:text-ink shrink-0"
              aria-label="clear"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="max-h-[280px] overflow-y-auto p-2 mt-1">
        {filtered.length === 0 && (
          <div className="text-[12px] text-ink-3 text-center py-4 italic">
            {emptyLabel}
          </div>
        )}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-0.5">
            {filtered.map((it) => {
              const on = selected.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onToggle(it.id)}
                  className={clsx(
                    "flex items-center gap-2 px-2 h-8 text-left transition-colors",
                    on
                      ? "bg-bg-2 text-ink"
                      : "text-ink-2 hover:bg-bg-elev hover:text-ink"
                  )}
                >
                  {it.swatch !== undefined && (
                    <span
                      className="w-2 h-2 shrink-0"
                      style={{ background: it.swatch }}
                    />
                  )}
                  <span className="text-[12px] flex-1">{it.label}</span>
                  {on && (
                    <span className="text-accent text-[10px]">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
