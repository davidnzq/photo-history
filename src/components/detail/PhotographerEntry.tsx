import Link from "next/link";
import type { Photographer, Movement } from "@/lib/types";
import { getMovement } from "@/lib/data";
import { WorkImage } from "@/components/ui/WorkImage";

type Props = {
  photographer: Photographer;
};

const COUNTRY_NAMES: Record<string, string> = {
  FR: "法国", UK: "英国", US: "美国", DE: "德国", IT: "意大利",
  ES: "西班牙", JP: "日本", CN: "中国", IN: "印度", MX: "墨西哥",
  BR: "巴西", AR: "阿根廷", CZ: "捷克", PL: "波兰", RU: "俄罗斯",
  HU: "匈牙利", AT: "奥地利", CH: "瑞士", BE: "比利时", NL: "荷兰",
  CA: "加拿大", AU: "澳大利亚", ZA: "南非", IL: "以色列",
};

export function PhotographerEntry({ photographer: p }: Props) {
  const movements = p.movements
    .map((id) => getMovement(id))
    .filter((m): m is Movement => !!m);
  const primaryMovement = movements[0];

  return (
    <article className="text-ink">
      {/* Header */}
      <header className="space-y-2">
        <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3">
          {COUNTRY_NAMES[p.country] ?? p.country} · {p.born}–{p.died ?? "今"}
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05] text-ink">
          {p.nameZh}
        </h1>
        <div className="text-ink-2 text-sm tracking-tight">{p.name}</div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {movements.map((m) => (
            <Link
              key={m.id}
              href={`/movements/${m.id}`}
              className="inline-flex items-center gap-2 px-2.5 h-7 border text-[11px] hover:bg-bg-elev transition-colors"
              style={{
                borderColor: `${m.color}66`,
                color: m.color,
              }}
            >
              <span
                className="w-1.5 h-1.5"
                style={{ background: m.color }}
              />
              {m.nameZh}
            </Link>
          ))}
        </div>
      </header>

      <hr className="hr-subtle my-6" />

      {/* Bio */}
      <section className="text-[15px] leading-relaxed text-ink-2">
        {p.bio}
      </section>

      {/* Works */}
      {p.works.length > 0 && (
        <section className="mt-8">
          <SectionLabel zh="代表作" en="Works" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {p.works.map((w, i) => (
              <WorkImage
                key={i}
                title={w.title}
                year={w.year}
                src={w.image}
                credit={w.credit}
                href={w.href}
                fallbackColor={primaryMovement?.color}
              />
            ))}
          </div>
        </section>
      )}

      {/* Key dates */}
      {p.keyDates.length > 0 && (
        <section className="mt-8">
          <SectionLabel zh="关键年表" en="Key Dates" />
          <ol className="mt-4 space-y-2">
            {p.keyDates
              .slice()
              .sort((a, b) => a.year - b.year)
              .map((d, i) => (
                <li key={i} className="flex gap-4 text-sm">
                  <span className="font-mono tabular-nums text-ink-3 w-12 shrink-0">
                    {d.year}
                  </span>
                  <span className="text-ink-2">{d.event}</span>
                </li>
              ))}
          </ol>
        </section>
      )}

      {/* Techniques */}
      {p.techniques.length > 0 && (
        <section className="mt-8">
          <SectionLabel zh="技法" en="Techniques" />
          <div className="flex flex-wrap gap-1.5 mt-4">
            {p.techniques.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 h-7 border border-rule text-ink-2 text-[12px]"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Quote */}
      {p.quote && (
        <section className="mt-8 border-l-2 border-accent pl-4 py-1">
          <p className="font-display text-lg italic text-ink leading-relaxed">
            &ldquo;{p.quote}&rdquo;
          </p>
        </section>
      )}

      {/* Sources */}
      {p.sources && p.sources.length > 0 && (
        <section className="mt-10 pt-6 border-t border-rule">
          <SectionLabel zh="来源" en="Sources" />
          <ul className="mt-2 space-y-1">
            {p.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-ink-3 hover:text-accent break-all"
                >
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function SectionLabel({ zh, en }: { zh: string; en: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3">
        {en}
      </span>
      <span className="h-px flex-1 bg-rule" />
      <span className="font-display text-xs text-ink-2">{zh}</span>
    </div>
  );
}
