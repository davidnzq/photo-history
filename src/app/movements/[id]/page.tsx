import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMovement, allMovementIds, getPhotographer } from "@/lib/data";
import { MovementDetail } from "@/components/views/MovementDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return allMovementIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const m = getMovement(id);
  if (!m) return {};
  const ogImage = (() => {
    for (const sw of m.signatureWorks) {
      const p = getPhotographer(sw.photographerId);
      const w = p?.works[sw.workIndex];
      if (w?.image) return w.image;
    }
    return undefined;
  })();
  return {
    title: `${m.nameZh} ${m.nameEn}`,
    description: m.description,
    openGraph: {
      title: `${m.nameZh} · ${m.nameEn}`,
      description: m.description,
      type: "article",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${m.nameZh} · ${m.nameEn}`,
      description: m.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function MovementPage({ params }: PageProps) {
  const { id } = await params;
  const m = getMovement(id);
  if (!m) notFound();
  return <MovementDetail movement={m} />;
}
