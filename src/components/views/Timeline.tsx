"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { scaleLinear } from "d3-scale";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomTransform } from "d3-zoom";
import { select } from "d3-selection";
import { clsx } from "clsx";
import type { Photographer, Movement, HistoryEvent } from "@/lib/types";
import { parseFilter, passes } from "@/lib/filter";

type Props = {
  photographers: Photographer[];
  movements: Movement[];
  events: HistoryEvent[];
  yearBounds: [number, number];
};

export function Timeline(props: Props) {
  return (
    <Suspense fallback={<div className="absolute inset-0" />}>
      <TimelineInner {...props} />
    </Suspense>
  );
}

const LANE_PAD_TOP = 8;
const LANE_PAD_BOTTOM = 8;
const SUB_ROW_HEIGHT = 16;
const SUB_ROW_GAP = 4;
const AXIS_HEIGHT = 36;
const EVENTS_HEIGHT = 28;
const LEFT_GUTTER = 152;
const RIGHT_PAD = 24;

type Placed = { p: Photographer; row: number; xStart: number; xEnd: number };
type LaneInfo = { movement: Movement; placed: Placed[]; rowCount: number; height: number };

function TimelineInner({ photographers, movements, events, yearBounds }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const filter = useMemo(() => parseFilter(sp), [sp]);

  /* ── Build layout: one lane per movement, sub-rows for collision ── */
  const lanes: LaneInfo[] = useMemo(() => {
    const sortedMovements = [...movements].sort(
      (a, b) => a.period.start - b.period.start
    );
    const out: LaneInfo[] = [];
    for (const m of sortedMovements) {
      const inMovement = photographers
        .filter((p) => p.movements[0] === m.id)
        .sort((a, b) => a.born - b.born);
      const rows: Placed[][] = [];
      const placed: Placed[] = [];
      const now = new Date().getFullYear();
      for (const p of inMovement) {
        const xStart = Math.max(p.born, p.born + 18 - 25); // start a bit before 18 for visual continuity
        const xEnd = p.died ?? now;
        let row = 0;
        while (rows[row] && rows[row].some((q) => !(q.xEnd < xStart - 2 || q.xStart > xEnd + 2))) {
          row++;
        }
        if (!rows[row]) rows[row] = [];
        const placement: Placed = { p, row, xStart, xEnd };
        rows[row].push(placement);
        placed.push(placement);
      }
      const rowCount = Math.max(rows.length, 1);
      const height = LANE_PAD_TOP + rowCount * SUB_ROW_HEIGHT + (rowCount - 1) * SUB_ROW_GAP + LANE_PAD_BOTTOM;
      out.push({ movement: m, placed, rowCount, height });
    }
    return out;
  }, [movements, photographers]);

  /* ── SVG dimensions ─────────────────────────────────────────────── */
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setWidth(Math.max(640, Math.floor(e.contentRect.width)));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const lanesTotal = lanes.reduce((acc, l) => acc + l.height, 0);
  const height = AXIS_HEIGHT + lanesTotal + EVENTS_HEIGHT + 16;

  /* ── X scale (linear over years), x positions are zoomed via transform ── */
  const baseXScale = useMemo(() => {
    return scaleLinear()
      .domain(yearBounds)
      .range([LEFT_GUTTER, width - RIGHT_PAD]);
  }, [width, yearBounds]);

  /* ── Zoom (d3-zoom over the SVG) ──────────────────────────────── */
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = select(svgRef.current);
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 18])
      .translateExtent([[0, 0], [width, height]])
      .filter((event) => {
        // allow wheel + drag on background, but let clicks on interactive children pass
        const target = event.target as Element;
        if (target.closest("[data-bar]")) return false;
        return event.button === 0 || event.type === "wheel";
      })
      .on("zoom", (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(e.transform);
      });
    svg.call(z);
    return () => {
      svg.on(".zoom", null);
    };
  }, [width, height]);

  // Apply zoom to xScale
  const xScale = useMemo(() => transform.rescaleX(baseXScale), [baseXScale, transform]);

  /* ── Tick generation (auto density per zoom) ────────────────────── */
  const ticks = useMemo(() => {
    const k = transform.k;
    const step = k > 6 ? 5 : k > 2.5 ? 10 : k > 1 ? 20 : 50;
    const [y0, y1] = xScale.domain();
    const start = Math.ceil(y0 / step) * step;
    const arr: number[] = [];
    for (let y = start; y <= y1; y += step) arr.push(y);
    return arr;
  }, [transform.k, xScale]);

  /* ── Lane y offsets ─────────────────────────────────────────────── */
  const laneOffsets = useMemo(() => {
    const offsets: number[] = [];
    let y = AXIS_HEIGHT;
    for (const l of lanes) {
      offsets.push(y);
      y += l.height;
    }
    return offsets;
  }, [lanes]);

  /* ── Filtered set (for dim non-matching) ───────────────────────── */
  const dimSet = useMemo(() => {
    const out = new Set<string>();
    for (const p of photographers) if (!passes(p, filter)) out.add(p.id);
    return out;
  }, [photographers, filter]);

  function openDetail(id: string) {
    startTransition(() => {
      const qs = sp.toString();
      router.push(`/p/${id}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-auto">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="block select-none"
        style={{ touchAction: "none" }}
      >
        <defs>
          <linearGradient id="left-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--color-bg)" stopOpacity="1" />
            <stop offset="1" stopColor="var(--color-bg)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lane backgrounds (movement color bands) */}
        {lanes.map((l, i) => {
          const y = laneOffsets[i];
          const x0 = xScale(l.movement.period.start);
          const x1 = xScale(l.movement.period.end ?? new Date().getFullYear());
          return (
            <g key={l.movement.id}>
              <rect
                x={LEFT_GUTTER}
                y={y}
                width={width - LEFT_GUTTER - RIGHT_PAD}
                height={l.height}
                fill={i % 2 === 0 ? "var(--color-bg-elev)" : "var(--color-bg)"}
                opacity={0.3}
              />
              <rect
                x={x0}
                y={y + 1}
                width={Math.max(2, x1 - x0)}
                height={l.height - 2}
                fill={l.movement.color}
                opacity={0.14}
              />
              {/* movement peak tick */}
              <line
                x1={xScale(l.movement.period.peak)}
                x2={xScale(l.movement.period.peak)}
                y1={y + 4}
                y2={y + l.height - 4}
                stroke={l.movement.color}
                strokeOpacity={0.45}
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              {/* lane label */}
              <text
                x={LEFT_GUTTER - 12}
                y={y + l.height / 2 + 4}
                textAnchor="end"
                className="font-display"
                fontSize={11}
                letterSpacing={0.4}
                fill="var(--color-ink-2)"
              >
                {l.movement.nameZh}
              </text>
              <text
                x={LEFT_GUTTER - 12}
                y={y + l.height / 2 + 16}
                textAnchor="end"
                fontSize={9}
                letterSpacing={1.5}
                fill="var(--color-ink-3)"
                style={{ textTransform: "uppercase" }}
              >
                {l.movement.nameEn}
              </text>
            </g>
          );
        })}

        {/* Photographer bars */}
        {lanes.map((l, i) => {
          const yLane = laneOffsets[i] + LANE_PAD_TOP;
          return (
            <g key={`bars-${l.movement.id}`}>
              {l.placed.map(({ p, row, xStart, xEnd }) => {
                const x = xScale(xStart);
                const w = Math.max(2, xScale(xEnd) - x);
                const y = yLane + row * (SUB_ROW_HEIGHT + SUB_ROW_GAP);
                const dim = dimSet.has(p.id);
                return (
                  <g
                    key={p.id}
                    data-bar
                    className={clsx(
                      "cursor-pointer transition-opacity",
                      dim ? "opacity-[0.12]" : "opacity-100"
                    )}
                    onClick={() => openDetail(p.id)}
                  >
                    <title>{`${p.nameZh} · ${p.name} · ${p.born}–${p.died ?? "now"}`}</title>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={SUB_ROW_HEIGHT - 2}
                      fill={l.movement.color}
                      fillOpacity={0.85}
                    />
                    {w > 60 && (
                      <text
                        x={x + 6}
                        y={y + SUB_ROW_HEIGHT - 5}
                        fontSize={10}
                        fill="var(--color-bg)"
                        className="font-display pointer-events-none"
                      >
                        {p.nameZh}
                      </text>
                    )}
                    {/* invisible wider hitbox for narrow bars */}
                    {w < 14 && (
                      <rect
                        x={x - 4}
                        y={y - 2}
                        width={w + 8}
                        height={SUB_ROW_HEIGHT + 2}
                        fill="transparent"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Top axis (years) */}
        <g>
          <rect x={0} y={0} width={width} height={AXIS_HEIGHT} fill="var(--color-bg)" />
          <line
            x1={LEFT_GUTTER}
            y1={AXIS_HEIGHT - 0.5}
            x2={width - RIGHT_PAD}
            y2={AXIS_HEIGHT - 0.5}
            stroke="var(--color-rule-2)"
          />
          {ticks.map((t) => {
            const x = xScale(t);
            if (x < LEFT_GUTTER - 20 || x > width + 20) return null;
            return (
              <g key={t}>
                <line
                  x1={x}
                  x2={x}
                  y1={AXIS_HEIGHT - 6}
                  y2={AXIS_HEIGHT}
                  stroke="var(--color-rule-2)"
                />
                <text
                  x={x}
                  y={AXIS_HEIGHT - 12}
                  fontSize={10}
                  textAnchor="middle"
                  className="font-display"
                  fill="var(--color-ink-2)"
                >
                  {t}
                </text>
              </g>
            );
          })}
          {/* left gutter overlay (so labels don't overlap year axis) */}
          <rect x={0} y={0} width={LEFT_GUTTER} height={AXIS_HEIGHT} fill="var(--color-bg)" />
          <text
            x={20}
            y={AXIS_HEIGHT - 12}
            fontSize={10}
            className="font-display"
            fill="var(--color-ink-3)"
            letterSpacing={1.5}
            style={{ textTransform: "uppercase" }}
          >
            流派 · Movement
          </text>
        </g>

        {/* Events row at bottom */}
        <g transform={`translate(0, ${AXIS_HEIGHT + lanesTotal})`}>
          <rect x={0} y={0} width={width} height={EVENTS_HEIGHT} fill="var(--color-bg)" />
          <line
            x1={LEFT_GUTTER}
            y1={0.5}
            x2={width - RIGHT_PAD}
            y2={0.5}
            stroke="var(--color-rule-2)"
          />
          <text
            x={20}
            y={EVENTS_HEIGHT / 2 + 4}
            fontSize={10}
            className="font-display"
            fill="var(--color-ink-3)"
            letterSpacing={1.5}
            style={{ textTransform: "uppercase" }}
          >
            事件 · Events
          </text>
          {events.map((ev) => {
            const x = xScale(ev.year);
            if (x < LEFT_GUTTER || x > width - RIGHT_PAD) return null;
            const showLabel = transform.k > 1.5;
            return (
              <g key={`${ev.year}-${ev.label}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={-lanesTotal}
                  y2={EVENTS_HEIGHT - 6}
                  stroke="var(--color-accent)"
                  strokeOpacity={0.35}
                  strokeDasharray="2 4"
                />
                <circle cx={x} cy={EVENTS_HEIGHT - 12} r={2.5} fill="var(--color-accent)" />
                {showLabel && (
                  <text
                    x={x + 6}
                    y={EVENTS_HEIGHT - 8}
                    fontSize={10}
                    fill="var(--color-ink-2)"
                  >
                    {ev.year} · {ev.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating zoom hint */}
      <div className="absolute bottom-3 right-3 text-[10px] tracking-[0.18em] uppercase text-ink-3 font-display border border-rule px-2 py-1 bg-bg/80 backdrop-blur-sm">
        {`zoom ${transform.k.toFixed(1)}× · 滚轮缩放 · 拖拽平移`}
      </div>
    </div>
  );
}
