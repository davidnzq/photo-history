"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  /** photographer id, used for the "open as full page" link */
  id: string;
  /** display title for sr/title bar */
  title: string;
};

/**
 * Right-side drawer for the intercepting-route photographer modal.
 *
 * Slide-in 240ms, full-screen on narrow viewports.
 * Close via:
 *   - close button (router.back)
 *   - mask click
 *   - Escape key
 *
 * The "open as full page" link goes to the same /p/[id] but with a
 * `_force=1` flag so we don't immediately re-intercept; the underlying
 * SSG page is the same content and is SEO indexable on its own.
 */
export function PhotographerDrawer({ children, id, title }: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc to close, focus the panel for keyboard users
  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        router.back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* mask */}
      <button
        type="button"
        aria-label="关闭"
        onClick={() => router.back()}
        className="absolute inset-0 bg-bg/70 backdrop-blur-[2px] cursor-default animate-[drawerFade_220ms_ease-out]"
        style={{
          animation: "drawerFade 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      {/* panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative h-full w-full lg:w-[70vw] lg:max-w-[1100px] bg-bg border-l border-rule shadow-[0_0_60px_rgba(0,0,0,0.6)] focus:outline-none flex flex-col"
        style={{
          animation: "drawerSlide 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* header */}
        <div className="sticky top-0 z-10 border-b border-rule bg-bg/85 backdrop-blur flex items-center gap-3 px-5 h-12">
          <span className="font-display text-[10px] tracking-[0.32em] uppercase text-ink-3">
            人 物 词 条
          </span>
          <span className="flex-1" />
          <Link
            href={`/p/${id}`}
            className="text-[11px] tracking-wider uppercase text-ink-3 hover:text-accent transition-colors flex items-center gap-1.5"
            title="在新页面打开（独立链接 / 适合分享）"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 3h7v7" />
              <path d="M21 3l-9 9" />
              <path d="M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
            </svg>
            <span>独立页</span>
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="关闭抽屉"
            className="w-9 h-9 -mr-2 flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* body — same composition as the standalone /p/[id] page */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* one-shot keyframes (scoped via inline <style> so we don't touch globals) */}
      <style>{`
        @keyframes drawerFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes drawerSlide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
