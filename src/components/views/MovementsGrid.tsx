"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Movement, Photographer } from "@/lib/types";
import { PHOTOGRAPHERS } from "@/lib/data";
import { parseFilter, passes } from "@/lib/filter";
import { useT, getMovementName, getPhotographerName } from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";

type Props = { movements: Movement[] };

export function MovementsGrid(props: Props) {
  return (
    <Suspense fallback={null}>
      <MovementsGridInner {...props} />
    </Suspense>
  );
}

function MovementsGridInner({ movements }: Props) {
  const sp = useSearchParams();
  const filter = useMemo(() => parseFilter(sp), [sp]);
  const t = useT();
  const { locale } = useLocale();

  const sorted = [...movements].sort((a, b) => a.period.peak - b.period.peak);

  /**
   * 流派/地域筛选生效 (per UX 反馈, 改为隐藏不命中项, 不再 dim):
   * - 流派 filter 直接命中 movement.id
   * - 地域 filter 命中 movement 内代表人物中是否至少一人通过 region 筛选
   */
  function isMovementVisible(m: Movement): boolean {
    if (filter.movementIds.length && !filter.movementIds.includes(m.id))
      return false;
    if (filter.regions.length) {
      const reps = PHOTOGRAPHERS.filter((p) => p.movements.includes(m.id));
      const anyMatch = reps.some((p) => passes(p, filter));
      if (!anyMatch) return false;
    }
    return true;
  }

  const visible = sorted.filter(isMovementVisible);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="px-6 lg:px-12 py-10 max-w-[1400px] mx-auto">
        <header className="mb-8">
          <h1 className="font-display text-3xl text-ink tracking-tight">
            {t("movements.heading")}
          </h1>
          <p className="text-ink-2 text-sm mt-2 max-w-xl">
            {t("movements.intro", { n: visible.length })}
          </p>
        </header>
        {visible.length === 0 ? (
          <div className="text-ink-3 italic text-sm">
            {t("filter.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((m) => (
              <MovementCard key={m.id} movement={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MovementCard({ movement: m }: { movement: Movement }) {
  const { locale } = useLocale();
  // up to 4 representative photographers from PHOTOGRAPHERS where movements[0] === m.id
  const reps: Photographer[] = PHOTOGRAPHERS.filter(
    (p) => p.movements[0] === m.id
  ).slice(0, 4);
  const startYear = m.period.start;
  const endYear = m.period.end ?? new Date().getFullYear();
  return (
    <Link
      href={`/movements/${m.id}`}
      className="group block bg-bg-elev border border-rule hover:border-rule-2 transition-all overflow-hidden"
    >
      {/* color stripe */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${m.color} 0%, transparent 90%)`,
        }}
      />
      <div className="p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-xl text-ink leading-tight">
            {getMovementName(m, locale)}
          </h2>
          <span className="font-display text-[11px] tracking-wider text-ink-3 tabular-nums">
            {startYear}–{endYear}
          </span>
        </div>
        {/* period bar with peak marker */}
        <div className="relative h-2 bg-rule mb-4">
          <div
            className="absolute inset-y-0"
            style={{
              left: 0,
              right: 0,
              background: `linear-gradient(90deg, transparent, ${m.color}66, transparent)`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3"
            style={{
              left: `${
                ((m.period.peak - startYear) /
                  Math.max(1, endYear - startYear)) *
                100
              }%`,
              background: m.color,
            }}
          />
        </div>

        <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-3 mb-4">
          {m.description}
        </p>

        {reps.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {reps.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2 h-6 border border-rule text-[11px] text-ink-2"
              >
                <span className="w-1 h-1" style={{ background: m.color }} />
                {getPhotographerName(p, locale)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
