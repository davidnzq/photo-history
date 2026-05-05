"use client";

import Link from "next/link";
import type { Photographer, Movement } from "@/lib/types";
import { getMovement, tagSlug } from "@/lib/data";
import { WorkImage } from "@/components/ui/WorkImage";
import { useLocale } from "@/components/shell/LocaleProvider";
import { getPhotographerName, getMovementName } from "@/lib/i18n";

type Props = {
  photographer: Photographer;
};

/* 国名表 — 中英两套, 按 locale 选 */
const COUNTRY_NAMES_ZH: Record<string, string> = {
  FR: "法国", UK: "英国", US: "美国", DE: "德国", IT: "意大利",
  ES: "西班牙", JP: "日本", CN: "中国", IN: "印度", MX: "墨西哥",
  BR: "巴西", AR: "阿根廷", CZ: "捷克", PL: "波兰", RU: "俄罗斯",
  HU: "匈牙利", AT: "奥地利", CH: "瑞士", BE: "比利时", NL: "荷兰",
  CA: "加拿大", AU: "澳大利亚", ZA: "南非", IL: "以色列",
  ML: "马里", PE: "秘鲁", CU: "古巴", LT: "立陶宛", VN: "越南",
  TW: "中国台湾", IR: "伊朗",
};
const COUNTRY_NAMES_EN: Record<string, string> = {
  FR: "France", UK: "UK", US: "USA", DE: "Germany", IT: "Italy",
  ES: "Spain", JP: "Japan", CN: "China", IN: "India", MX: "Mexico",
  BR: "Brazil", AR: "Argentina", CZ: "Czech Rep.", PL: "Poland", RU: "Russia",
  HU: "Hungary", AT: "Austria", CH: "Switzerland", BE: "Belgium", NL: "Netherlands",
  CA: "Canada", AU: "Australia", ZA: "South Africa", IL: "Israel",
  ML: "Mali", PE: "Peru", CU: "Cuba", LT: "Lithuania", VN: "Vietnam",
  TW: "Taiwan", IR: "Iran",
};

const SECTION_LABELS = {
  zh: {
    works: "代表作",
    keyDates: "关键年表",
    tags: "技法 / 标签",
    sources: "来源",
    nowAlive: "今",
  },
  en: {
    works: "Works",
    keyDates: "Key dates",
    tags: "Techniques / Tags",
    sources: "Sources",
    nowAlive: "now",
  },
};

export function PhotographerEntry({ photographer: p }: Props) {
  const { locale } = useLocale();
  const labels = SECTION_LABELS[locale];
  const countryMap =
    locale === "en" ? COUNTRY_NAMES_EN : COUNTRY_NAMES_ZH;

  const movements = p.movements
    .map((id) => getMovement(id))
    .filter((m): m is Movement => !!m);
  const primaryMovement = movements[0];

  const tagTitle = (t: string) =>
    locale === "en"
      ? `See all photographers tagged "${t}"`
      : `查看所有使用 "${t}" 的摄影师`;

  return (
    <article className="text-ink">
      {/* Header */}
      <header className="space-y-2">
        <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 tabular-nums">
          {countryMap[p.country] ?? p.country} · {p.born}–{p.died ?? labels.nowAlive}
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight leading-[1.05] text-ink">
          {getPhotographerName(p, locale)}
        </h1>
        <div className="text-ink-2 text-sm tracking-tight">
          {locale === "en" ? p.nameZh : p.name}
        </div>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {movements.map((m) => (
            <Link
              key={m.id}
              href={`/movements/${m.id}`}
              replace
              scroll={false}
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
              {getMovementName(m, locale)}
            </Link>
          ))}
        </div>
      </header>

      <hr className="hr-subtle my-6" />

      {/* Bio (long-form 中文 only this release) */}
      <section className="text-[15px] leading-relaxed text-ink-2">
        {p.bio}
      </section>

      {/* Works */}
      {p.works.length > 0 && (
        <section className="mt-8">
          <SectionLabel label={labels.works} />
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
          <SectionLabel label={labels.keyDates} />
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

      {/* Techniques — clickable tags */}
      {p.techniques.length > 0 && (
        <section className="mt-8">
          <SectionLabel label={labels.tags} />
          <div className="flex flex-wrap gap-1.5 mt-4">
            {p.techniques.map((t) => (
              <Link
                key={t}
                href={`/tag/${tagSlug(t)}`}
                replace
                scroll={false}
                className="inline-flex items-center gap-1.5 px-2.5 h-7 border border-rule text-ink-2 text-[12px] hover:border-accent hover:text-accent transition-colors"
                title={tagTitle(t)}
              >
                <span aria-hidden="true" className="text-ink-3 leading-none">
                  #
                </span>
                {t}
              </Link>
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
          <SectionLabel label={labels.sources} />
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

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-display text-xs tracking-[0.18em] text-ink-2">
        {label}
      </span>
      <span className="h-px flex-1 bg-rule" />
    </div>
  );
}
