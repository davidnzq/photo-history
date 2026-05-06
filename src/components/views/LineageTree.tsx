"use client";

/**
 * LineageTree — phylogenetic-style time-tree (SVG).
 *
 * 设计:
 *   x = 树深度 × COL_W (~80 节点列, depth ≤ 10 → ~800px, 一屏放下)
 *   y = 非对称(分段线性)时间轴: 1820–1900 稀疏期压缩, 1900–1970 高峰期
 *       拉伸, 1970–现今居中. 摄影/事件/流派/摄影师都按各自年份纵向定位.
 *   edges = parent → child cubic-bezier, 直接呈现"传承"关系
 *
 * 解决了之前两版的核心问题:
 *   - 旧 SVG (按 leaf-count 横向铺开): 78 leaf × ~80 = 6000+px, 必出
 *     横向滚 + 标签在窄槽位重叠 + sticky 年轴亚像素错位.
 *   - 上一版纵向缩进树: 信息密度高但失去"树"的视觉,时间维度只在年份
 *     列里反映, 看不出时间间距.
 *
 * 这里两个维度都按数据语义分配: x=世代, y=年份(非对称). leaf 不再
 * 抢横向槽位; 同代兄弟在 y 方向自然分散; 时间轴 visually compresses
 * 死亡空白期 (1820–1900 整 80 年压在 120px, 而 1900–1970 70 年得到
 * 420px), 整棵树一屏(纵向偶尔滚)看到, 横向 ~900px 一屏可见.
 *
 * 兼容: §2 gesture-conflicts (无强制横向滚)、§5 horizontal-scroll
 * 尽量不出现、§5 visual-hierarchy (时间+世代双正交编码)、§8 progressive-
 * disclosure (流派可折叠收纳麾下摄影师)、§10 chart axis-readability.
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

const YEAR_AXIS_W = 56;
const COL_W_MIN = 96;     // 每代深度列宽下限
const COL_W_MAX = 168;    // 上限 (大屏不至于过散)
const NODE_R = 4;         // 节点半径
const NODE_GAP = 30;      // 兄弟节点最小垂直间距 — 更松散
const TOP_PAD = 32;
const BOTTOM_PAD = 48;
const RIGHT_PAD = 24;
const LABEL_OFFSET = 10;  // node 圆心到文字起点
const LABEL_MAX_W = 240;  // 末端 label 最长 — 容下名字+生卒年份内联

const EXPAND_KEY = "lineage-expanded-v4";
const SCROLL_KEY = "lineage-scroll-v4";

/** Piece-wise linear time scale: sparse periods compressed, dense expanded.
 * 较上一版整体 ×1.5 拉伸, 让密集年代有足够呼吸空间. */
const SEGMENTS: Array<{ from: number; to: number; pxPerYear: number }> = [
  { from: 1820, to: 1900, pxPerYear: 2.2 },  // origins / chemical era
  { from: 1900, to: 1970, pxPerYear: 9.0 },  // modernist peak
  { from: 1970, to: 2030, pxPerYear: 6.0 },  // contemporary
];
function scaleY(year: number): number {
  let y = TOP_PAD;
  for (const s of SEGMENTS) {
    if (year <= s.from) return y;
    if (year >= s.to) {
      y += (s.to - s.from) * s.pxPerYear;
      continue;
    }
    y += (year - s.from) * s.pxPerYear;
    return y;
  }
  return y;
}

function isFilteredOut(n: LineageNode, filter: FilterState): boolean {
  if (n.kind === "photographer" && n.refId) {
    const ph = getPhotographer(n.refId);
    if (ph && !passes(ph, filter)) return true;
  }
  if (n.kind === "movement" && n.refId) {
    if (filter.movementIds.length && !filter.movementIds.includes(n.refId))
      return true;
  }
  return false;
}

function countVisiblePhotographers(
  n: LineageNode,
  filter: FilterState
): number {
  if (isFilteredOut(n, filter)) return 0;
  let c = n.kind === "photographer" ? 1 : 0;
  if (n.children)
    for (const ch of n.children) c += countVisiblePhotographers(ch, filter);
  return c;
}

export function LineageTree(props: Props) {
  return (
    <Suspense fallback={null}>
      <LineageTreeInner {...props} />
    </Suspense>
  );
}

