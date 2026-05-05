"use client";

import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import type { EgoGraph as EgoGraphData, Photographer } from "@/lib/types";
import { getMovement } from "@/lib/data";

type Props = {
  data: EgoGraphData;
  /** main person to render in center */
  center: Photographer;
};

type SectionKey = "influencedBy" | "contemporaries" | "influenced";

const SECTION_META: Record<SectionKey, { zh: string; en: string }> = {
  influencedBy: { zh: "受影响 / Influenced By", en: "INFLUENCED BY" },
  contemporaries: { zh: "同辈 / Contemporaries", en: "CONTEMPORARIES" },
  influenced: { zh: "影响了 / Influenced", en: "INFLUENCED" },
};

const MAX_PER_SECTION = 6;

export function EgoGraph({ data, center }: Props) {
  const [enabled, setEnabled] = useState<Record<SectionKey, boolean>>({
    influencedBy: true,
    contemporaries: true,
    influenced: true,
  });

  const primaryColor =
    getMovement(center.movements[0])?.color ?? "var(--color-accent)";

  return (
    <div className="relative">
      {/* Toggles */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(Object.keys(SECTION_META) as SectionKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() =>
              setEnabled((prev) => ({ ...prev, [k]: !prev[k] }))
            }
            className={clsx(
              "px-2.5 h-7 border text-[11px] tracking-tight transition-colors",
              enabled[k]
                ? "border-accent text-accent bg-accent/5"
                : "border-rule text-ink-3 hover:text-ink-2"
            )}
          >
            {SECTION_META[k].zh}
            <span className="ml-1.5 text-[10px] opacity-60">
              {data[k].length}
            </span>
          </button>
        ))}
      </div>

      {/* Three sections, vertically stacked */}
      <div className="space-y-5">
        {enabled.influencedBy && (
          <Section
            title={SECTION_META.influencedBy}
            people={data.influencedBy}
            arrowDirection="down"
            position="up"
          />
        )}
        <CenterPill person={center} color={primaryColor} />
        {enabled.contemporaries && (
          <Section
            title={SECTION_META.contemporaries}
            people={data.contemporaries}
            arrowDirection="across"
            position="middle"
          />
        )}
        {enabled.influenced && (
          <Section
            title={SECTION_META.influenced}
            people={data.influenced}
            arrowDirection="down"
            position="down"
          />
        )}
      </div>
    </div>
  );
}

function CenterPill({ person, color }: { person: Photographer; color: string }) {
  return (
    <div className="flex items-center justify-center my-1">
      <div
        className="px-3 h-9 inline-flex items-center gap-2 border-2 bg-bg-elev"
        style={{ borderColor: color, boxShadow: `0 0 16px ${color}33` }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="font-display text-sm text-ink">{person.nameZh}</span>
        <span className="font-display text-[10px] tracking-wider text-ink-3">
          {person.born}–{person.died ?? "今"}
        </span>
      </div>
    </div>
  );
}

function Section({
  title,
  people,
  position,
}: {
  title: { zh: string; en: string };
  people: Photographer[];
  arrowDirection: "down" | "across";
  position: "up" | "middle" | "down";
}) {
  const overflow = people.length > MAX_PER_SECTION;
  const visible = people.slice(0, MAX_PER_SECTION);

  return (
    <div>
      <div className="font-display text-[10px] tracking-[0.2em] uppercase text-ink-3 mb-2">
        {title.en}
      </div>
      {visible.length === 0 ? (
        <div className="text-[12px] text-ink-3 italic px-2">
          {position === "up"
            ? "无明确前辈记录"
            : position === "down"
            ? "无明确后继记录"
            : "无明确同辈记录"}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {visible.map((p) => (
            <PersonChip key={p.id} person={p} />
          ))}
          {overflow && (
            <span className="inline-flex items-center justify-center px-2 h-9 text-[11px] text-ink-3 border border-rule">
              +{people.length - MAX_PER_SECTION} 更多
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function PersonChip({ person }: { person: Photographer }) {
  const m = getMovement(person.movements[0]);
  const color = m?.color ?? "var(--color-rule-2)";
  return (
    <Link
      href={`/p/${person.id}`}
      className="group flex items-center gap-2 px-2 h-9 border border-rule hover:border-rule-2 transition-colors bg-bg-elev/40"
      title={`${person.name} (${person.born}–${person.died ?? "今"})`}
    >
      <span
        className="w-1.5 h-1.5 shrink-0"
        style={{ background: color }}
      />
      <span className="font-display text-[12px] text-ink truncate group-hover:text-accent">
        {person.nameZh}
      </span>
      <span className="ml-auto font-mono tabular-nums text-[10px] text-ink-3 shrink-0">
        {person.born}
      </span>
    </Link>
  );
}
