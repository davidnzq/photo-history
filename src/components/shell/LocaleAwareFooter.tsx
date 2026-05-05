"use client";

import { useLocale } from "@/components/shell/LocaleProvider";
import { useT } from "@/lib/i18n";

/**
 * Footer 仅留两条信息:
 *   1. 站名 (单语,与 brand 一致)
 *   2. 数据来源轻提示 (CC-BY-SA / Wikimedia Commons)
 *
 * 制作人署名只出现在 About 页,Footer 不再重复。
 */
export function LocaleAwareFooter() {
  const t = useT();
  const { locale } = useLocale();
  return (
    <footer className="px-6 py-4 border-t border-rule text-ink-3 text-xs flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between font-display tracking-wider uppercase">
      <span>{t("brand")}</span>
      <span className="text-right">
        {locale === "en"
          ? "Data: CC-BY-SA & public-domain sources · Images: Wikimedia Commons"
          : "数据 · CC-BY-SA 等公开资料 · 作品图源自 Wikimedia Commons"}
      </span>
    </footer>
  );
}
