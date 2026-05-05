"use client";

/**
 * LineageTree — vertical indented tree.
 *
 * 设计选型(取代旧 SVG + 年份纵轴 + 按 leafCount 横向铺开的方案):
 *   - 数据形态:深度嵌套树, 共 ~107 节点(root → 事件 → 流派 → 摄影师 →
 *     有时再嵌入"流派由摄影师催生"的子流派),且每个节点都带年份.
 *   - 旧方案问题:78 leaves × 64–124px = 6000+px 横向, 必出水平滚动 + 标签
 *     在窄槽位重叠 + sticky 年轴在不同滚动位置上的亚像素错位.
 *   - 新方案:类似文件树 / JSON viewer 的纵向缩进列表. 信息按时间排序,
 *     纵向一屏即可看到整体骨架(默认事件展开 / 流派折叠), 点击流派局部
 *     展开摄影师. 完全无水平滚动, 没有连线对齐问题, 标签永不重叠.
 *
 * 设计规则参考:
 *   §2 gesture-conflicts (避免横向手势)、§5 horizontal-scroll、§5 scroll-
 *   behavior、§5 visual-hierarchy、§6 spacing-scale、§8 progressive-
 *   disclosure (默认折叠, 按需展开)、§9 back-stack-integrity (Link replace).
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import type { LineageNode, FilterState } from "@/lib/types";
import { getMovement, getPhotographer } from "@/lib/data";
import {
  useT,
  getMovementName,
  getPhotographerName,
} from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";
import { parseFilter, passes } from "@/lib/filter";

type Props = { root: LineageNode };

const ROW_H = 34;
const INDENT = 18;
const YEAR_W = 64;
const EXPAND_KEY = "lineage-expanded-v3";
const SCROLL_KEY = "lineage-scroll-v3";

export function LineageTree(props: Props) {
  return (
    <Suspense fallback={null}>
      <LineageTreeInner {...props} />
    </Suspense>
  );
}

type Flat = {
  node: LineageNode;
  depth: number;
  hasChildren: boolean;
  childCount: number;
  visiblePhotographerCount: number;
  expanded: boolean;
  ancestorIds: string[];
};

function isFilteredOut(n: LineageNode, filter: FilterState): boolean {
  if (n.kind === "photographer" && n.refId) {
    const ph = getPhotographer(n.refId);
    if (ph && !passes(ph, filter)) return true;
  }
  if (n.kind === "movement" && n.refId) {
    if (
      filter.movementIds.length &&
      !filter.movementIds.includes(n.refId)
    ) {
      return true;
    }
  }
  return false;
}

function countVisiblePhotographers(
  n: LineageNode,
  filter: FilterState
): number {
  if (isFilteredOut(n, filter)) return 0;
  let c = n.kind === "photographer" ? 1 : 0;
  if (n.children) {
    for (const ch of n.children) c += countVisiblePhotographers(ch, filter);
  }
  return c;
}

function LineageTreeInner({ root }: Props) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const sp = useSearchParams();
  const filter = useMemo(() => parseFilter(sp), [sp]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [expandOverride, setExpandOverride] = useState<
    Record<string, boolean>
  >({});
  const [hoverNode, setHoverNode] = useState<Flat | null>(null);

  /* persistence ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(EXPAND_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object")
          setExpandOverride(parsed as Record<string, boolean>);
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(EXPAND_KEY, JSON.stringify(expandOverride));
  }, [expandOverride, hydrated]);

  /* scroll restoration */
  useEffect(() => {
    if (!hydrated || !scrollRef.current) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = Number(saved);
      if (Number.isFinite(y)) scrollRef.current.scrollTop = y;
    }
  }, [hydrated]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    function save() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(SCROLL_KEY, String(el!.scrollTop));
      });
    }
    el.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", save);
    };
  }, []);

  /* default expansion: events / root expanded; movements collapsed. */
  const defaultExpanded = useCallback(
    (n: LineageNode) => n.kind !== "movement",
    []
  );
  const isExpanded = useCallback(
    (n: LineageNode) =>
      n.id in expandOverride ? expandOverride[n.id] : defaultExpanded(n),
    [expandOverride, defaultExpanded]
  );

  /* flatten ─────────────────────────────────────────────────────── */
  const flat = useMemo<Flat[]>(() => {
    const out: Flat[] = [];
    function walk(
      n: LineageNode,
      depth: number,
      ancestors: string[]
    ): void {
      if (isFilteredOut(n, filter)) return;

      const sortedChildren = [...(n.children ?? [])].sort((a, b) => {
        const ya = typeof a.year === "number" ? a.year : 9999;
        const yb = typeof b.year === "number" ? b.year : 9999;
        if (ya !== yb) return ya - yb;
        return a.label.localeCompare(b.label);
      });

      const visibleChildren = sortedChildren.filter(
        (c) => !isFilteredOut(c, filter)
      );
      const childCount = visibleChildren.length;
      const visiblePhotographerCount = countVisiblePhotographers(n, filter);
      const expanded = isExpanded(n);

      out.push({
        node: n,
        depth,
        hasChildren: childCount > 0,
        childCount,
        visiblePhotographerCount,
        expanded,
        ancestorIds: ancestors,
      });

      if (childCount > 0 && expanded) {
        const next = [...ancestors, n.id];
        for (const c of visibleChildren) walk(c, depth + 1, next);
      }
    }
    walk(root, 0, []);
    return out;
  }, [root, filter, isExpanded]);

  /* hover ancestor highlight: precompute Set for O(1) lookup */
  const ancestorSet = useMemo<Set<string>>(() => {
    if (!hoverNode) return new Set();
    return new Set([...hoverNode.ancestorIds, hoverNode.node.id]);
  }, [hoverNode]);

  /* actions ─────────────────────────────────────────────────────── */
  function toggle(id: string, currently: boolean) {
    setExpandOverride((prev) => ({ ...prev, [id]: !currently }));
  }
  function expandAll() {
    const next: Record<string, boolean> = {};
    (function w(n: LineageNode) {
      if (n.children?.length) next[n.id] = true;
      n.children?.forEach(w);
    })(root);
    setExpandOverride(next);
  }
  function collapseAll() {
    const next: Record<string, boolean> = {};
    (function w(n: LineageNode) {
      if (n.kind === "movement") next[n.id] = false;
      n.children?.forEach(w);
    })(root);
    setExpandOverride(next);
  }
  function navigate(n: LineageNode) {
    if (n.kind === "movement" && n.refId) {
      router.push(`/movements/${n.refId}`, { scroll: false });
    } else if (n.kind === "photographer" && n.refId) {
      router.push(`/p/${n.refId}`, { scroll: false });
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 border-b border-rule px-4 h-9 text-[10px] tracking-[0.18em] uppercase font-display bg-bg/95">
        <span className="text-ink-3 tabular-nums">
          {t("lineage.nodes", { n: flat.length })}
        </span>
        <span className="text-ink-3 hidden md:inline normal-case tracking-normal text-[11px]">
          {t("lineage.hint")}
        </span>
        <div className="flex-1" />
        <div className="inline-flex border border-rule">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 h-7 hover:text-ink hover:bg-bg-2 transition-colors border-r border-rule"
          >
            {t("lineage.expandAll")}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 h-7 hover:text-ink hover:bg-bg-2 transition-colors"
          >
            {t("lineage.collapseAll")}
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      >
        <div role="tree" aria-label="lineage tree">
          {flat.map((f) => (
            <Row
              key={f.node.id}
              flat={f}
              locale={locale}
              t={t}
              ancestor={ancestorSet.has(f.node.id) && hoverNode?.node.id !== f.node.id}
              hovered={hoverNode?.node.id === f.node.id}
              onHover={(on) => setHoverNode(on ? f : null)}
              onToggle={() => toggle(f.node.id, f.expanded)}
              onNavigate={() => navigate(f.node)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────────────────── */

function Row({
  flat,
  locale,
  t,
  ancestor,
  hovered,
  onHover,
  onToggle,
  onNavigate,
}: {
  flat: Flat;
  locale: "zh" | "en";
  t: ReturnType<typeof useT>;
  ancestor: boolean;
  hovered: boolean;
  onHover: (on: boolean) => void;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const { node, depth, hasChildren, expanded, visiblePhotographerCount } =
    flat;

  /* node visuals ───────────────────────────────────────────────── */
  let label = node.label;
  let badge = "·";
  let color = "var(--color-ink-2)";
  let detail: string | null = null;
  let interactive = false;

  if (node.kind === "root") {
    badge = "◉";
    color = "var(--color-accent)";
  } else if (node.kind === "event") {
    badge = "◇";
    // strip leading "1839 · " — already shown in year column
    label = label.replace(/^\s*\d{4}\s*[·•]\s*/, "");
  } else if (node.kind === "movement") {
    badge = "◆";
    interactive = true;
    const m = node.refId ? getMovement(node.refId) : undefined;
    if (m) {
      label = getMovementName(m, locale);
      color = m.color;
    }
  } else if (node.kind === "photographer") {
    badge = "●";
    interactive = true;
    const p = node.refId ? getPhotographer(node.refId) : undefined;
    if (p) {
      label = getPhotographerName(p, locale);
      const m = getMovement(p.movements[0]);
      if (m) color = m.color;
      const dieMark = p.died ?? (locale === "en" ? "present" : "今");
      detail = `${p.born}–${dieMark}`;
    }
  }

  /* keyboard support: Enter navigates, Space toggles */
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter") {
      if (interactive) onNavigate();
    } else if (e.key === " " || e.key === "Spacebar") {
      if (hasChildren) {
        e.preventDefault();
        onToggle();
      }
    } else if (e.key === "ArrowRight" && hasChildren && !expanded) {
      e.preventDefault();
      onToggle();
    } else if (e.key === "ArrowLeft" && hasChildren && expanded) {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={false}
      tabIndex={interactive || hasChildren ? 0 : -1}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onKeyDown={onKeyDown}
      className={clsx(
        "group flex items-stretch border-b border-rule/40 outline-none",
        "focus-visible:bg-bg-elev focus-visible:ring-1 focus-visible:ring-accent/60",
        hovered && "bg-bg-elev",
        ancestor && "bg-bg-elev/50"
      )}
      style={{ height: ROW_H }}
    >
      {/* Year column */}
      <div
        className="shrink-0 flex items-center justify-end pr-3 border-r border-rule text-[11px] font-mono tabular-nums text-ink-3"
        style={{ width: YEAR_W }}
      >
        {typeof node.year === "number" ? node.year : ""}
      </div>

      {/* Indent guide rails */}
      {Array.from({ length: depth }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={clsx(
            "shrink-0 border-r",
            ancestor || hovered
              ? "border-accent/40"
              : "border-rule/25"
          )}
          style={{ width: INDENT }}
        />
      ))}

      {/* Chevron toggle (or placeholder) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggle();
        }}
        aria-label={expanded ? "collapse" : "expand"}
        tabIndex={-1}
        className={clsx(
          "shrink-0 w-7 h-full flex items-center justify-center text-ink-3 hover:text-ink",
          !hasChildren && "pointer-events-none opacity-0"
        )}
      >
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="none"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 140ms ease-out",
          }}
        >
          <path
            d="M2.5 1.5 L6 4.5 L2.5 7.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Body — clickable for navigate */}
      <div
        onClick={() => interactive && onNavigate()}
        className={clsx(
          "flex-1 min-w-0 flex items-center gap-2 pr-4",
          interactive && "cursor-pointer"
        )}
        title={node.label}
      >
        <span
          aria-hidden="true"
          style={{ color }}
          className="font-display text-[12px] shrink-0 w-3 text-center tabular-nums"
        >
          {badge}
        </span>
        <span
          className={clsx(
            "font-display text-[13px] truncate",
            node.kind === "root"
              ? "text-accent"
              : node.kind === "event"
                ? "text-ink-2"
                : "text-ink",
            interactive && "group-hover:text-accent transition-colors"
          )}
          style={
            node.kind === "movement" ? { color } : undefined
          }
        >
          {label}
        </span>
        {detail && (
          <span className="font-mono text-[10px] tabular-nums text-ink-3 shrink-0">
            {detail}
          </span>
        )}
        {node.kind === "movement" && visiblePhotographerCount > 0 && (
          <span
            className={clsx(
              "ml-auto shrink-0 inline-flex items-center gap-1 px-1.5 h-5 border text-[10px] font-mono tabular-nums",
              "border-rule text-ink-3 bg-bg-elev/40"
            )}
          >
            <span className="tabular-nums">{visiblePhotographerCount}</span>
            <span>{t("lineage.figures")}</span>
          </span>
        )}
      </div>
    </div>
  );
}
