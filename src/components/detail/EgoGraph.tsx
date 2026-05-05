"use client";

import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import type { EgoGraph as EgoGraphData, Photographer } from "@/lib/types";
import { getMovement } from "@/lib/data";
import { useLocale } from "@/components/shell/LocaleProvider";
import { getPhotographerName, type Locale } from "@/lib/i18n";

type Props = {
  data: EgoGraphData;
  /** main person to render in center */
  center: Photographer;
};

type SectionKey = "influencedBy" | "contemporaries" | "influenced";

/** 单语标签 — 中文模式只有中文,EN 模式只有英文 (per UX 反馈不再混排) */
const LABELS: Record<Locale, Record<SectionKey, string>> = {
  zh: {
    influencedBy: "受影响",
    contemporaries: "同辈",
    influenced: "影响了",
  },
  en: {
    influencedBy: "Influenced by",
    contemporaries: "Contemporaries",
    influenced: "Influenced",
  },
};
const HEADING: Record<Locale, string> = {
  zh: "影响关系图谱",
  en: "Ego graph",
};
const EMPTY: Record<Locale, Record<"up" | "middle" | "down", string>> = {
  zh: {
    up: "无明确前辈记录",
    middle: "无明确同辈记录",
    down: "无明确后继记录",
  },
  en: {
    up: "No documented predecessors",
    middle: "No documented contemporaries",
    down: "No documented successors",
  },
};

export function EgoGraph({ data, center }: Props) {
  const { locale } = useLocale();
  const [enabled, setEnabled] = useState<Record<SectionKey, boolean>>({
    influencedBy: true,
    contemporaries: true,
    influenced: true,
  });

  const primaryColor =
    getMovement(center.movements[0])?.color ?? "var(--color-accent)";

  return (
    <div className="relative border-l border-rule pl-6">
      <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-4">
        {HEADING[locale]}
      </h2>

      {/* Toggles */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(Object.keys(LABELS[locale]) as SectionKey[]).map((k) => (
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
            {LABELS[locale][k]}
            <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">
              {data[k].length}
            </span>
          </button>
        ))}
      </div>

      {/* Three sections, vertically stacked. 不再做 +N more 截断,
          完整列出, 让外层抽屉/页面自身滚动. */}
      <div className="space-y-5">
        {enabled.influencedBy && (
          <Section
            title={LABELS[locale].influencedBy}
            people={data.influencedBy}
            position="up"
            emptyLabel={EMPTY[locale].up}
            locale={locale}
          />
        )}
        <CenterPill person={center} color={primaryColor} locale={locale} />
        {enabled.contemporaries && (
          <Section
            title={LABELS[locale].contemporaries}
            people={data.contemporaries}
            position="middle"
            emptyLabel={EMPTY[locale].middle}
            locale={locale}
          />
        )}
        {enabled.influenced && (
          <Section
            title={LABELS[locale].influenced}
            people={data.influenced}
            position="down"
            emptyLabel={EMPTY[locale].down}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}

function CenterPill({
  person,
  color,
  locale,
}: {
  person: Photographer;
  color: string;
  locale: Locale;
}) {
  return (
    <div className="flex items-center justify-center my-1">
      <div
        className="px-3 h-9 inline-flex items-center gap-2 border-2 bg-bg-elev"
        style={{ borderColor: color, boxShadow: `0 0 16px ${color}33` }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color }}
        />
        <span className="font-display text-sm text-ink">
          {getPhotographerName(person, locale)}
        </span>
        <span className="font-display text-[10px] tracking-wider text-ink-3 tabular-nums">
          {person.born}–{person.died ?? (locale === "en" ? "now" : "今")}
        </span>
      </div>
    </div>
  );
}

function Section({
  title,
  people,
  emptyLabel,
  locale,
}: {
  title: string;
  people: Photographer[];
  position: "up" | "middle" | "down";
  emptyLabel: string;
  locale: Locale;
}) {
  return (
    <div>
      <div className="font-display text-[11px] tracking-[0.16em] text-ink-2 mb-2 flex items-baseline gap-2">
        <span>{title}</span>
        {people.length > 0 && (
          <span className="text-ink-3 tabular-nums text-[10px]">
            {people.length}
          </span>
        )}
      </div>
      {people.length === 0 ? (
        <div className="text-[12px] text-ink-3 italic px-2">{emptyLabel}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {people.map((p) => (
            <PersonChip key={p.id} person={p} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonChip({
  person,
  locale,
}: {
  person: Photographer;
  locale: Locale;
}) {
  const m = getMovement(person.movements[0]);
  const color = m?.color ?? "var(--color-rule-2)";
  return (
    <Link
      href={`/p/${person.id}`}
      scroll={false}
      className="group flex items-center gap-2 px-2 h-9 border border-rule hover:border-rule-2 transition-colors bg-bg-elev/40"
      title={`${person.name} (${person.born}–${person.died ?? "now"})`}
    >
      <span
        className="w-1.5 h-1.5 shrink-0"
        style={{ background: color }}
      />
      <span className="font-display text-[12px] text-ink truncate group-hover:text-accent">
        {getPhotographerName(person, locale)}
      </span>
      <span className="ml-auto font-mono tabular-nums text-[10px] text-ink-3 shrink-0">
        {person.born}
      </span>
    </Link>
  );
}
