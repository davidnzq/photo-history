import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getTag,
  allTagSlugs,
  getPhotographer,
  getMovement,
} from "@/lib/data";
import { TagDetailHeader } from "./TagDetailHeader";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allTagSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = getTag(slug);
  if (!tag) return {};
  return {
    title: `${tag.label} · 摄影历`,
    description: `所有使用「${tag.label}」技法 / 介质 / 风格的摄影师 (${tag.photographerIds.length} 位)。`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = getTag(slug);
  if (!tag) notFound();

  const people = tag.photographerIds
    .map((id) => getPhotographer(id))
    .filter(<T,>(x: T | undefined): x is T => !!x)
    .sort((a, b) => (a.born ?? 0) - (b.born ?? 0));

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <TagDetailHeader />

      <div className="px-6 lg:px-12 py-12 max-w-[1280px] mx-auto">
        <header className="mb-10">
          <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-2">
            标签
          </div>
          <h1 className="font-display text-4xl text-ink tracking-tight mb-2">
            <span className="text-ink-3 mr-2">#</span>
            {tag.label}
          </h1>
          <p className="text-ink-2 text-sm">
            <strong className="text-ink tabular-nums">{people.length}</strong>{" "}
            位摄影师在自己的实践中标记了这一关键词。
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map((p) => {
            const m = getMovement(p.movements[0]);
            return (
              <Link
                key={p.id}
                href={`/p/${p.id}`}
                scroll={false}
                className="group flex flex-col gap-1 p-4 border border-rule bg-bg-elev/40 hover:border-rule-2 hover:bg-bg-elev transition-colors"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg text-ink group-hover:text-accent transition-colors">
                    {p.nameZh}
                  </h2>
                  <span className="font-mono tabular-nums text-[11px] text-ink-3">
                    {p.born}–{p.died ?? "今"}
                  </span>
                </div>
                <div className="text-[12px] text-ink-3">{p.name}</div>
                {m && (
                  <div className="mt-1 inline-flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5"
                      style={{ background: m.color }}
                    />
                    <span className="text-[11px] text-ink-2">{m.nameZh}</span>
                  </div>
                )}
                <p className="mt-2 text-[12px] text-ink-2 leading-relaxed line-clamp-2">
                  {p.bio}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
