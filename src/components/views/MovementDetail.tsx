import Link from "next/link";
import type { Movement } from "@/lib/types";
import { PHOTOGRAPHERS, getMovement, getPhotographer } from "@/lib/data";
import { WorkImage } from "@/components/ui/WorkImage";
import { MovementDetailHeader } from "@/components/views/MovementDetailHeader";

type Props = { movement: Movement };

export function MovementDetail({ movement: m }: Props) {
  const startYear = m.period.start;
  const peakYear = m.period.peak;
  const endYear = m.period.end ?? new Date().getFullYear();
  const span = Math.max(1, endYear - startYear);
  const peakLeft = ((peakYear - startYear) / span) * 100;

  const members = PHOTOGRAPHERS.filter((p) => p.movements.includes(m.id))
    .sort((a, b) => a.born - b.born);

  const signatureWorks = m.signatureWorks
    .map((sw) => {
      const p = getPhotographer(sw.photographerId);
      const w = p?.works[sw.workIndex];
      if (!p || !w) return null;
      return { p, w };
    })
    .filter((x): x is { p: NonNullable<ReturnType<typeof getPhotographer>>; w: NonNullable<ReturnType<typeof getPhotographer>>['works'][number] } => !!x);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <MovementDetailHeader />

      <div className="px-6 lg:px-12 py-12 max-w-[1280px] mx-auto">
        <header className="mb-10">
          <div
            className="font-display text-[10px] tracking-[0.24em] uppercase mb-2"
            style={{ color: m.color }}
          >
            {m.nameEn}
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-ink tracking-tight leading-tight mb-2">
            {m.nameZh}
          </h1>
          <div className="text-ink-3 text-sm font-mono tabular-nums">
            {startYear} <span className="mx-2 text-ink-3">→ {peakYear}</span> → {endYear}
          </div>

          {/* Peak bar */}
          <div className="relative h-3 bg-bg-elev mt-4 mb-2 max-w-2xl">
            <div
              className="absolute inset-y-0"
              style={{
                left: 0,
                right: 0,
                background: `linear-gradient(90deg, transparent, ${m.color}55, transparent)`,
              }}
            />
            <div
              className="absolute -top-1 -bottom-1 w-0.5"
              style={{ left: `${peakLeft}%`, background: m.color }}
            />
            <div
              className="absolute -top-5"
              style={{ left: `calc(${peakLeft}% - 12px)` }}
            >
              <span className="font-display text-[10px] tracking-wider text-ink-2">
                ▼ {peakYear}
              </span>
            </div>
          </div>
          <div className="flex justify-between max-w-2xl text-[10px] text-ink-3 font-mono tabular-nums">
            <span>{startYear}</span>
            <span>{endYear}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          <div className="space-y-10">
            {/* Description */}
            <section>
              <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-3">
                介绍 / About
              </h2>
              <p className="text-[15px] text-ink leading-relaxed">{m.description}</p>
            </section>

            {/* Arc */}
            <section>
              <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-3">
                兴衰 / Arc
              </h2>
              <p className="text-[14px] text-ink-2 leading-relaxed italic">{m.arc}</p>
            </section>

            {/* Signature works */}
            {signatureWorks.length > 0 && (
              <section>
                <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-4">
                  代表作 / Signature Works
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {signatureWorks.map(({ p, w }, i) => (
                    <div key={i} className="space-y-2">
                      <WorkImage
                        title={w.title}
                        year={w.year}
                        src={w.image}
                        credit={w.credit}
                        href={w.href}
                        fallbackColor={m.color}
                        size="lg"
                      />
                      <div>
                        <Link
                          href={`/p/${p.id}`}
                          className="font-display text-sm text-ink hover:text-accent block leading-tight"
                        >
                          {p.nameZh}
                        </Link>
                        <span className="text-[11px] text-ink-3 font-mono">{w.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8">
            {/* Members */}
            <section>
              <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-3">
                代表人物 / Figures · {members.length}
              </h2>
              <div className="space-y-1">
                {members.map((p) => (
                  <Link
                    key={p.id}
                    href={`/p/${p.id}`}
                    className="flex items-center gap-3 px-2 py-1.5 hover:bg-bg-elev transition-colors group"
                  >
                    <span
                      className="w-1 h-1 shrink-0"
                      style={{ background: m.color }}
                    />
                    <span className="font-display text-sm text-ink group-hover:text-accent flex-1 truncate">
                      {p.nameZh}
                    </span>
                    <span className="font-mono tabular-nums text-[10px] text-ink-3">
                      {p.born}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Lineage */}
            <section>
              <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-3">
                承接关系 / Lineage
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] tracking-wider uppercase text-ink-3 mb-1.5">前辈</div>
                  <RelChips ids={m.precededBy} />
                </div>
                <div>
                  <div className="text-[10px] tracking-wider uppercase text-ink-3 mb-1.5">后继</div>
                  <RelChips ids={m.succeededBy} />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function RelChips({ ids }: { ids: string[] }) {
  if (ids.length === 0)
    return <span className="text-[12px] text-ink-3 italic">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const m = getMovement(id);
        if (!m) return null;
        return (
          <Link
            key={id}
            href={`/movements/${id}`}
            className="inline-flex items-center gap-1.5 px-2 h-7 border text-[11px] hover:bg-bg-elev transition-colors"
            style={{ borderColor: `${m.color}66`, color: m.color }}
          >
            <span className="w-1 h-1" style={{ background: m.color }} />
            {m.nameZh}
          </Link>
        );
      })}
    </div>
  );
}