type Placed = {
  node: LineageNode;
  depth: number;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
  visiblePhotographerCount: number;
  hasChildren: boolean;
  expanded: boolean;
  ancestorIds: string[];
};

function LineageTreeInner({ root }: Props) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const sp = useSearchParams();
  const filter = useMemo(() => parseFilter(sp), [sp]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [viewportW, setViewportW] = useState(1280);
  const [hydrated, setHydrated] = useState(false);
  const [expandOverride, setExpandOverride] = useState<
    Record<string, boolean>
  >({});
  const [hoverId, setHoverId] = useState<string | null>(null);

  /* viewport tracking ──────────────────────────────────────── */
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setViewportW(Math.max(640, Math.floor(e.contentRect.width)));
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  /* persistence ─────────────────────────────────────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(EXPAND_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object")
          setExpandOverride(parsed as Record<string, boolean>);
      } catch {}
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(EXPAND_KEY, JSON.stringify(expandOverride));
  }, [expandOverride, hydrated]);
  useEffect(() => {
    if (!hydrated || !scrollRef.current) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const [x, y] = saved.split(",").map(Number);
      if (Number.isFinite(x)) scrollRef.current.scrollLeft = x;
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
        sessionStorage.setItem(
          SCROLL_KEY,
          `${el!.scrollLeft},${el!.scrollTop}`
        );
      });
    }
    el.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", save);
    };
  }, []);

  /* expansion default: events & root expanded; movements expanded by
     default in this view too (tree-curves benefit from showing connections);
     user can collapse to focus. */
  const defaultExpanded = useCallback(() => true, []);
  const isExpanded = useCallback(
    (n: LineageNode) =>
      n.id in expandOverride ? expandOverride[n.id] : defaultExpanded(),
    [expandOverride, defaultExpanded]
  );

  /* ── layout ──────────────────────────────────────────────── */
  const layout = useMemo(() => {
    // Pre-pass: compute max visible depth for COL_W derivation.
    let maxVisibleDepth = 0;
    (function depthWalk(n: LineageNode, depth: number) {
      if (isFilteredOut(n, filter)) return;
      maxVisibleDepth = Math.max(maxVisibleDepth, depth);
      if (!isExpanded(n)) return;
      for (const c of n.children ?? []) depthWalk(c, depth + 1);
    })(root, 0);

    // 自适应 COL_W: 让最深叶子刚好顶到 viewport 右边 (减去标签 + 右内边距).
    const usable = Math.max(
      640,
      viewportW - YEAR_AXIS_W - 16 - LABEL_MAX_W - RIGHT_PAD
    );
    const colW = Math.max(
      COL_W_MIN,
      Math.min(COL_W_MAX, usable / Math.max(1, maxVisibleDepth))
    );

    const placed: Placed[] = [];

    // Pass 1: walk tree, compute depth + ideal y; collect.
    function walk(
      n: LineageNode,
      depth: number,
      parent: Placed | null,
      ancestors: string[],
      inheritedYear: number
    ) {
      if (isFilteredOut(n, filter)) return;
      const year =
        typeof n.year === "number" ? n.year : inheritedYear;
      const x = YEAR_AXIS_W + 16 + depth * colW;
      const y = scaleY(year);
      const expanded = isExpanded(n);

      const sortedChildren = [...(n.children ?? [])]
        .filter((c) => !isFilteredOut(c, filter))
        .sort((a, b) => {
          const ya = typeof a.year === "number" ? a.year : 9999;
          const yb = typeof b.year === "number" ? b.year : 9999;
          if (ya !== yb) return ya - yb;
          return a.label.localeCompare(b.label);
        });

      const me: Placed = {
        node: n,
        depth,
        x,
        y,
        parentX: parent?.x,
        parentY: parent?.y,
        visiblePhotographerCount: countVisiblePhotographers(n, filter),
        hasChildren: sortedChildren.length > 0,
        expanded,
        ancestorIds: ancestors,
      };
      placed.push(me);

      if (expanded) {
        const next = [...ancestors, n.id];
        for (const c of sortedChildren)
          walk(c, depth + 1, me, next, year);
      }
    }
    walk(root, 0, null, [], 1820);

    // Group helpers (re-used per iteration).
    const byParent = new Map<string, Placed[]>();
    const byDepth = new Map<number, Placed[]>();
    for (const p of placed) {
      const pid = p.ancestorIds[p.ancestorIds.length - 1] ?? "__root__";
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid)!.push(p);
      if (!byDepth.has(p.depth)) byDepth.set(p.depth, []);
      byDepth.get(p.depth)!.push(p);
    }
    const byId = new Map(placed.map((p) => [p.node.id, p]));

    // Top-down enforce: child.y >= parent.y + NODE_GAP/2 (temporal
    // coherence — keeps ancestors-up, descendants-down).
    function enforceTopDown(p: Placed) {
      for (const k of byParent.get(p.node.id) ?? []) {
        const minY = p.y + NODE_GAP * 0.5;
        if (k.y < minY) k.y = minY;
        enforceTopDown(k);
      }
    }
    const rootPlaced = byId.get(root.id);

    // Iterative relaxation: alternates 3 constraints until stable.
    //   1) per-parent sibling spacing (siblings under same parent
    //      in birth-year order with min gap)
    //   2) per-DEPTH global spacing (cross-parent same-depth
    //      collisions — the bug we're fixing now)
    //   3) top-down: child below parent
    for (let iter = 0; iter < 5; iter++) {
      for (const siblings of byParent.values()) {
        siblings.sort((a, b) => a.y - b.y);
        let prevY = -Infinity;
        for (const s of siblings) {
          if (s.y < prevY + NODE_GAP) s.y = prevY + NODE_GAP;
          prevY = s.y;
        }
      }
      if (rootPlaced) enforceTopDown(rootPlaced);
      for (const sameDepth of byDepth.values()) {
        sameDepth.sort((a, b) => a.y - b.y);
        let prevY = -Infinity;
        for (const s of sameDepth) {
          if (s.y < prevY + NODE_GAP) s.y = prevY + NODE_GAP;
          prevY = s.y;
        }
      }
    }

    // FINAL step: reconnect parentX/Y to the parents' final positions
    // so that bezier endpoints anchor to where parent dots actually render.
    // Must be LAST — any earlier sweep will move parents and stale these.
    for (const p of placed) {
      const parentId = p.ancestorIds[p.ancestorIds.length - 1];
      if (parentId) {
        const par = byId.get(parentId);
        if (par) {
          p.parentX = par.x;
          p.parentY = par.y;
        }
      }
    }

    const maxDepth = placed.reduce((m, p) => Math.max(m, p.depth), 0);
    const maxY = placed.reduce((m, p) => Math.max(m, p.y), TOP_PAD);
    const treeWidth =
      YEAR_AXIS_W + 16 + maxDepth * colW + LABEL_MAX_W + RIGHT_PAD;
    const treeHeight = maxY + BOTTOM_PAD;

    return { placed, treeWidth, treeHeight, maxDepth, byId, colW };
  }, [root, filter, isExpanded, viewportW]);

  /* hover ancestor highlight */
  const hoverAncestors = useMemo<Set<string>>(() => {
    if (!hoverId) return new Set();
    const hp = layout.byId.get(hoverId);
    if (!hp) return new Set();
    return new Set([...hp.ancestorIds, hp.node.id]);
  }, [hoverId, layout]);

  /* actions ─────────────────────────────────────────────────── */
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
  function collapseMovements() {
    const next: Record<string, boolean> = {};
    (function w(n: LineageNode) {
      if (n.kind === "movement") next[n.id] = false;
      n.children?.forEach(w);
    })(root);
    setExpandOverride(next);
  }
  function navigate(n: LineageNode) {
    if (n.kind === "movement" && n.refId)
      router.push(`/movements/${n.refId}`, { scroll: false });
    else if (n.kind === "photographer" && n.refId)
      router.push(`/p/${n.refId}`, { scroll: false });
  }

  return (
    <div ref={wrapperRef} className="absolute inset-0 flex flex-col">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 border-b border-rule px-4 h-9 text-[10px] tracking-[0.18em] uppercase font-display bg-bg/95">
        <span className="text-ink-3 tabular-nums">
          {t("lineage.nodes", { n: layout.placed.length })}
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
            onClick={collapseMovements}
            className="px-3 h-7 hover:text-ink hover:bg-bg-2 transition-colors"
          >
            {t("lineage.collapseAll")}
          </button>
        </div>
      </div>

      {/* ── SVG canvas with sticky-left year axis ─────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto relative"
      >
        <div
          className="flex relative"
          style={{
            width: layout.treeWidth,
            height: layout.treeHeight,
          }}
        >
          {/* Year axis sticky-left so it remains visible while scrolling. */}
          <div
            className="sticky left-0 z-20 bg-bg/95 backdrop-blur-sm border-r border-rule shrink-0"
            style={{ width: YEAR_AXIS_W, height: layout.treeHeight }}
            aria-hidden="true"
          >
            <svg
              width={YEAR_AXIS_W}
              height={layout.treeHeight}
              className="block select-none"
            >
              <YearAxis height={layout.treeHeight} />
            </svg>
          </div>

          {/* Tree (SVG) */}
          <svg
            width={layout.treeWidth - YEAR_AXIS_W}
            height={layout.treeHeight}
            viewBox={`${YEAR_AXIS_W} 0 ${layout.treeWidth - YEAR_AXIS_W} ${layout.treeHeight}`}
            className="block select-none"
          >
            {/* Edges */}
            {layout.placed.map((p) => {
              if (p.parentX === undefined || p.parentY === undefined)
                return null;
              const x1 = p.parentX;
              const y1 = p.parentY;
              const x2 = p.x;
              const y2 = p.y;
              // smooth horizontal bezier
              const dx = (x2 - x1) * 0.5;
              const path = `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
              const isOnPath =
                hoverAncestors.has(p.node.id) &&
                hoverAncestors.has(p.ancestorIds[p.ancestorIds.length - 1] ?? "");
              return (
                <path
                  key={`e-${p.node.id}`}
                  d={path}
                  fill="none"
                  stroke={
                    isOnPath
                      ? "var(--color-accent)"
                      : "rgba(170,160,140,0.32)"
                  }
                  strokeWidth={isOnPath ? 1.6 : 1}
                  shapeRendering="geometricPrecision"
                />
              );
            })}

            {/* Nodes */}
            {layout.placed.map((p) => (
              <NodeView
                key={p.node.id}
                placed={p}
                locale={locale}
                hovered={hoverId === p.node.id}
                ancestor={
                  hoverAncestors.has(p.node.id) && hoverId !== p.node.id
                }
                t={t}
                onHover={(on) => setHoverId(on ? p.node.id : null)}
                onClick={() => navigate(p.node)}
                onToggle={() => toggle(p.node.id, p.expanded)}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ── Year axis (non-linear) ─────────────────────────────────── */

function YearAxis({ height }: { height: number }) {
  // Major ticks every 25 years, minor every 5; labels every 25.
  const ticks: { year: number; major: boolean }[] = [];
  for (const s of SEGMENTS) {
    const minorStep = s.pxPerYear < 3 ? 25 : s.pxPerYear < 5 ? 10 : 5;
    const startMinor = Math.ceil(s.from / minorStep) * minorStep;
    for (let y = startMinor; y <= s.to; y += minorStep) {
      ticks.push({ year: y, major: y % 25 === 0 });
    }
  }
  return (
    <g>
      <line
        x1={YEAR_AXIS_W - 0.5}
        x2={YEAR_AXIS_W - 0.5}
        y1={TOP_PAD - 8}
        y2={height - 8}
        stroke="var(--color-rule-2)"
        shapeRendering="crispEdges"
      />
      {ticks.map((t) => {
        const yy = scaleY(t.year);
        return (
          <g key={t.year}>
            <line
              x1={YEAR_AXIS_W - (t.major ? 12 : 6)}
              x2={YEAR_AXIS_W}
              y1={yy}
              y2={yy}
              stroke={
                t.major ? "var(--color-rule-2)" : "var(--color-rule)"
              }
              shapeRendering="crispEdges"
            />
            {t.major && (
              <text
                x={YEAR_AXIS_W - 16}
                y={yy + 3}
                fontSize={10}
                textAnchor="end"
                className="font-mono tabular-nums"
                fill="var(--color-ink-3)"
              >
                {t.year}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ── Node ──────────────────────────────────────────────────── */

function NodeView({
  placed,
  locale,
  hovered,
  ancestor,
  t,
  onHover,
  onClick,
  onToggle,
}: {
  placed: Placed;
  locale: "zh" | "en";
  hovered: boolean;
  ancestor: boolean;
  t: ReturnType<typeof useT>;
  onHover: (on: boolean) => void;
  onClick: () => void;
  onToggle: () => void;
}) {
  const { node, x, y, hasChildren, expanded, visiblePhotographerCount } =
    placed;

  let label = node.label;
  let color = "var(--color-ink-2)";
  let interactive = false;
  let detail: string | null = null;
  let badgeFill = "transparent";

  if (node.kind === "root") {
    color = "var(--color-accent)";
    badgeFill = "var(--color-accent)";
  } else if (node.kind === "event") {
    color = "var(--color-ink-2)";
    label = label.replace(/^\s*\d{4}\s*[·•]\s*/, "");
  } else if (node.kind === "movement") {
    interactive = true;
    const m = node.refId ? getMovement(node.refId) : undefined;
    if (m) {
      label = getMovementName(m, locale);
      color = m.color;
      badgeFill = m.color;
    }
  } else if (node.kind === "photographer") {
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

  const r = hovered ? NODE_R + 1 : NODE_R;
  const labelOpacity = hovered ? 1 : ancestor ? 0.95 : 0.85;
  const isMovementCollapsible = node.kind === "movement" && hasChildren;

  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: interactive ? "pointer" : undefined }}
    >
      {/* Hit area for node + label */}
      <rect
        x={-LABEL_OFFSET}
        y={-NODE_GAP / 2}
        width={LABEL_OFFSET + LABEL_MAX_W}
        height={NODE_GAP}
        fill="transparent"
        onClick={interactive ? onClick : undefined}
      />

      {/* Marker */}
      <circle
        cx={0}
        cy={0}
        r={r}
        fill={badgeFill === "transparent" ? "var(--color-bg)" : badgeFill}
        stroke={color}
        strokeWidth={hovered || ancestor ? 1.5 : 1}
      />
      {node.kind === "event" && (
        <circle
          cx={0}
          cy={0}
          r={r - 2}
          fill="var(--color-bg)"
          opacity={0.85}
        />
      )}

      {/* Toggle for movement (small chevron sitting on the marker for collapsibility) */}
      {isMovementCollapsible && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          style={{ cursor: "pointer" }}
        >
          <circle
            cx={-12}
            cy={0}
            r={6}
            fill="var(--color-bg)"
            stroke={color}
            strokeWidth={1}
            opacity={hovered || ancestor ? 1 : 0.55}
          />
          <path
            d={
              expanded
                ? "M -14.5,-1.5 L -12,1 L -9.5,-1.5"
                : "M -13.5,-3 L -10.5,0 L -13.5,3"
            }
            stroke={color}
            strokeWidth={1.25}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={hovered || ancestor ? 1 : 0.55}
          />
        </g>
      )}

      {/* Label (right of marker) — name + 内联 detail (生卒/计数) */}
      <text
        x={LABEL_OFFSET}
        y={4}
        fontSize={node.kind === "root" ? 12 : 11}
        fontWeight={
          node.kind === "movement" || node.kind === "root" ? 600 : 400
        }
        fill="var(--color-ink)"
        opacity={labelOpacity}
        className="font-display"
        style={{ pointerEvents: "none" }}
      >
        <tspan>{truncate(label, node.kind === "event" ? 16 : 12)}</tspan>
        {detail && (
          <tspan
            dx={6}
            fontSize={9}
            fontWeight={400}
            fill="var(--color-ink-3)"
            style={{ fontFamily: "var(--font-mono, ui-monospace)" }}
          >
            {detail}
          </tspan>
        )}
        {!detail &&
          node.kind === "movement" &&
          visiblePhotographerCount > 0 && (
            <tspan
              dx={6}
              fontSize={9}
              fontWeight={400}
              fill="var(--color-ink-3)"
              style={{ fontFamily: "var(--font-mono, ui-monospace)" }}
            >
              {`${visiblePhotographerCount} ${t("lineage.figures")}`}
            </tspan>
          )}
      </text>

      <title>
        {`${label}${detail ? " · " + detail : ""}${
          !detail &&
          node.kind === "movement" &&
          visiblePhotographerCount > 0
            ? ` · ${visiblePhotographerCount} ${t("lineage.figures")}`
            : ""
        }`}
      </title>
    </g>
  );
}

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : text.slice(0, maxChars - 1) + "…";
}
