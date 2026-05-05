import Link from "next/link";
import type { Movement, Photographer } from "@/lib/types";
import { PHOTOGRAPHERS } from "@/lib/data";

type Props = { movements: Movement[] };

export function MovementsGrid({ movements }: Props) {
  const sorted = [...movements].sort((a, b) => a.period.peak - b.period.peak);
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="px-6 lg:px-12 py-10 max-w-[1400px] mx-auto">
        <header className="mb-8">
          <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-1">
            Movements
          </div>
          <h1 className="font-display text-3xl text-ink tracking-tight">
            流派 · 运动
          </h1>
          <p className="text-ink-2 text-sm mt-2 max-w-xl">
            按高峰年份排列的 {movements.length} 个摄影流派/运动。点入查看兴衰、代表人物和承接关系。
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((m) => (
            <MovementCard key={m.id} movement={m} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MovementCard({ movement: m }: { movement: Movement }) {
  // up to 4 representative photographers from PHOTOGRAPHERS where movements[0] === m.id
  const reps = PHOTOGRAPHERS
    .filter((p) => p.movements[0] === m.id)
    .slice(0, 4);
  const startYear = m.period.start;
  const endYear = m.period.end ?? new Date().getFullYear();
  return (
    <Link
      href={`/movements/${m.id}`}
      className="group block bg-bg-elev border border-rule hover:border-rule-2 transition-colors overflow-hidden"
    >
      {/* color stripe */}
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${m.color} 0%, transparent 90%)` }}
      />
      <div className="p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-display text-xl text-ink leading-tight">
            {m.nameZh}
          </h2>
          <span className="font-display text-[11px] tracking-wider text-ink-3">
            {startYear}–{endYear}
          </span>
        </div>
        <div className="font-display text-[11px] tracking-[0.16em] uppercase text-ink-3 mb-3">
          {m.nameEn}
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
              left: `${((m.period.peak - startYear) / Math.max(1, endYear - startYear)) * 100}%`,
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
                {p.nameZh}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
