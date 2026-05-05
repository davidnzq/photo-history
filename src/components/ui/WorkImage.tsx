"use client";

import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";

type Props = {
  title: string;
  year?: number;
  src: string | null;
  credit?: string;
  href?: string;
  fallbackColor?: string;
  /** size hint */
  size?: "sm" | "md" | "lg";
};

/**
 * Museum-style photo frame with graceful fallback to gradient + title overlay
 * when src is null or fails to load.
 */
export function WorkImage({ title, year, src, credit, href, fallbackColor, size = "md" }: Props) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;

  const aspect = size === "lg" ? "aspect-[4/3]" : "aspect-[3/4]";

  const inner = (
    <figure className={clsx("group relative photo-frame overflow-hidden", aspect)}>
      {showImage ? (
        <Image
          src={src!}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover grayscale-[0.15] group-hover:grayscale-0 transition-all duration-500"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="absolute inset-0 photo-fallback flex items-end"
          style={
            {
              "--fb-color": fallbackColor ? `${fallbackColor}66` : undefined,
            } as React.CSSProperties
          }
        >
          <div className="px-3 pb-2">
            <div className="font-display text-[11px] tracking-[0.18em] uppercase text-ink-3">
              {year ?? "—"}
            </div>
            <div className="font-display text-[13px] text-ink mt-0.5 leading-tight">
              {title}
            </div>
          </div>
        </div>
      )}
      {/* Caption overlay on hover when image is present */}
      {showImage && (
        <figcaption className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-12 bg-gradient-to-t from-black/85 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="font-display text-[11px] tracking-[0.18em] uppercase text-ink-3">
            {year ?? ""}
          </div>
          <div className="font-display text-[13px] text-ink leading-tight">
            {title}
          </div>
          {credit && (
            <div className="text-[10px] text-ink-3 mt-1 truncate">{credit}</div>
          )}
        </figcaption>
      )}
    </figure>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
