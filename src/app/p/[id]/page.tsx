import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPhotographer, allPhotographerIds } from "@/lib/data";
import { egoGraph } from "@/lib/relations";
import { PhotographerEntry } from "@/components/detail/PhotographerEntry";
import { EgoGraph } from "@/components/detail/EgoGraph";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return allPhotographerIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const p = getPhotographer(id);
  if (!p) return {};
  const lifespan = `${p.born}–${p.died ?? "今"}`;
  return {
    title: `${p.nameZh} ${p.name} (${lifespan})`,
    description: p.bio,
    openGraph: {
      title: `${p.nameZh} · ${p.name}`,
      description: p.bio,
      type: "profile",
      images: p.works[0]?.image ? [p.works[0].image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.nameZh} · ${p.name}`,
      description: p.bio,
      images: p.works[0]?.image ? [p.works[0].image] : undefined,
    },
  };
}

export default async function PhotographerPage({ params }: PageProps) {
  const { id } = await params;
  const p = getPhotographer(id);
  if (!p) notFound();
  const ego = egoGraph(id);
  if (!ego) notFound();

  // JSON-LD structured data for richer search results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    alternateName: p.nameZh,
    birthDate: String(p.born),
    deathDate: p.died ? String(p.died) : undefined,
    nationality: p.country,
    description: p.bio,
    knowsAbout: [...p.movements, ...p.techniques],
    image: p.portrait || p.works[0]?.image,
  };

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-rule bg-bg/85 backdrop-blur">
        <div className="px-6 h-12 flex items-center gap-3">
          <Link
            href="/"
            className="text-ink-2 hover:text-accent text-sm flex items-center gap-2 transition-colors"
            aria-label="返回时间线"
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
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>返回时间线</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-x-12 gap-y-10 px-6 lg:px-12 py-12 max-w-[1280px] mx-auto">
        <PhotographerEntry photographer={p} />
        <aside className="lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto pr-1">
          <div className="border-l border-rule pl-6">
            <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-4">
              影响关系图谱 / Ego Graph
            </h2>
            <EgoGraph data={ego} center={p} />
          </div>
        </aside>
      </div>
    </div>
  );
}
