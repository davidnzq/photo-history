import photographersData from "@/data/photographers.json";
import movementsData from "@/data/movements.json";
import eventsData from "@/data/events.json";
import lineageData from "@/data/lineage.json";
import type {
  Photographer,
  Movement,
  HistoryEvent,
  LineageNode,
} from "./types";

export const PHOTOGRAPHERS = photographersData as Photographer[];
export const MOVEMENTS = movementsData as Movement[];
export const EVENTS = eventsData as HistoryEvent[];
export const LINEAGE = lineageData as LineageNode;

/** O(1) lookup helpers — built once at module load. */
const photographerById = new Map(PHOTOGRAPHERS.map((p) => [p.id, p]));
const movementById = new Map(MOVEMENTS.map((m) => [m.id, m]));

export function getPhotographer(id: string): Photographer | undefined {
  return photographerById.get(id);
}

export function getMovement(id: string): Movement | undefined {
  return movementById.get(id);
}

/** All photographer ids (for generateStaticParams) */
export function allPhotographerIds(): string[] {
  return PHOTOGRAPHERS.map((p) => p.id);
}

/** All movement ids (for generateStaticParams) */
export function allMovementIds(): string[] {
  return MOVEMENTS.map((m) => m.id);
}

/* ── Tag (technique) aggregation ────────────────────────────────
   每位摄影师的 techniques: string[] 是自由文本标签 (徕卡 / 8x10 /
   决定性瞬间 / 战地黑白 等). 我们把它当成一个独立的"探索维度",
   提供 slug 化的稳定 URL (/tag/[slug]) + 反查表 + 总览页. */

/**
 * Encode a free-form tag string into a URL-safe ASCII slug.
 *
 * Next.js 16 在 prod runtime 对 non-ASCII dynamic-route slug 匹配不稳
 * (build 时生成 .html 文件能正常出, 但 next start 收到 %E5... 路径时
 * 不能命中). 因此我们用一个稳定的 ASCII 哈希:
 *   - ASCII 输入 → 直接 kebab (8x10, leica-50mm)
 *   - 含 CJK / 其它 → "t-{8-char-hex}" 形式 (deterministic, 无碰撞)
 *
 * 标签的可读 label 本身存在 TagInfo.label 上, 用于显示;slug 仅作 URL.
 */
export function tagSlug(label: string): string {
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  // ASCII-only path: keep human-readable
  if (/^[a-z0-9-]+$/.test(cleaned)) return cleaned;
  // Otherwise: deterministic hash (FNV-1a 32-bit, hex-encoded)
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "t-" + (h >>> 0).toString(16).padStart(8, "0");
}

export type TagInfo = {
  slug: string;
  label: string;
  photographerIds: string[];
};

const _tagIndex: Map<string, TagInfo> = (() => {
  const map = new Map<string, TagInfo>();
  for (const p of PHOTOGRAPHERS) {
    for (const t of p.techniques ?? []) {
      const slug = tagSlug(t);
      if (!slug) continue;
      const existing = map.get(slug);
      if (existing) {
        if (!existing.photographerIds.includes(p.id)) {
          existing.photographerIds.push(p.id);
        }
      } else {
        map.set(slug, { slug, label: t, photographerIds: [p.id] });
      }
    }
  }
  return map;
})();

export function getTag(slug: string): TagInfo | undefined {
  return _tagIndex.get(slug);
}

/** All tags sorted by photographer count desc (for the overview page). */
export function allTags(): TagInfo[] {
  return [..._tagIndex.values()].sort(
    (a, b) =>
      b.photographerIds.length - a.photographerIds.length ||
      a.label.localeCompare(b.label, "zh-Hans-CN")
  );
}

export function allTagSlugs(): string[] {
  return [..._tagIndex.keys()];
}

/** Min/max born year across the corpus, used as default timeline range. */
export const YEAR_BOUNDS: [number, number] = (() => {
  let min = Infinity;
  let max = -Infinity;
  for (const p of PHOTOGRAPHERS) {
    if (p.born < min) min = p.born;
    if (p.died && p.died > max) max = p.died;
    else if (!p.died) max = Math.max(max, new Date().getFullYear());
  }
  return [Math.floor(min / 10) * 10, Math.ceil(max / 10) * 10];
})();
