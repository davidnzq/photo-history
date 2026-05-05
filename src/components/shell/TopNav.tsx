"use client";

import Link from "next/link";
import { useLocale } from "@/components/shell/LocaleProvider";
import { useT } from "@/lib/i18n";

export function TopNav() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <header className="border-b border-rule bg-bg/80 backdrop-blur-md sticky top-0 z-30">
      <div className="px-6 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-baseline gap-3 group" aria-label={t("brand.full")}>
          <span className="font-display text-[22px] font-medium tracking-tight text-ink group-hover:text-accent transition-colors">
            {t("brand.zh")}
          </span>
          <span className="font-display text-[11px] tracking-[0.18em] uppercase text-ink-3">
            {t("brand.en")}
          </span>
        </Link>

        <div className="flex-1" />

        {/* Locale toggle — explicit 中/EN segments,体现当前语言,WCAG 4.5:1 */}
        <div
          className="inline-flex border border-rule"
          role="group"
          aria-label={t("locale.aria")}
        >
          <button
            type="button"
            onClick={() => setLocale("zh")}
            aria-pressed={locale === "zh"}
            className={
              locale === "zh"
                ? "px-2.5 h-7 text-[12px] font-display bg-accent text-bg"
                : "px-2.5 h-7 text-[12px] font-display text-ink-2 hover:text-ink transition-colors"
            }
          >
            中
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            aria-pressed={locale === "en"}
            className={
              locale === "en"
                ? "px-2.5 h-7 text-[12px] font-display tracking-wider bg-accent text-bg"
                : "px-2.5 h-7 text-[12px] font-display tracking-wider text-ink-2 hover:text-ink transition-colors"
            }
          >
            EN
          </button>
        </div>

        <Link
          href="/about"
          className="text-ink-2 hover:text-ink transition-colors p-2 -m-2"
          aria-label={t("nav.about")}
          title={t("nav.about")}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
