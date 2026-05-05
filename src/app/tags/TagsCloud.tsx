"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TagInfo } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/components/shell/LocaleProvider";

type Props = { tags: TagInfo[] };

/**
 * Tags 总览 — 标签云风格。
 * 字号按出现频次缩放(O(log) 避免极端项把版面压扁), 同时提供
 * 顶部搜索 + 计数. 设计对齐 §4 visual-hierarchy via 字号 / 颜色对比.
 */
export function TagsCloud({ tags }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return tags;
    return tags.filter(
      (tg) =>
        tg.label.toLowerCase().includes(term) ||
        tg.slug.includes(term)
    );
  }, [tags, q]);

  // map count → font size (12px..28px logarithmic)
  const maxCount = Math.max(1, ...tags.map((tg) => tg.photographerIds.length));
  function sizeFor(count: number) {
    const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
    return 12 + Math.round(ratio * 16);
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="px-6 lg:px-12 py-10 max-w-[1280px] mx-auto">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink tracking-tight">
              {locale === "en" ? "Tags" : "标签"}
            </h1>
            <p className="text-ink-2 text-sm mt-2 max-w-xl">
              {locale === "en"
                ? `${tags.length} keywords / techniques / media — click into one to read every photographer who claimed it.`
                : `${tags.length} 个技法 · 介质 · 关键词。点入查看每个标签背后聚拢的摄影师群像。`}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 h-9 border border-rule focus-within:border-accent transition-colors w-full md:w-72 shrink-0">
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="text-ink-3 shrink-0"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("filter.search")}
              className="flex-1 bg-transparent text-ink outline-none text-[13px] placeholder:text-ink-3"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="text-ink-3 hover:text-ink text-[14px] leading-none w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="text-ink-3 italic text-sm">{t("filter.empty")}</div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-3">
            {filtered.map((tg) => (
              <Link
                key={tg.slug}
                href={`/tag/${tg.slug}`}
                scroll={false}
                className="group inline-flex items-baseline gap-1.5 hover:text-accent transition-colors"
                style={{ fontSize: sizeFor(tg.photographerIds.length) }}
              >
                <span className="font-display text-ink">
                  <span aria-hidden="true" className="text-ink-3 mr-0.5">
                    #
                  </span>
                  {tg.label}
                </span>
                <span className="font-mono tabular-nums text-ink-3 text-[10px]">
                  {tg.photographerIds.length}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
