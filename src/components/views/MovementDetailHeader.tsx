"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

/**
 * Movement detail "back" affordance — respects user's actual history
 * (per UX 反馈: from timeline → movement → back should return to timeline,
 * not flat to /movements grid). Falls back to /movements when there's no
 * history (e.g. direct visit to a movement page).
 */
export function MovementDetailHeader() {
  const router = useRouter();
  const t = useT();
  const label = t("brand") === "Photography History" ? "Back" : "返回";

  function back() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/movements");
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
