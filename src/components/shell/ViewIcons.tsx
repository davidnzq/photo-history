/**
 * 共享的视图图标 — 在 ViewSwitcher 顶部 nav 与 About 页中说明视图时复用,
 * 保证视觉一致性。
 *
 * Server-component-friendly (无 hooks / 无 'use client')。
 */

import type { SVGProps } from "react";

const COMMON: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function TimelineIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...COMMON}>
      <path d="M3 12h18" />
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
      <path d="M3 7v10" opacity={0.4} />
      <path d="M21 7v10" opacity={0.4} />
    </svg>
  );
}

export function NetworkIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...COMMON}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M6 6L12 12M18 6L12 12M12 18L12 12" />
    </svg>
  );
}

export function MovementsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...COMMON}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

export function LineageIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...COMMON}>
      <path d="M12 3v4" />
      <path d="M12 7c-3 0-6 2-6 5v3" />
      <path d="M12 7c3 0 6 2 6 5v3" />
      <path d="M12 7v8" />
      <circle cx="6" cy="17" r="1.5" fill="currentColor" />
      <circle cx="12" cy="17" r="1.5" fill="currentColor" />
      <circle cx="18" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function TagsIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...COMMON}>
      <path d="M3 12V5a2 2 0 012-2h7l8 8-9 9z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
    </svg>
  );
}
