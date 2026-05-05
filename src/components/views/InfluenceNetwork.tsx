"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import type { Photographer, Movement } from "@/lib/types";
import { buildEdges, clusterLayout, influenceCount } from "@/lib/relations";
import { parseFilter, passes } from "@/lib/filter";
import { getPhotographer } from "@/lib/data";
import { useT, getMovementName, getPhotographerName, getPhotographerSubname } from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";

/* react-force-graph-2d uses Canvas + DOM, client-only. */
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-ink-3 font-display tracking-wider uppercase text-xs">
      Loading network …
    </div>
  ),
});

type Props = {
  photographers: Photographer[];
  movements: Movement[];
};

type Node = {
  id: string;
  name: string;
  color: string;
  val: number;
  movement: string;
  x?: number;
  y?: number;
  /** when filtered out, dimmed */
  dim?: boolean;
};

type Link = { source: string; target: string };

export function InfluenceNetwork(props: Props) {
  return (
    <Suspense fallback={null}>
      <InfluenceNetworkInner {...props} />
    </Suspense>
  );
}

function InfluenceNetworkInner({ photographers, movements }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const filter = useMemo(() => parseFilter(sp), [sp]);
  const t = useT();
  const { locale } = useLocale();
  const focusMovement = sp.get("focus") || null;
  const focusEgo = sp.get("ego") || null;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 700 });

  /**
   * Click mode — interaction consistency 修复
   * 默认 'detail':左键点节点 = 打开词条抽屉(与时间线 / 传承关系一致)
   * 'ego':左键点节点 = 聚焦关系图谱(2 度邻居),需用户在左侧栏显式切换
   * 之前的"左键 ego / 右键词条"模式不再使用 — 右键无法在移动端触达,
   * 且违反 "primary action = left click" 的平台习惯。
   */
  const [clickMode, setClickMode] = useState<"detail" | "ego">("detail");

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const movementById = useMemo(() => new Map(movements.map((m) => [m.id, m])), [movements]);

  /* ── Build graph data ───────────────────────────────────────── */
  const graph = useMemo(() => {
    const positions = clusterLayout(movements);
    const ic = influenceCount();
    // determine ego set
    const egoIds = (() => {
      if (!focusEgo) return null;
      const set = new Set<string>([focusEgo]);
      const all = buildEdges();
      for (const e of all) {
        if (e.from === focusEgo) set.add(e.to);
        if (e.to === focusEgo) set.add(e.from);
      }
      // 2-degree
      for (const e of all) {
        if (set.has(e.from)) set.add(e.to);
        if (set.has(e.to)) set.add(e.from);
      }
      return set;
    })();

    const nodes: Node[] = photographers.map((p) => {
      const m = movementById.get(p.movements[0]);
      const pos = positions.get(p.id) ?? { x: 0, y: 0 };
      const dimByFilter = !passes(p, filter);
      const dimByFocus =
        focusMovement && p.movements[0] !== focusMovement ? true : false;
      const dimByEgo = egoIds && !egoIds.has(p.id) ? true : false;
      return {
        id: p.id,
        name: p.nameZh,
        color: m?.color ?? "#888",
        val: 2 + (ic.get(p.id) ?? 0) * 0.8,
        movement: p.movements[0],
        x: pos.x * 12,
        y: pos.y * 12,
        dim: dimByFilter || dimByFocus || dimByEgo,
      };
    });
    const links: Link[] = buildEdges().map((e) => ({ source: e.from, target: e.to }));
    return { nodes, links };
  }, [photographers, movements, movementById, filter, focusMovement, focusEgo]);

  function setFocusMovement(m: string | null) {
    const params = new URLSearchParams(sp);
    if (m) params.set("focus", m);
    else params.delete("focus");
    params.delete("ego");
    router.replace(`/network${params.toString() ? "?" + params : ""}`, { scroll: false });
  }

  function setEgo(id: string | null) {
    const params = new URLSearchParams(sp);
    if (id) params.set("ego", id);
    else params.delete("ego");
    router.replace(`/network${params.toString() ? "?" + params : ""}`, { scroll: false });
  }

  const focusedPerson = focusEgo ? getPhotographer(focusEgo) : undefined;

  return (
    <div className="absolute inset-0 flex">
      {/* Left rail: click mode / movement focus / current ego target */}
      <aside className="w-56 shrink-0 border-r border-rule overflow-y-auto p-4 hidden md:block">
        {/* ── Click mode (decides what left-click does) ──────────── */}
        <div className="font-display text-[10px] tracking-[0.2em] uppercase text-ink-3 mb-2">
          {t("rail.click")}
        </div>
        <div className="grid grid-cols-2 gap-1 mb-6 border border-rule p-0.5">
          <button
            type="button"
            onClick={() => setClickMode("detail")}
            className={clsx(
              "h-7 text-[11px] tracking-wider transition-colors",
              clickMode === "detail"
                ? "bg-accent text-bg"
                : "text-ink-2 hover:text-ink"
            )}
          >
            {t("rail.click.detail")}
          </button>
          <button
            type="button"
            onClick={() => setClickMode("ego")}
            className={clsx(
              "h-7 text-[11px] tracking-wider transition-colors",
              clickMode === "ego"
                ? "bg-accent text-bg"
                : "text-ink-2 hover:text-ink"
            )}
          >
            {t("rail.click.ego")}
          </button>
        </div>

        {/* ── Currently-focused ego target ────────────────────────── */}
        {focusedPerson && (
          <div className="mb-6 border border-accent/40 bg-bg-elev p-3">
            <div className="font-display text-[10px] tracking-[0.2em] uppercase text-accent mb-2">
              {t("rail.ego.title")}
            </div>
            <div className="font-display text-[14px] text-ink mb-0.5">
              {getPhotographerName(focusedPerson, locale)}
            </div>
            <div className="text-[11px] text-ink-3 mb-3">
              {getPhotographerSubname(focusedPerson, locale)} · {focusedPerson.born}–{focusedPerson.died ?? (locale === "en" ? "now" : "今")}
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => router.push(`/p/${focusedPerson.id}`, { scroll: false })}
                className="h-7 text-[11px] tracking-wider border border-rule hover:border-accent hover:text-accent transition-colors text-ink-2"
              >
                {t("rail.ego.openDetail")}
              </button>
              <button
                type="button"
                onClick={() => setEgo(null)}
                className="h-7 text-[11px] tracking-wider text-ink-3 hover:text-ink transition-colors"
              >
                {t("rail.ego.exit")}
              </button>
            </div>
          </div>
        )}

        {/* ── Movement filter (existing) ──────────────────────────── */}
        <div className="font-display text-[10px] tracking-[0.2em] uppercase text-ink-3 mb-3">
          {t("rail.movements")}
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setFocusMovement(null)}
            className={clsx(
              "w-full flex items-center gap-2 px-2 h-8 text-[12px] text-left transition-colors",
              !focusMovement ? "bg-bg-2 text-ink" : "text-ink-2 hover:bg-bg-elev"
            )}
          >
            <span className="w-2 h-2 bg-ink-3" />
            {t("filter.all")}
          </button>
          {movements.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setFocusMovement(m.id === focusMovement ? null : m.id)}
              className={clsx(
                "w-full flex items-center gap-2 px-2 h-8 text-[12px] text-left transition-colors",
                focusMovement === m.id ? "bg-bg-2 text-ink" : "text-ink-2 hover:bg-bg-elev"
              )}
            >
              <span className="w-2 h-2" style={{ background: m.color }} />
              {getMovementName(m, locale)}
            </button>
          ))}
        </div>
      </aside>

      {/* Graph canvas */}
      <div ref={containerRef} className="flex-1 relative">
        <ForceGraph2D
          graphData={graph}
          width={size.w}
          height={size.h}
          backgroundColor="#0F0E0C"
          nodeRelSize={4}
          nodeVal={(n) => (n as Node).val}
          nodeColor={(n) => ((n as Node).dim ? "rgba(232,226,212,0.08)" : (n as Node).color)}
          nodeLabel={(n) => {
            // node label shows the locale-appropriate name
            const id = (n as Node).id;
            const p = getPhotographer(id);
            return p ? getPhotographerName(p, locale) : (n as Node).name;
          }}
          linkColor={() => "rgba(196, 154, 92, 0.18)"}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          linkDirectionalParticles={0}
          enableNodeDrag={false}
          cooldownTicks={120}
          d3VelocityDecay={0.4}
          onNodeClick={(node) => {
            const id = (node as Node).id;
            if (clickMode === "detail") {
              // 主动作:左键打开词条抽屉(intercepting route 触发)
              router.push(`/p/${id}`, { scroll: false });
            } else {
              // 聚焦模式:左键设置 ego 目标
              const params = new URLSearchParams(sp);
              params.set("ego", id);
              router.replace(
                `/network${params.toString() ? "?" + params : ""}`,
                { scroll: false }
              );
            }
          }}
          nodeCanvasObjectMode={() => "after"}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as Node & { x?: number; y?: number };
            if (n.dim) return;
            if (globalScale < 1.4) return;
            const fontSize = Math.min(11, 8 + globalScale * 0.6);
            ctx.font = `${fontSize}px "Space Grotesk", sans-serif`;
            ctx.fillStyle = "rgba(232,226,212,0.85)";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            const p = getPhotographer(n.id);
            const label = p ? getPhotographerName(p, locale) : n.name;
            ctx.fillText(label, n.x ?? 0, (n.y ?? 0) + n.val + 3);
          }}
        />
        <div className="absolute bottom-3 right-3 text-[10px] tracking-[0.18em] uppercase text-ink-3 font-display border border-rule px-2 py-1 bg-bg/80 backdrop-blur-sm tabular-nums">
          {clickMode === "detail" ? t("hint.network.detail") : t("hint.network.ego")}
        </div>
      </div>
    </div>
  );
}
