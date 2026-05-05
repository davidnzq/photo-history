"use client";

import { useT } from "@/lib/i18n";

export function LocaleAwareFooter() {
  const t = useT();
  return (
    <footer className="px-6 py-4 border-t border-rule text-ink-3 text-xs flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between font-display tracking-wider uppercase">
      <span>{t("brand.full")}</span>
      <span className="text-right">{t("about.byline")}</span>
    </footer>
  );
}
