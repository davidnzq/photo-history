"use client";

import { useLocale } from "@/components/shell/LocaleProvider";

/**
 * Tiny locale-aware year span: "1908–2004" or "1942–今" / "1942–present".
 * Used in cards rendered from server components that themselves can't read
 * the locale cookie (we keep them SSG and let this small client unit re-
 * render after hydrate).
 */
export function LifeYears({
  born,
  died,
}: {
  born: number;
  died?: number | null;
}) {
  const { locale } = useLocale();
  const end = died ?? (locale === "en" ? "present" : "今");
  return (
    <span className="font-mono tabular-nums">
      {born}–{end}
    </span>
  );
}
