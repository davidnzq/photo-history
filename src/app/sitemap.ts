import type { MetadataRoute } from "next";
import {
  allPhotographerIds,
  allMovementIds,
  allTagSlugs,
} from "@/lib/data";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://photo-history.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const top = [
    "/",
    "/network",
    "/movements",
    "/lineage",
    "/tags",
    "/about",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));
  const photographers = allPhotographerIds().map((id) => ({
    url: `${SITE_URL}/p/${id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const movements = allMovementIds().map((id) => ({
    url: `${SITE_URL}/movements/${id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const tags = allTagSlugs().map((slug) => ({
    url: `${SITE_URL}/tag/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  return [...top, ...photographers, ...movements, ...tags];
}
