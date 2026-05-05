"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { scaleLinear } from "d3-scale";
import { clsx } from "clsx";
import type { LineageNode } from "@/lib/types";
import { getMovement, getPhotographer } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { parseFilter, passes } from "@/lib/filter";

type Props = { root: LineageNode };

export function LineageTree(props: Props) {
  return (
    <Suspense fallback={null}>
      <LineageTreeInner {...props} />
    </Suspense>
  );
}

/* ── 设计常量 (per §6 spacing-scale, §10 chart consistency) ──── */
const YEAR_AXIS_W = 64;        // 年份轴列宽 (固定 64,避免 5/6 px 偏差)
const NODE_PAD_X = 8;          // 节点容器内左右内边距
const LEAF_W = 132;            // 单叶 (photographer) 节点列宽 — 容下 12px 文字 + 年份
const MIN_LEAF_W = 96;         // 视口很窄时的最小叶宽
const TOP_PAD = 24;            // 顶部留白
const BOTTOM_PAD = 32;
const MIN_PX_PER_YEAR = 4;
const MAX_PX_PER_YEAR = 16;
const DEFAULT_PX_PER_YEAR = 7;
const SCROLL_KEY = "lineage-scroll";
const DENSITY_KEY = "lineage-density";

type Placed = {
  node: LineageNode;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
  /** 是否被全局筛选隐藏 */
  hidden: boolean;
};

