"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "@/components/shell/LocaleProvider";
import { useT } from "@/lib/i18n";

export function TopNav() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  // i icon doubles as toggle: when on /about, click → close (back).
  // 直接访问 /about 时(history.length === 1, 比如新标签页直链),back()
  // 会让用户卡住,改为跳到首页。
  const isOnAbout = pathname === "/about";
  function toggleAbout() {
    if (isOnAbout) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    } else {
      router.push("/about");
    }
  }

  return (
    <header className="border-b border-rule bg-bg/80 backdrop-blur-md sticky top-0 z-30">
      <div className="px-6 h-14 flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center group"
          aria-label={t("brand")}
        >
          <span className="font-display text-[22px] font-medium tracking-tight text-ink group-hover:text-accent transition-colors">
            {t("brand")}
          </span>
        </Link>

        <div className="flex-1" />

        {/* Locale toggle — 视觉优雅版:两段都显示,当前态用 ink + 描线
            指示;非当前态 ink-3。点任意段切到该语言。比单按钮更直观,
            比 1/EN 等宽 segment 更轻。设计原则: state-clarity
            (Quick Reference §4) + visual-hierarchy via 字重/颜色对比。 */}
        <div
          role="group"
          aria-label={t("locale.aria")}
          className="font-display text-[12px] flex items-center"
        >
          <button
            type="button"
            onClick={() => setLocale("zh")}
            aria-pressed={locale === "zh"}
            className={
              locale === "zh"
                ? "px-1.5 h-8 flex items-center text-ink border-b border-accent -mb-px"
                : "px-1.5 h-8 flex items-center text-ink-3 hover:text-ink-2 transition-colors"
            }
          >
            中
          </button>
          <span className="text-ink-3 text-[10px] mx-0.5">/</span>
          <button
            type="button"
            onClick={() => setLocale("en")}
            aria-pressed={locale === "en"}
            className={
              locale === "en"
                ? "px-1.5 h-8 flex items-center text-ink border-b border-accent -mb-px tracking-[0.06em]"
                : "px-1.5 h-8 flex items-center text-ink-3 hover:text-ink-2 transition-colors tracking-[0.06em]"
            }
          >
            EN
          </button>
        </div>

        {/* About i icon — toggles open/close */}
        <button
          type="button"
          onClick={toggleAbout}
          aria-label={isOnAbout ? t("nav.about.close") : t("nav.about")}
          title={isOnAbout ? t("nav.about.close") : t("nav.about")}
          aria-expanded={isOnAbout}
          className="text-ink-2 hover:text-ink transition-colors p-2 -m-2"
        >
          {isOnAbout ? (
            // close glyph when About is open
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
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
          )}
        </button>
      </div>
    </header>
  );
}
