"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/lib/i18n";

type LocaleCtx = {
  locale: Locale;
  setLocale: (next: Locale) => void;
};

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  /** seed from server-read cookie; client reconciles after mount */
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // After mount, prefer client cookie if it's already there (handles
  // direct-link visits where SSR seeded "zh" because no cookie was sent
  // through the static page request).
  useEffect(() => {
    const fromCookie = readCookie(LOCALE_COOKIE);
    if (fromCookie === "zh" || fromCookie === "en") {
      if (fromCookie !== locale) setLocaleState(fromCookie);
    }
    // also keep <html lang> in sync for screen readers / SEO
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever locale changes, persist + re-sync html lang
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
  }, []);

  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useLocale() must be used inside <LocaleProvider>");
  return ctx;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + "="));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}
