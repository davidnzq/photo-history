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

type SectionKey = "influencedBy" | "self" | "contemporaries" | "influenced";

/**
 * 关系图谱 — 4 行结构 (受影响 / 本人 / 同辈 / 影响了).
 *
 * 设计原则 (§5 visual-hierarchy):
 *   - 本人不再用光环 / 强描边特化, 仅作为结构中的一行 (relationship by
 *     position, not by chrome)
 *   - 同辈与"受影响 / 影响了"的视觉一致, 区别仅在 section 标签
 *   - 本人 chip 不可点 (cursor-default, 不是 link)
 *
 * 关闭场景 (§9 back-stack-integrity):
 *   - 内部 chip 用 replace 导航, 历史栈保持 depth=1, 关闭抽屉 / 点击
 *     mask / 回退键 都是"整体退出"到打开抽屉前的页面.
 */

const LABELS: Record<Locale, Record<SectionKey, string>> = {
  zh: {
    influencedBy: "受影响",
    self: "本人",
    contemporaries: "同辈",
    influenced: "影响了",
  },
  en: {
    influencedBy: "Influenced by",
    self: "Self",
    contemporaries: "Contemporaries",
    influenced: "Influenced",
  },
};
const HEADING: Record<Locale, string> = {
  zh: "关系图谱",
  en: "Relationships",
};
const EMPTY: Record<Locale, Record<Exclude<SectionKey, "self">, string>> = {
  zh: {
    influencedBy: "无明确前辈记录",
    contemporaries: "无明确同辈记录",
    influenced: "无明确后继记录",
  },
  en: {
    influencedBy: "No documented predecessors",
    contemporaries: "No documented contemporaries",
    influenced: "No documented successors",
  },
};

export function EgoGraph({ data, center }: Props) {
  const { locale } = useLocale();
  // 三段(非本人)的可见性切换
  const [enabled, setEnabled] = useState<
    Record<Exclude<SectionKey, "self">, boolean>
  >({
    influencedBy: true,
    contemporaries: true,
    influenced: true,
  });

  return (
    <div className="border-l border-rule pl-6">
      <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-4">
        {HEADING[locale]}
      </h2>

      {/* segment toggles for 三段 */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {(["influencedBy", "contemporaries", "influenced"] as const).map(
          (k) => (
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
          )
        )}
      </div>

      {/* 4 rows: 受影响 → 本人 → 同辈 → 影响了 */}
      <div className="space-y-5">
        {enabled.influencedBy && (
          <Section
            title={LABELS[locale].influencedBy}
            people={data.influencedBy}
            emptyLabel={EMPTY[locale].influencedBy}
            locale={locale}
          />
        )}

        {/* 本人 — 普通一行,不可点 */}
        <SelfRow
          title={LABELS[locale].self}
          person={center}
          locale={locale}
        />

        {enabled.contemporaries && (
          <Section
            title={LABELS[locale].contemporaries}
            people={data.contemporaries}
            emptyLabel={EMPTY[locale].contemporaries}
            locale={locale}
          />
        )}
        {enabled.influenced && (
          <Section
            title={LABELS[locale].influenced}
            people={data.influenced}
            emptyLabel={EMPTY[locale].influenced}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}

/* ── 本人行 ─────────────────────────────────────────────────────── */

function SelfRow({
  title,
  person,
  locale,
}: {
  title: string;
  person: Photographer;
  locale: Locale;
}) {
  const m = getMovement(person.movements[0]);
  const color = m?.color ?? "var(--color-rule-2)";
  return (
    <div>
      <div className="font-display text-[11px] tracking-[0.16em] text-accent mb-2 flex items-baseline gap-2">
        <span>{title}</span>
      </div>
      {/* 与 PersonChip 同尺寸,但: 不是 Link, accent 描边表示当前焦点,
           cursor-default 表明不可交互 */}
      <div
        className="inline-flex items-center gap-2 px-2 h-9 border border-accent text-ink bg-accent/5 cursor-default select-none max-w-full"
        aria-current="page"
      >
        <span
          className="w-1.5 h-1.5 shrink-0"
          style={{ background: color }}
        />
        <span className="font-display text-[12px] truncate">
          {getPhotographerName(person, locale)}
        </span>
        <span className="ml-2 font-mono tabular-nums text-[10px] text-ink-3 shrink-0">
          {person.born}–{person.died ?? (locale === "en" ? "now" : "今")}
        </span>
      </div>
    </div>
  );
}

/* ── 关系段 ────────────────────────────────────────────────────── */

function Section({
  title,
  people,
  emptyLabel,
  locale,
}: {
  title: string;
  people: Photographer[];
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
      replace
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
