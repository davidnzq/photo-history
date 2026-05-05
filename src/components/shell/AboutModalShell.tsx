"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Slide-in shell for the About intercepting modal.
 * Reuses the same animation language as PhotographerDrawer.
 *
 * - mask click → close
 * - body scroll locked while open
 * - underlying close button + Esc handler live in AboutContent (it owns
 *   the in-content sticky header)
 */
export function AboutModalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="close"
        onClick={() => router.back()}
        tabIndex={-1}
        className="absolute inset-0 bg-bg/70 backdrop-blur-[2px] cursor-default"
        style={{ animation: "drawerFade 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative h-full w-full lg:w-[70vw] lg:max-w-[960px] bg-bg border-l border-rule shadow-[0_0_60px_rgba(0,0,0,0.6)] focus:outline-none flex flex-col"
        style={{ animation: "drawerSlide 260ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {children}
      </div>
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
