"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/shell/LocaleProvider";

/** Smart back affordance — see MovementDetailHeader / PhotographerHeader. */
export function TagDetailHeader() {
  const router = useRouter();
  const { locale } = useLocale();
  const label = locale === "en" ? "Back" : "返回";

  function back() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/tags");
    }
  }

  return (
    <div className="sticky top-0 z-10 border-b border-rule bg-bg/85 backdrop-blur">
      <div className="px-6 h-12 flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          className="text-ink-2 hover:text-accent text-sm flex items-center gap-2 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
}