function LineageTreeInner({ root }: Props) {
  const router = useRouter();
  const t = useT();
  const sp = useSearchParams();
  const filter = useMemo(() => parseFilter(sp), [sp]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState(1200);
  const [vh, setVh] = useState(700);
  const [pxPerYear, setPxPerYear] = useState(DEFAULT_PX_PER_YEAR);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* viewport tracking */
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) {
        setVw(Math.max(640, Math.floor(e.contentRect.width)));
        setVh(Math.max(480, Math.floor(e.contentRect.height)));
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  /* density restoration */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(DENSITY_KEY);
    const parsed = saved ? parseFloat(saved) : NaN;
    if (
      Number.isFinite(parsed) &&
      parsed >= MIN_PX_PER_YEAR &&
      parsed <= MAX_PX_PER_YEAR
    ) {
      setPxPerYear(parsed);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(DENSITY_KEY, pxPerYear.toFixed(2));
  }, [pxPerYear, hydrated]);

  /* scroll restoration */
  useEffect(() => {
    if (!hydrated || !scrollRef.current) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;
    const [x, y] = saved.split(",").map(Number);
    if (Number.isFinite(x)) scrollRef.current.scrollLeft = x;
    if (Number.isFinite(y)) scrollRef.current.scrollTop = y;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const target = el;
    function save() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(
          SCROLL_KEY,
          `${target.scrollLeft},${target.scrollTop}`
        );
      });
    }
    el.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", save);
    };
  }, []);

  /* ── compute layout ─────────────────────────────────────────── */
  const layout = useMemo(
    () => layoutLineage(root, filter, vw, pxPerYear),
    [root, filter, vw, pxPerYear]
  );

  /* ── ⌘+wheel zoom 同步 Timeline 的语义 ─────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY / 500);
      setPxPerYear((v) =>
        Math.max(MIN_PX_PER_YEAR, Math.min(MAX_PX_PER_YEAR, v * factor))
      );
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function densityIn() {
    setPxPerYear((v) => Math.min(MAX_PX_PER_YEAR, v * 1.25));
  }
  function densityOut() {
    setPxPerYear((v) => Math.max(MIN_PX_PER_YEAR, v / 1.25));
  }
  function densityReset() {
    setPxPerYear(DEFAULT_PX_PER_YEAR);
  }

  return (
    <div ref={wrapperRef} className="absolute inset-0 flex flex-col">
      {/* SCROLL CONTAINER: 垂直滚动 (主) + 水平滚动 (按需). 年份轴贴左. */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto relative"
      >
        <div
          className="flex"
          style={{
            width: YEAR_AXIS_W + layout.treeWidth,
            height: layout.treeHeight,
          }}
        >
          {/* ── Year axis: position:sticky;left:0 — 始终贴视口左边 ── */}
          <div
            className="sticky left-0 z-20 bg-bg/95 backdrop-blur-sm border-r border-rule shrink-0"
            style={{ width: YEAR_AXIS_W, height: layout.treeHeight }}
          >
            <svg
              width={YEAR_AXIS_W}
              height={layout.treeHeight}
              className="block select-none"
            >
              <YearAxis
                yScale={layout.yScale}
                domain={layout.yearDomain}
                pxPerYear={pxPerYear}
              />
            </svg>
          </div>

          {/* ── Tree content ─────────────────────────────────── */}
          <svg
            width={layout.treeWidth}
            height={layout.treeHeight}
            className="block select-none"
          >
            {/* Edges */}
            {layout.placed.map((p) => {
              if (
                p.parentX === undefined ||
                p.parentY === undefined ||
                p.hidden
              )
                return null;
              const midY = (p.parentY + p.y) / 2;
              const path = `M ${p.parentX},${p.parentY} C ${p.parentX},${midY} ${p.x},${midY} ${p.x},${p.y}`;
              const isOnHoverPath =
                hoverId !== null && hoverId === p.node.id;
              return (
                <path
                  key={`edge-${p.node.id}`}
                  d={path}
                  fill="none"
                  stroke={
                    isOnHoverPath
                      ? "var(--color-accent)"
                      : "rgba(170,160,140,0.28)"
                  }
                  strokeWidth={isOnHoverPath ? 1.5 : 1}
                  shapeRendering="geometricPrecision"
                />
              );
            })}

            {/* Nodes */}
            {layout.placed.map((p) =>
              p.hidden ? null : (
                <LineageNodeView
                  key={p.node.id}
                  placed={p}
                  hovered={hoverId === p.node.id}
                  onHover={(on) => setHoverId(on ? p.node.id : null)}
                  onClick={() => {
                    if (p.node.kind === "movement" && p.node.refId)
                      router.push(`/movements/${p.node.refId}`, {
                        scroll: false,
                      });
                    if (p.node.kind === "photographer" && p.node.refId)
                      router.push(`/p/${p.node.refId}`, { scroll: false });
                  }}
                />
              )
            )}
          </svg>
        </div>
      </div>

      {/* ── Density controls (年份密度,同 Timeline 同款样式) ─── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-ink-3 font-display">
        <div
          className="inline-flex border border-rule bg-bg/80 backdrop-blur-sm"
          role="group"
          aria-label="density"
        >
          <button
            type="button"
            onClick={densityOut}
            aria-label="zoom out"
            className="w-7 h-7 flex items-center justify-center hover:text-ink hover:bg-bg-2 transition-colors disabled:opacity-30"
            disabled={pxPerYear <= MIN_PX_PER_YEAR + 0.01}
          >
            −
          </button>
          <button
            type="button"
            onClick={densityReset}
            className="px-2 h-7 flex items-center hover:text-ink hover:bg-bg-2 transition-colors border-x border-rule tabular-nums"
            title={t("hint.reset")}
          >
            {(pxPerYear / DEFAULT_PX_PER_YEAR * 100).toFixed(0)}%
          </button>
          <button
            type="button"
            onClick={densityIn}
            aria-label="zoom in"
            className="w-7 h-7 flex items-center justify-center hover:text-ink hover:bg-bg-2 transition-colors disabled:opacity-30"
            disabled={pxPerYear >= MAX_PX_PER_YEAR - 0.01}
          >
            +
          </button>
        </div>
        <span className="hidden sm:inline border border-rule px-2 h-7 flex items-center bg-bg/80 backdrop-blur-sm">
          {t("hint.zoomPan")}
        </span>
      </div>
    </div>
  );
}

/* ── Year axis (rendered as left column) ──────────────────────── */

function YearAxis({
  yScale,
  domain,
  pxPerYear,
}: {
  yScale: (y: number) => number;
  domain: [number, number];
  pxPerYear: number;
}) {
  // 步长按密度自适应:稀疏时 50 年,中等 25 年,密集时 10 年
  const step = pxPerYear < 5 ? 50 : pxPerYear < 9 ? 25 : 10;
  const start = Math.ceil(domain[0] / step) * step;
  const ticks: number[] = [];
  for (let y = start; y <= domain[1]; y += step) ticks.push(y);

  return (
    <g>
      {/* axis spine */}
      <line
        x1={YEAR_AXIS_W - 0.5}
        x2={YEAR_AXIS_W - 0.5}
        y1={TOP_PAD - 8}
        y2={yScale(domain[1]) + 16}
        stroke="var(--color-rule-2)"
        shapeRendering="crispEdges"
      />
      {ticks.map((t) => {
        const yy = yScale(t);
        const isMajor = t % 50 === 0;
        return (
          <g key={t}>
            <line
              x1={YEAR_AXIS_W - (isMajor ? 12 : 8)}
              x2={YEAR_AXIS_W}
              y1={yy}
              y2={yy}
              stroke={isMajor ? "var(--color-rule-2)" : "var(--color-rule)"}
              shapeRendering="crispEdges"
            />
            <text
              x={YEAR_AXIS_W - 16}
              y={yy + 3}
              fontSize={isMajor ? 11 : 10}
              textAnchor="end"
              className="font-mono tabular-nums"
              fill={
                isMajor ? "var(--color-ink-2)" : "var(--color-ink-3)"
              }
            >
              {t}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ── Single node ─────────────────────────────────────────────── */

function LineageNodeView({
  placed,
  hovered,
  onHover,
  onClick,
}: {
  placed: Placed;
  hovered: boolean;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const { node, x, y } = placed;
  const isInteractive =
    node.kind === "movement" || node.kind === "photographer";

  // 颜色与字号体系 (§4 state-clarity, §6 weight-hierarchy)
  let color = "var(--color-ink-2)";
  let fontWeight = 400;
  let fontSize = 11;
  let strokeColor = color;
  let strokeWidth = 1;
  let bg = "var(--color-bg-elev)";
  let badge = "·";
  let detail: string | undefined;

  if (node.kind === "root") {
    color = "var(--color-accent)";
    fontWeight = 600;
    fontSize = 12;
    strokeColor = "var(--color-accent)";
    strokeWidth = 1.5;
    badge = "◉";
    detail = "Photography";
  } else if (node.kind === "event") {
    color = "var(--color-ink-2)";
    strokeColor = "var(--color-rule-2)";
    badge = "◇";
  } else if (node.kind === "movement") {
    const m = node.refId ? getMovement(node.refId) : undefined;
    if (m) {
      color = m.color;
      strokeColor = m.color;
      strokeWidth = 1.25;
      bg = `${m.color}1a`;
      detail = m.nameZh;
    }
    fontWeight = 600;
    badge = "◆";
  } else if (node.kind === "photographer") {
    const p = node.refId ? getPhotographer(node.refId) : undefined;
    if (p) {
      const m = getMovement(p.movements[0]);
      if (m) {
        color = m.color;
        strokeColor = m.color;
      }
      detail = `${p.born}–${p.died ?? "今"}`;
    }
    badge = "●";
  }

  // hover 加亮
  const effBg =
    isInteractive && hovered
      ? node.kind === "movement"
        ? `${color}33`
        : "var(--color-bg-2)"
      : bg;
  const effStrokeOpacity = isInteractive && hovered ? 1 : 0.55;
  const effStrokeWidth = hovered ? strokeWidth + 0.5 : strokeWidth;

  // label 宽度:用 LEAF_W 作上限,内容 fits = node.label * 12 + 24
  const charW = 11; // 中文字符宽 ≈ 11px @ 11pt
  const labelW = Math.min(
    Math.max(node.label.length * charW + 28, 88),
    LEAF_W - NODE_PAD_X * 2
  );
  const h = 22;

  return (
    <g
      transform={`translate(${x - labelW / 2}, ${y - h / 2})`}
      onClick={isInteractive ? onClick : undefined}
      onMouseEnter={isInteractive ? () => onHover(true) : undefined}
      onMouseLeave={isInteractive ? () => onHover(false) : undefined}
      data-node-interactive={isInteractive ? "1" : undefined}
      className={clsx(isInteractive && "cursor-pointer")}
      style={{ transition: "all 140ms ease-out" }}
    >
      <rect
        x={0}
        y={0}
        width={labelW}
        height={h}
        fill={effBg}
        stroke={strokeColor}
        strokeOpacity={effStrokeOpacity}
        strokeWidth={effStrokeWidth}
        shapeRendering="geometricPrecision"
        style={{
          transition: "fill 140ms ease-out, stroke-opacity 140ms ease-out",
        }}
      />
      <text x={9} y={h / 2 + 4} fontSize={fontSize} fill={color}>
        <tspan fontWeight={fontWeight}>{badge}</tspan>
        <tspan
          dx={6}
          fontWeight={fontWeight}
          fill="var(--color-ink)"
          className="font-display"
        >
          {node.label}
        </tspan>
      </text>
      {detail && labelW > 110 && (
        <text
          x={labelW + 6}
          y={h / 2 + 3}
          fontSize={9}
          fill="var(--color-ink-3)"
          className="font-mono tabular-nums"
          letterSpacing={0.5}
        >
          {detail}
        </text>
      )}
      {/* native tooltip for accessibility */}
      {isInteractive && (
        <title>{`${node.label}${detail ? " · " + detail : ""}`}</title>
      )}
    </g>
  );
}

/* ── Layout algorithm ──────────────────────────────────────────── */

import type { FilterState } from "@/lib/types";

function layoutLineage(
  root: LineageNode,
  filter: FilterState,
  viewportW: number,
  pxPerYear: number
): {
  placed: Placed[];
  treeWidth: number;
  treeHeight: number;
  yScale: (y: number) => number;
  yearDomain: [number, number];
} {
  /* hidden 判定: 根据流派/地域筛选, 隐藏摄影师与流派节点 */
  function isHidden(n: LineageNode): boolean {
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

  /* 1. 计算每个节点的 *visible* 叶子数 (隐藏的不算入宽度) */
  const leafCount = new Map<string, number>();
  (function walk(n: LineageNode): number {
    const hidden = isHidden(n);
    if (hidden) {
      leafCount.set(n.id, 0);
      return 0;
    }
    if (!n.children || n.children.length === 0) {
      leafCount.set(n.id, 1);
      return 1;
    }
    let c = 0;
    for (const ch of n.children) c += walk(ch);
    // 即使子节点全隐藏, 自己若是非 photographer 仍占一个槽 (root/event/movement
    // 是结构脊柱) 以保证脊柱可见
    const own = c === 0 ? 1 : c;
    leafCount.set(n.id, own);
    return own;
  })(root);

  /* 2. 收集年份并计算域 */
  const years: number[] = [];
  (function collect(n: LineageNode) {
    if (typeof n.year === "number") years.push(n.year);
    if (n.children) for (const c of n.children) collect(c);
  })(root);
  const yMin = Math.min(...years, 1820) - 6;
  const yMax = Math.max(...years, new Date().getFullYear() - 30) + 8;
  const yearDomain: [number, number] = [yMin, yMax];

  /* 3. 视图垂直高度受 pxPerYear 控制, 水平宽度受 leaf 数量 + 视口下限控制 */
  const totalLeaves = Math.max(1, leafCount.get(root.id) ?? 1);
  // 优先 fit: 如果叶子少, leaf_w 拉大占满;叶子多则用 LEAF_W
  const fitLeafW = (viewportW - YEAR_AXIS_W - 32) / totalLeaves;
  const leafW = Math.max(MIN_LEAF_W, Math.min(LEAF_W, fitLeafW));
  const treeWidth = Math.max(viewportW - YEAR_AXIS_W, totalLeaves * leafW + 48);
  const treeHeight =
    TOP_PAD + (yMax - yMin) * pxPerYear + BOTTOM_PAD;
  const yScale = scaleLinear()
    .domain(yearDomain)
    .range([TOP_PAD, treeHeight - BOTTOM_PAD]);

  /* 4. 后序遍历分配 x */
  const placed: Placed[] = [];
  function place(
    n: LineageNode,
    xStart: number,
    xEnd: number,
    parentX?: number,
    parentY?: number
  ) {
    const x = (xStart + xEnd) / 2;
    const y =
      typeof n.year === "number" ? yScale(n.year as number) : TOP_PAD;
    const hidden = isHidden(n);
    placed.push({ node: n, x, y, parentX, parentY, hidden });
    if (n.children && n.children.length > 0) {
      let cursor = xStart;
      const total = leafCount.get(n.id) ?? 1;
      for (const c of n.children) {
        const cLeaves = Math.max(1, leafCount.get(c.id) ?? 0);
        const cWidth = (cLeaves / total) * (xEnd - xStart);
        place(c, cursor, cursor + cWidth, x, y);
        cursor += cWidth;
      }
    }
  }
  place(root, 24, treeWidth - 24);

  return { placed, treeWidth, treeHeight, yScale, yearDomain };
}
