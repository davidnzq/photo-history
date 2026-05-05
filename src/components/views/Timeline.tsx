"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { scaleLinear } from "d3-scale";
import type { Photographer, Movement, HistoryEvent } from "@/lib/types";
import { parseFilter, passes } from "@/lib/filter";
import { useT, getMovementName, getPhotographerName } from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";

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

const HEADER_HEIGHT = 36;
const LANE_PAD_TOP = 8;
const LANE_PAD_BOTTOM = 8;
const SUB_ROW_HEIGHT = 16;
const SUB_ROW_GAP = 4;
const EVENTS_HEIGHT = 32;
const LEFT_GUTTER = 152;
const RIGHT_PAD = 24;

const BASE_PX_PER_YEAR = 8;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const SCROLL_KEY = "timeline-scroll";
const ZOOM_KEY = "timeline-zoom";

type Placed = { p: Photographer; row: number; xStart: number; xEnd: number };
type LaneInfo = {
  movement: Movement;
  placed: Placed[];
  rowCount: number;
  height: number;
};

function TimelineInner({ photographers, movements, events, yearBounds }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useT();
  const { locale } = useLocale();

  const filter = useMemo(() => parseFilter(sp), [sp]);

  // ── Lane layout ────────────────────────────────────────────────
  const lanes: LaneInfo[] = useMemo(() => {
    const sortedMovements = [...movements].sort(
      (a, b) => a.period.start - b.period.start
    );
    const out: LaneInfo[] = [];
    const now = new Date().getFullYear();
    for (const m of sortedMovements) {
      const inMovement = photographers
        .filter((p) => p.movements[0] === m.id)
        .sort((a, b) => a.born - b.born);
      const rows: Placed[][] = [];
      const placed: Placed[] = [];
      for (const p of inMovement) {
        const xStart = Math.max(p.born, p.born + 18 - 25);
        const xEnd = p.died ?? now;
        let row = 0;
        while (
          rows[row] &&
          rows[row].some((q) => !(q.xEnd < xStart - 2 || q.xStart > xEnd + 2))
        ) {
          row++;
        }
        if (!rows[row]) rows[row] = [];
        const placement: Placed = { p, row, xStart, xEnd };
        rows[row].push(placement);
        placed.push(placement);
      }
      const rowCount = Math.max(rows.length, 1);
      const height =
        LANE_PAD_TOP +
        rowCount * SUB_ROW_HEIGHT +
        (rowCount - 1) * SUB_ROW_GAP +
        LANE_PAD_BOTTOM;
      out.push({ movement: m, placed, rowCount, height });
    }
    return out;
  }, [movements, photographers]);

  // ── Zoom level (state) — restored from sessionStorage if present ──
  const [zoom, setZoom] = useState<number>(1);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(ZOOM_KEY);
    const parsed = saved ? parseFloat(saved) : NaN;
    if (Number.isFinite(parsed) && parsed >= ZOOM_MIN && parsed <= ZOOM_MAX) {
      setZoom(parsed);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(ZOOM_KEY, zoom.toFixed(3));
  }, [zoom, hydrated]);

  const pxPerYear = BASE_PX_PER_YEAR * zoom;
  const contentW = (yearBounds[1] - yearBounds[0]) * pxPerYear;
  const totalW = LEFT_GUTTER + contentW + RIGHT_PAD;

  const xScale = useMemo(
    () => scaleLinear().domain(yearBounds).range([LEFT_GUTTER, LEFT_GUTTER + contentW]),
    [yearBounds, contentW]
  );

  // ── Tick density per zoom ─────────────────────────────────────
  const ticks = useMemo(() => {
    const step = zoom > 2.5 ? 5 : zoom > 1 ? 10 : 20;
    const start = Math.ceil(yearBounds[0] / step) * step;
    const arr: number[] = [];
    for (let y = start; y <= yearBounds[1]; y += step) arr.push(y);
    return arr;
  }, [yearBounds, zoom]);

  // ── Lane vertical offsets ─────────────────────────────────────
  const laneOffsets = useMemo(() => {
    const offsets: number[] = [];
    let y = 0;
    for (const l of lanes) {
      offsets.push(y);
      y += l.height;
    }
    return offsets;
  }, [lanes]);

  const lanesTotal = lanes.reduce((acc, l) => acc + l.height, 0);

  // ── Filter set: 隐藏未命中项 (per UX 反馈, 不再 dim) ────────────
  const hiddenSet = useMemo(() => {
    const out = new Set<string>();
    for (const p of photographers) if (!passes(p, filter)) out.add(p.id);
    return out;
  }, [photographers, filter]);

  // ── Hover state ────────────────────────────────────────────────
  const [hoverLaneId, setHoverLaneId] = useState<string | null>(null);

  // ── Scroll container + restoration ─────────────────────────────
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // restore on mount (after hydrated, so contentW is final)
  useEffect(() => {
    if (!hydrated || !scrollRef.current) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;
    const [x, y] = saved.split(",").map(Number);
    if (Number.isFinite(x)) scrollRef.current.scrollLeft = x;
    if (Number.isFinite(y)) scrollRef.current.scrollTop = y;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // save on scroll (rAF-throttled)
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    let raf = 0;
    function save() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(
          SCROLL_KEY,
          `${el.scrollLeft},${el.scrollTop}`
        );
      });
    }
    el.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", save);
    };
  }, []);

  // ── Wheel handler — Cmd/Ctrl + wheel = zoom; else native scroll ──
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      // 标准 Figma/Miro 模式: ⌘/Ctrl + wheel = zoom, 否则原生滚动
      // (在 trackpad pinch 时浏览器也会送来 ctrlKey=true 的 wheel,自动支持)
      if (!(e.ctrlKey || e.metaKey)) return; // 让浏览器原生处理
      e.preventDefault();
      const factor = Math.exp(-e.deltaY / 500);
      setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z * factor)));
    }

    // passive: false 因为我们要 preventDefault
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function zoomIn() {
    setZoom((z) => Math.min(ZOOM_MAX, z * 1.25));
  }
  function zoomOut() {
    setZoom((z) => Math.max(ZOOM_MIN, z / 1.25));
  }
  function zoomReset() {
    setZoom(1);
  }

  function openPhotographer(id: string) {
    router.push(`/p/${id}`, { scroll: false });
  }
  function openMovement(id: string) {
    router.push(`/movements/${id}`, { scroll: false });
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* main scroll area: vertical & horizontal native scroll */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto relative">
        <div style={{ width: totalW, position: "relative" }}>
          {/* ── Sticky header: year axis + 流派 column header ─────── */}
          <div
            className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm border-b border-rule"
            style={{ width: totalW }}
          >
            <svg
              width={totalW}
              height={HEADER_HEIGHT}
              className="block select-none"
            >
              {/* "流派" column header at x=0..LEFT_GUTTER */}
              <text
                x={20}
                y={HEADER_HEIGHT / 2 + 4}
                fontSize={10}
                className="font-display"
                fill="var(--color-ink-3)"
                letterSpacing={1.5}
                style={{ textTransform: "uppercase" }}
              >
                {t("filter.movements")}
              </text>
              {/* Year ticks */}
              {ticks.map((tk) => {
                const x = xScale(tk);
                if (x < LEFT_GUTTER - 24 || x > totalW + 24) return null;
                return (
                  <g key={tk}>
                    <line
                      x1={x}
                      x2={x}
                      y1={HEADER_HEIGHT - 6}
                      y2={HEADER_HEIGHT}
                      stroke="var(--color-rule-2)"
                    />
                    <text
                      x={x}
                      y={HEADER_HEIGHT - 12}
                      fontSize={10}
                      textAnchor="middle"
                      className="font-display tabular-nums"
                      fill="var(--color-ink-2)"
                    >
                      {tk}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ── Body: lanes + bars ──────────────────────────────── */}
          <svg
            width={totalW}
            height={lanesTotal}
            className="block select-none"
          >
            {/* Lane rows: backgrounds + period bands + peak ticks +
                 full-row hover hit area + clickable left label.       */}
            {lanes.map((l, i) => {
              const y = laneOffsets[i];
              const x0 = xScale(l.movement.period.start);
              const x1 = xScale(
                l.movement.period.end ?? new Date().getFullYear()
              );
              const peakX = xScale(l.movement.period.peak);
              const isHovered = hoverLaneId === l.movement.id;

              return (
                <g
                  key={l.movement.id}
                  onMouseEnter={() => setHoverLaneId(l.movement.id)}
                  onMouseLeave={() =>
                    setHoverLaneId((cur) =>
                      cur === l.movement.id ? null : cur
                    )
                  }
                >
                  {/* striped row background */}
                  <rect
                    x={0}
                    y={y}
                    width={totalW}
                    height={l.height}
                    fill={
                      i % 2 === 0
                        ? "var(--color-bg-elev)"
                        : "var(--color-bg)"
                    }
                    opacity={0.3}
                  />
                  {/* full-row hover layer (movement color tint) */}
                  {isHovered && (
                    <rect
                      x={0}
                      y={y}
                      width={totalW}
                      height={l.height}
                      fill={l.movement.color}
                      opacity={0.10}
                      className="pointer-events-none"
                    />
                  )}
                  {/* movement period band */}
                  <rect
                    x={x0}
                    y={y + 1}
                    width={Math.max(2, x1 - x0)}
                    height={l.height - 2}
                    fill={l.movement.color}
                    opacity={0.14}
                    className="pointer-events-none"
                  />
                  {/* peak tick */}
                  <line
                    x1={peakX}
                    x2={peakX}
                    y1={y + 4}
                    y2={y + l.height - 4}
                    stroke={l.movement.color}
                    strokeOpacity={0.45}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    className="pointer-events-none"
                  />

                  {/* clickable lane label gutter */}
                  <g
                    role="link"
                    tabIndex={0}
                    aria-label={getMovementName(l.movement, locale)}
                    onClick={() => openMovement(l.movement.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openMovement(l.movement.id);
                      }
                    }}
                    className="cursor-pointer"
                    style={{ outline: "none" }}
                  >
                    {/* gutter highlight on row hover */}
                    <rect
                      x={0}
                      y={y + 2}
                      width={LEFT_GUTTER - 4}
                      height={l.height - 4}
                      fill={isHovered ? l.movement.color : "transparent"}
                      fillOpacity={isHovered ? 0.22 : 0}
                      style={{ transition: "fill-opacity 140ms ease-out" }}
                    />
                    <text
                      x={LEFT_GUTTER - 12}
                      y={y + l.height / 2 + 5}
                      textAnchor="end"
                      className="font-display"
                      fontSize={11.5}
                      letterSpacing={0.4}
                      fill={
                        isHovered
                          ? "var(--color-ink)"
                          : "var(--color-ink-2)"
                      }
                      style={{ pointerEvents: "none" }}
                    >
                      {getMovementName(l.movement, locale)}
                    </text>
                  </g>

                  {/* photographer bars — 未命中筛选项直接不渲染 */}
                  {l.placed
                    .filter(({ p }) => !hiddenSet.has(p.id))
                    .map(({ p, row, xStart, xEnd }) => {
                    const x = xScale(xStart);
                    const w = Math.max(2, xScale(xEnd) - x);
                    const yBar =
                      y +
                      LANE_PAD_TOP +
                      row * (SUB_ROW_HEIGHT + SUB_ROW_GAP);
                    return (
                      <g
                        key={p.id}
                        data-bar
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPhotographer(p.id);
                        }}
                      >
                        <title>{`${p.nameZh} · ${p.name} · ${p.born}–${p.died ?? "now"}`}</title>
                        <rect
                          x={x}
                          y={yBar}
                          width={w}
                          height={SUB_ROW_HEIGHT - 2}
                          fill={l.movement.color}
                          fillOpacity={0.85}
                        />
                        {w > 60 && (
                          <text
                            x={x + 6}
                            y={yBar + SUB_ROW_HEIGHT - 5}
                            fontSize={10}
                            fill="var(--color-bg)"
                            className="font-display pointer-events-none"
                          >
                            {getPhotographerName(p, locale)}
                          </text>
                        )}
                        {w < 14 && (
                          <rect
                            x={x - 4}
                            y={yBar - 2}
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
          </svg>

          {/* ── Events row ───────────────────────────────────────── */}
          <svg
            width={totalW}
            height={EVENTS_HEIGHT}
            className="block select-none border-t border-rule"
          >
            <text
              x={20}
              y={EVENTS_HEIGHT / 2 + 4}
              fontSize={10}
              className="font-display"
              fill="var(--color-ink-3)"
              letterSpacing={1.5}
              style={{ textTransform: "uppercase" }}
            >
              {t("hint.events")}
            </text>
            {events.map((ev) => {
              const x = xScale(ev.year);
              if (x < LEFT_GUTTER || x > totalW - RIGHT_PAD) return null;
              const showLabel = pxPerYear > 12;
              return (
                <g key={`${ev.year}-${ev.label}`}>
                  <circle
                    cx={x}
                    cy={EVENTS_HEIGHT / 2}
                    r={2.5}
                    fill="var(--color-accent)"
                  />
                  {showLabel && (
                    <text
                      x={x + 6}
                      y={EVENTS_HEIGHT / 2 + 4}
                      fontSize={10}
                      fill="var(--color-ink-2)"
                    >
                      {ev.year} · {ev.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Floating zoom controls (consistent with Lineage style) ── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-ink-3 font-display">
        <div
          className="inline-flex border border-rule bg-bg/80 backdrop-blur-sm"
          role="group"
          aria-label="zoom"
        >
          <button
            type="button"
            onClick={zoomOut}
            aria-label="zoom out"
            className="w-7 h-7 flex items-center justify-center hover:text-ink hover:bg-bg-2 transition-colors disabled:opacity-30"
            disabled={zoom <= ZOOM_MIN + 0.001}
          >
            −
          </button>
          <button
            type="button"
            onClick={zoomReset}
            className="px-2 h-7 flex items-center hover:text-ink hover:bg-bg-2 transition-colors border-x border-rule tabular-nums"
            title="reset"
          >
            {(zoom * 100).toFixed(0)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            aria-label="zoom in"
            className="w-7 h-7 flex items-center justify-center hover:text-ink hover:bg-bg-2 transition-colors disabled:opacity-30"
            disabled={zoom >= ZOOM_MAX - 0.001}
          >
            +
          </button>
        </div>
        <span className="hidden sm:inline border border-rule px-2 h-7 flex items-center bg-bg/80 backdrop-blur-sm">
          {locale === "en"
            ? "⌘+wheel zoom · drag scroll bars"
            : "⌘+滚轮缩放 · 拖动滚动条"}
        </span>
      </div>
    </div>
  );
}
