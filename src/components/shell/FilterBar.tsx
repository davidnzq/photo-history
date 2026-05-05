"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { MOVEMENTS } from "@/lib/data";
import type { FilterState, Region } from "@/lib/types";
import { defaultFilter, parseFilter, toSearchParams } from "@/lib/filter";
import { useT, getMovementName } from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";

/** Routes where the global filter bar is irrelevant (Tags 频道有自己的搜索) */
const HIDE_ON = [/^\/tags$/, /^\/tag\//, /^\/about$/];

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

  // 在 /tags / /tag/* / /about 路由上隐藏全局筛选条
  if (HIDE_ON.some((re) => re.test(pathname || ""))) return null;

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
          count={filter.movementIds.length}
        >
          <SearchableMultiSelect
            placeholder={t("filter.search")}
            items={MOVEMENTS.map((m) => ({
              id: m.id,
              label: getMovementName(m, locale),
              swatch: m.color,
            }))}
            selected={filter.movementIds}
            onChange={(ids) => update({ ...filter, movementIds: ids })}
            emptyLabel={t("filter.empty")}
            selectAllLabel={t("filter.selectAll")}
            clearLabel={t("filter.clearOne")}
            allLabel={t("filter.all")}
          />
        </Dropdown>

        {/* 地域 */}
        <Dropdown
          label={t("filter.regions")}
          count={filter.regions.length}
        >
          <SearchableMultiSelect
            placeholder={t("filter.search")}
            items={REGIONS.map((r) => ({ id: r.id, label: r.label }))}
            selected={filter.regions as string[]}
            onChange={(ids) =>
              update({ ...filter, regions: ids as Region[] })
            }
            emptyLabel={t("filter.empty")}
            selectAllLabel={t("filter.selectAll")}
            clearLabel={t("filter.clearOne")}
            allLabel={t("filter.all")}
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

/**
 * Trigger button — 显示 label + 当前选中数量徽标 (符合
 * GitHub / Linear / Notion 多选筛选的常规模式).
 *
 * 状态视觉:
 *  - count = 0: 默认 + 灰色(text-ink-3)
 *  - count > 0: 强调态 + 数字徽标
 *  - open:      accent 描边
 */
function Dropdown({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

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

  const active = count > 0;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={clsx(
          "flex items-center gap-2 px-3 h-8 border transition-colors text-[12px]",
          open
            ? "border-accent text-ink"
            : active
            ? "border-rule-2 text-ink hover:border-accent"
            : "border-rule text-ink-2 hover:text-ink hover:border-rule-2"
        )}
      >
        <span>{label}</span>
        {active && (
          <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 bg-accent text-bg text-[10px] font-display tabular-nums leading-none">
            {count}
          </span>
        )}
        <svg
          viewBox="0 0 24 24"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={clsx("transition-transform opacity-60", open && "rotate-180")}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-[calc(100%+4px)] left-0 z-40 bg-bg-elev border border-rule shadow-2xl"
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type Item = { id: string; label: string; swatch?: string };

/**
 * 完整多选交互 (符合设计 skill §8 progressive-disclosure / field-grouping
 * 与 GitHub / Linear 等参考组件):
 *
 *   ┌──────────────────────┐
 *   │ 🔍 搜索…           ✕ │  ← 自动 focus, 实时过滤
 *   │ ─────────────────── │
 *   │ 全选 (8) / 清除      │  ← header 提供 全选 / 清除 (仅在过滤后显示)
 *   │ ─────────────────── │
 *   │ ▢ 画意主义           │  ← checkbox 视觉, 受流派色提示
 *   │ ▣ 直接摄影           │  ← 已选: bg-2 + 高亮
 *   │ ▢ FSA 纪实           │
 *   │ …                    │
 *   └──────────────────────┘
 */
function SearchableMultiSelect({
  items,
  selected,
  onChange,
  placeholder,
  emptyLabel,
  selectAllLabel,
  clearLabel,
  allLabel,
}: {
  items: Item[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  emptyLabel: string;
  selectAllLabel: string;
  clearLabel: string;
  allLabel: string;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((it) => it.label.toLowerCase().includes(t));
  }, [items, q]);

  const visibleIds = filtered.map((it) => it.id);
  const visibleSelected = visibleIds.filter((id) => selected.includes(id));
  const allVisibleSelected =
    filtered.length > 0 && visibleSelected.length === filtered.length;

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );
  }
  function selectAllVisible() {
    const merged = new Set(selected);
    for (const id of visibleIds) merged.add(id);
    onChange([...merged]);
  }
  function clearAll() {
    onChange([]);
  }

  return (
    <div className="min-w-[260px] max-w-[320px]">
      {/* search */}
      <div className="px-2 pt-2">
        <div className="flex items-center gap-2 px-2 h-8 border border-rule focus-within:border-accent transition-colors">
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
              className="text-ink-3 hover:text-ink shrink-0 text-[14px] leading-none w-4 h-4 flex items-center justify-center"
              aria-label="clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* header: 全选可见 / 清除全部 */}
      {filtered.length > 0 && (
        <div className="px-3 mt-2 pb-1.5 border-b border-rule flex items-center gap-2 text-[10px] tracking-[0.16em] uppercase">
          <button
            type="button"
            onClick={allVisibleSelected ? clearAll : selectAllVisible}
            className="text-ink-3 hover:text-ink transition-colors font-display"
          >
            {allVisibleSelected ? clearLabel : selectAllLabel}
          </button>
          <span className="flex-1" />
          <span className="font-display text-ink-3 tabular-nums">
            {selected.length === 0
              ? allLabel
              : `${selected.length}/${items.length}`}
          </span>
        </div>
      )}

      {/* items */}
      <div className="max-h-[280px] overflow-y-auto p-1.5 mt-0.5">
        {filtered.length === 0 ? (
          <div className="text-[12px] text-ink-3 text-center py-4 italic">
            {emptyLabel}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px">
            {filtered.map((it) => {
              const on = selected.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(it.id)}
                  aria-pressed={on}
                  className={clsx(
                    "group flex items-center gap-2 px-2 h-8 text-left transition-colors",
                    on
                      ? "bg-bg-2 text-ink"
                      : "text-ink-2 hover:bg-bg-elev hover:text-ink"
                  )}
                >
                  {/* checkbox glyph */}
                  <span
                    className={clsx(
                      "w-3.5 h-3.5 shrink-0 border flex items-center justify-center transition-colors",
                      on
                        ? "border-accent bg-accent text-bg"
                        : "border-rule-2 group-hover:border-ink-3"
                    )}
                  >
                    {on && (
                      <svg
                        viewBox="0 0 12 12"
                        width="9"
                        height="9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M2 6.5l3 3 5-6" />
                      </svg>
                    )}
                  </span>
                  {/* swatch */}
                  {it.swatch !== undefined && (
                    <span
                      className="w-2 h-2 shrink-0"
                      style={{ background: it.swatch }}
                    />
                  )}
                  <span className="text-[12px] flex-1 truncate">
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
