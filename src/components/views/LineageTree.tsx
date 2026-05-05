"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { scaleLinear } from "d3-scale";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";
import { clsx } from "clsx";
import type { LineageNode } from "@/lib/types";
import { getMovement, getPhotographer } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { parseFilter, passes } from "@/lib/filter";

type Props = { root: LineageNode };

type Placed = {
  node: LineageNode;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
};

export function LineageTree(props: Props) {
  return (
    <Suspense fallback={null}>
      <LineageTreeInner {...props} />
    </Suspense>
  );
}

const MARGIN_X = 80;
const MARGIN_TOP = 80;
const MARGIN_BOTTOM = 60;
const NODE_HEIGHT = 56;
const COLUMN_WIDTH = 120;

function LineageTreeInner({ root }: Props) {
  const router = useRouter();
  const t = useT();
  const sp = useSearchParams();
  const filter = useMemo(() => parseFilter(sp), [sp]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // viewport size (the visible area)
  const [vw, setVw] = useState(1200);
  const [vh, setVh] = useState(700);

  // hover state for node interaction feedback
  const [hoverId, setHoverId] = useState<string | null>(null);

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

  // ── compute layout once per viewport width ─────────────────────
  const layout = useMemo(() => layoutLineage(root, vw), [root, vw]);

  // ── d3-zoom setup ──────────────────────────────────────────────
  // initial transform = "fit to viewport" so the user sees the whole tree
  const initialTransform = useMemo(() => {
    const fit = Math.min(vw / layout.width, vh / layout.height) * 0.95;
    const k = Math.max(0.25, Math.min(1, fit));
    // center horizontally, top-aligned vertically with small offset
    const tx = (vw - layout.width * k) / 2;
    const ty = 16;
    return zoomIdentity.translate(tx, ty).scale(k);
  }, [vw, vh, layout.width, layout.height]);

  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  // apply initial fit when layout changes
  useEffect(() => {
    if (!svgRef.current) return;
    setTransform(initialTransform);
    select(svgRef.current).call(
      zoom<SVGSVGElement, unknown>().transform,
      initialTransform
    );
  }, [initialTransform]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = select(svgRef.current);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .filter((event) => {
        // let clicks on interactive nodes pass through
        const t = event.target as Element;
        if (t.closest("[data-node-interactive]")) return false;
        // 一致性: wheel 仅在 ⌘/Ctrl 按下时触发缩放,与 Timeline 同款
        // (Figma/Miro 标准). 普通拖拽仍可平移视图.
        if (event.type === "wheel") {
          return event.ctrlKey || event.metaKey;
        }
        return event.button === 0;
      })
      .on("zoom", (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(e.transform);
      });
    svg.call(z);
    // wire current transform so subsequent gestures continue from latest
    svg.call(z.transform, transform);
    return () => {
      svg.on(".zoom", null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vw, vh]);

  function resetZoom() {
    if (!svgRef.current) return;
    select(svgRef.current).call(
      zoom<SVGSVGElement, unknown>().transform,
      initialTransform
    );
    setTransform(initialTransform);
  }

  return (
    <div ref={wrapperRef} className="absolute inset-0 overflow-hidden">
      <svg
        ref={svgRef}
        width={vw}
        height={vh}
        className="block select-none"
        style={{ touchAction: "none", cursor: "grab" }}
      >
        <defs>
          <marker
            id="lineage-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10" fill="rgba(196,154,92,0.5)" />
          </marker>
        </defs>

        {/* All zoomable content lives in a single <g> driven by the d3 transform */}
        <g transform={transform.toString()}>
          {/* Year axis (left rail) */}
          <YearAxis
            y0={MARGIN_TOP}
            y1={layout.height - MARGIN_BOTTOM}
            domain={layout.yearDomain}
          />

          {/* Edges */}
          {layout.placed.map((p) => {
            if (p.parentX === undefined || p.parentY === undefined) return null;
            const midY = (p.parentY + p.y) / 2;
            const path = `M ${p.parentX},${p.parentY} C ${p.parentX},${midY} ${p.x},${midY} ${p.x},${p.y}`;
            const isOnHoverPath =
              hoverId !== null && (hoverId === p.node.id);
            return (
              <path
                key={`edge-${p.node.id}`}
                d={path}
                fill="none"
                stroke={isOnHoverPath ? "var(--color-accent)" : "rgba(196,154,92,0.32)"}
                strokeWidth={isOnHoverPath ? 1.6 : 1}
              />
            );
          })}

          {/* Nodes */}
          {layout.placed.map((p) => {
            // 是否被全局筛选(流派 / 地域)排除 → 8% 透明
            let dimmed = false;
            if (p.node.kind === "movement" && p.node.refId) {
              if (filter.movementIds.length && !filter.movementIds.includes(p.node.refId)) {
                dimmed = true;
              }
            } else if (p.node.kind === "photographer" && p.node.refId) {
              const ph = getPhotographer(p.node.refId);
              if (ph && !passes(ph, filter)) dimmed = true;
            }
            return (
              <LineageNodeView
                key={p.node.id}
                placed={p}
                hovered={hoverId === p.node.id}
                dimmed={dimmed}
                onHover={(on) => setHoverId(on ? p.node.id : null)}
                onClick={() => {
                  if (p.node.kind === "movement" && p.node.refId)
                    router.push(`/movements/${p.node.refId}`, { scroll: false });
                  if (p.node.kind === "photographer" && p.node.refId)
                    router.push(`/p/${p.node.refId}`, { scroll: false });
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* ── Zoom hint (consistent with Timeline) ───────────────── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-ink-3 font-display">
        <button
          type="button"
          onClick={resetZoom}
          className="border border-rule px-2 h-7 hover:text-ink hover:border-rule-2 transition-colors bg-bg/80 backdrop-blur-sm"
          title={t("hint.reset")}
        >
          {t("hint.reset")}
        </button>
        <span className="border border-rule px-2 h-7 flex items-center bg-bg/80 backdrop-blur-sm tabular-nums">
          {`zoom ${transform.k.toFixed(2)}× · ${t("hint.zoomPan")}`}
        </span>
      </div>
    </div>
  );
}

function YearAxis({
  y0,
  y1,
  domain,
}: {
  y0: number;
  y1: number;
  domain: [number, number];
}) {
  const scale = scaleLinear().domain(domain).range([y0, y1]);
  const ticks: number[] = [];
  const step = 25;
  const start = Math.ceil(domain[0] / step) * step;
  for (let y = start; y <= domain[1]; y += step) ticks.push(y);
  return (
    <g>
      <line x1={42} x2={42} y1={y0 - 12} y2={y1 + 12} stroke="var(--color-rule-2)" />
      {ticks.map((t) => {
        const yy = scale(t);
        return (
          <g key={t}>
            <line x1={36} x2={48} y1={yy} y2={yy} stroke="var(--color-rule-2)" />
            <text
              x={30}
              y={yy + 3}
              fontSize={10}
              textAnchor="end"
              className="font-mono tabular-nums"
              fill="var(--color-ink-3)"
            >
              {t}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function LineageNodeView({
  placed,
  hovered,
  dimmed,
  onHover,
  onClick,
}: {
  placed: Placed;
  hovered: boolean;
  dimmed: boolean;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const { node, x, y } = placed;
  const isInteractive = node.kind === "movement" || node.kind === "photographer";

  let color = "var(--color-ink-2)";
  let bg = "var(--color-bg-elev)";
  let badge = "·";
  let detail: string | undefined;

  if (node.kind === "root") {
    color = "var(--color-accent)";
    badge = "◉";
    detail = "Photography";
  } else if (node.kind === "event") {
    color = "var(--color-ink-2)";
    badge = "◇";
  } else if (node.kind === "movement") {
    const m = node.refId ? getMovement(node.refId) : undefined;
    if (m) {
      color = m.color;
      bg = `${m.color}1a`;
      detail = m.nameEn;
    }
    badge = "◆";
  } else if (node.kind === "photographer") {
    const p = node.refId ? getPhotographer(node.refId) : undefined;
    if (p) {
      const m = getMovement(p.movements[0]);
      if (m) color = m.color;
      detail = `${p.born}–${p.died ?? "今"}`;
    }
    badge = "●";
  }

  // hovered state: brighter background tint + accent stroke
  const effBg =
    isInteractive && hovered
      ? node.kind === "movement"
        ? `${color}33` // 0x33 ≈ 20% opacity
        : "var(--color-bg-2)"
      : bg;
  const effStrokeOpacity = isInteractive && hovered ? 1 : 0.4;
  const effStrokeWidth =
    node.kind === "root" || node.kind === "movement" ? (hovered ? 2 : 1.5) : hovered ? 1.5 : 1;

  const labelW = Math.max(node.label.length * 14 + 32, 88);
  return (
    <g
      transform={`translate(${x - labelW / 2}, ${y - 12})`}
      onClick={isInteractive ? onClick : undefined}
      onMouseEnter={isInteractive ? () => onHover(true) : undefined}
      onMouseLeave={isInteractive ? () => onHover(false) : undefined}
      data-node-interactive={isInteractive ? "1" : undefined}
      className={clsx(isInteractive && "cursor-pointer")}
      style={{
        transition: "all 140ms ease-out",
        opacity: dimmed ? 0.12 : 1,
      }}
    >
      <rect
        x={0}
        y={0}
        width={labelW}
        height={24}
        fill={effBg}
        stroke={color}
        strokeOpacity={effStrokeOpacity}
        strokeWidth={effStrokeWidth}
        style={{ transition: "fill 140ms ease-out, stroke-opacity 140ms ease-out" }}
      />
      <text
        x={10}
        y={16}
        fontSize={10}
        fill={color}
        fontWeight={node.kind === "root" || node.kind === "movement" ? 600 : 400}
      >
        <tspan>{badge}</tspan>
        <tspan dx={6} className="font-display" fill="var(--color-ink)">
          {node.label}
        </tspan>
      </text>
      {detail && (
        <text
          x={labelW + 8}
          y={16}
          fontSize={9}
          fill="var(--color-ink-3)"
          className="font-display"
          letterSpacing={1.5}
          style={{ textTransform: "uppercase" }}
        >
          {detail}
        </text>
      )}
      {/* native browser tooltip for screen readers / hover */}
      {isInteractive && (
        <title>{`${node.label}${detail ? " · " + detail : ""}`}</title>
      )}
    </g>
  );
}

/* ── Layout algorithm ──────────────────────────────────────────── */

function layoutLineage(
  root: LineageNode,
  vw: number
): { placed: Placed[]; width: number; height: number; yearDomain: [number, number] } {
  // 1. count leaves per node
  const leafCount = new Map<string, number>();
  (function walk(n: LineageNode): number {
    if (!n.children || n.children.length === 0) {
      leafCount.set(n.id, 1);
      return 1;
    }
    let c = 0;
    for (const ch of n.children) c += walk(ch);
    leafCount.set(n.id, c);
    return c;
  })(root);

  const totalLeaves = leafCount.get(root.id) ?? 1;

  // 2. derive year domain
  const years: number[] = [];
  (function collectYears(n: LineageNode) {
    if (typeof n.year === "number") years.push(n.year);
    if (n.children) for (const c of n.children) collectYears(c);
  })(root);
  const minYear = Math.min(...years, 1820) - 5;
  const maxYear = Math.max(...years, new Date().getFullYear() - 30) + 10;
  const yearDomain: [number, number] = [minYear, maxYear];

  const totalWidth = Math.max(
    vw,
    MARGIN_X * 2 + Math.max(totalLeaves, 6) * COLUMN_WIDTH * 0.88
  );
  const height = MARGIN_TOP + (maxYear - minYear) * NODE_HEIGHT * 0.13 + MARGIN_BOTTOM;
  const yearScale = scaleLinear()
    .domain(yearDomain)
    .range([MARGIN_TOP, height - MARGIN_BOTTOM]);

  const placed: Placed[] = [];

  function placeNode(
    n: LineageNode,
    xStart: number,
    xEnd: number,
    parentX?: number,
    parentY?: number
  ) {
    const x = (xStart + xEnd) / 2;
    const y = typeof n.year === "number" ? yearScale(n.year) : MARGIN_TOP;
    placed.push({ node: n, x, y, parentX, parentY });
    if (n.children && n.children.length > 0) {
      let cursor = xStart;
      const total = leafCount.get(n.id) ?? 1;
      for (const c of n.children) {
        const cLeaves = leafCount.get(c.id) ?? 1;
        const cWidth = (cLeaves / total) * (xEnd - xStart);
        placeNode(c, cursor, cursor + cWidth, x, y);
        cursor += cWidth;
      }
    }
  }

  placeNode(root, MARGIN_X + 60, totalWidth - MARGIN_X);

  return { placed, width: totalWidth, height, yearDomain };
}
