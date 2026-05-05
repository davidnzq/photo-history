"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { scaleLinear } from "d3-scale";
import { clsx } from "clsx";
import type { LineageNode } from "@/lib/types";
import { getMovement, getPhotographer } from "@/lib/data";

type Props = { root: LineageNode };

type Placed = {
  node: LineageNode;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
};

const MARGIN_X = 80;
const MARGIN_TOP = 80;
const MARGIN_BOTTOM = 60;
const NODE_HEIGHT = 56;
const COLUMN_WIDTH = 120;

export function LineageTree({ root }: Props) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState(1200);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setVw(Math.max(640, Math.floor(e.contentRect.width)));
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => layoutLineage(root, vw), [root, vw]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 overflow-y-auto overflow-x-auto">
      <svg
        width={Math.max(vw, layout.width)}
        height={layout.height}
        className="block select-none"
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
          return (
            <path
              key={`edge-${p.node.id}`}
              d={path}
              fill="none"
              stroke="rgba(196,154,92,0.32)"
              strokeWidth={1}
            />
          );
        })}

        {/* Nodes */}
        {layout.placed.map((p) => (
          <LineageNodeView
            key={p.node.id}
            placed={p}
            onClick={() => {
              if (p.node.kind === "movement" && p.node.refId)
                router.push(`/movements/${p.node.refId}`);
              if (p.node.kind === "photographer" && p.node.refId)
                router.push(`/p/${p.node.refId}`);
            }}
          />
        ))}
      </svg>
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
  onClick,
}: {
  placed: Placed;
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

  const labelW = Math.max(node.label.length * 14 + 32, 88);
  return (
    <g
      transform={`translate(${x - labelW / 2}, ${y - 12})`}
      onClick={isInteractive ? onClick : undefined}
      className={clsx(isInteractive && "cursor-pointer group")}
    >
      <rect
        x={0}
        y={0}
        width={labelW}
        height={24}
        fill={bg}
        stroke={color}
        strokeOpacity={0.4}
        strokeWidth={node.kind === "root" || node.kind === "movement" ? 1.5 : 1}
        className={clsx(isInteractive && "group-hover:fill-bg-2 transition-colors")}
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
