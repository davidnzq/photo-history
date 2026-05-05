import type { Photographer, Edge, EgoGraph, Movement } from "./types";
import { PHOTOGRAPHERS, getPhotographer } from "./data";

/* ── Edge graph (memoized) ─────────────────────────────────────── */

let _edges: Edge[] | null = null;
let _reverseInfluence: Map<string, string[]> | null = null;
let _influenceCount: Map<string, number> | null = null;

export function buildEdges(): Edge[] {
  if (_edges) return _edges;
  const out: Edge[] = [];
  for (const p of PHOTOGRAPHERS) {
    for (const src of p.influencedBy) {
      out.push({ from: src, to: p.id, type: "influence" });
    }
    for (const teacher of p.studentOf ?? []) {
      out.push({ from: teacher, to: p.id, type: "mentor" });
    }
  }
  _edges = out;
  return out;
}

/** id → list of photographer ids that this person influenced. */
export function reverseInfluence(): Map<string, string[]> {
  if (_reverseInfluence) return _reverseInfluence;
  const map = new Map<string, string[]>();
  for (const p of PHOTOGRAPHERS) {
    for (const src of p.influencedBy) {
      if (!map.has(src)) map.set(src, []);
      map.get(src)!.push(p.id);
    }
  }
  _reverseInfluence = map;
  return map;
}

/** influence in-degree (= "被引用为 influencedBy 的次数") used for node sizing. */
export function influenceCount(): Map<string, number> {
  if (_influenceCount) return _influenceCount;
  const m = new Map<string, number>();
  const rev = reverseInfluence();
  for (const [id, list] of rev) m.set(id, list.length);
  _influenceCount = m;
  return m;
}

/* ── Ego graph for the detail drawer / per-person page ──────────── */

/**
 * Definition of "contemporary":
 *   - lifespan (born..died||now) overlaps subject's by ≥ 20 years
 *   - shares ≥ 1 movement
 *   - excludes the subject's direct teachers and direct students
 */
export function egoGraph(centerId: string): EgoGraph | null {
  const center = getPhotographer(centerId);
  if (!center) return null;

  const ibIds = new Set(center.influencedBy);
  const influenced = (reverseInfluence().get(centerId) ?? []).map((id) => id);
  const influencedSet = new Set(influenced);

  const subjStart = center.born;
  const subjEnd = center.died ?? new Date().getFullYear();
  const subjMovements = new Set(center.movements);

  const contemporaries: Photographer[] = [];
  for (const p of PHOTOGRAPHERS) {
    if (p.id === centerId) continue;
    if (ibIds.has(p.id) || influencedSet.has(p.id)) continue;
    const pStart = p.born;
    const pEnd = p.died ?? new Date().getFullYear();
    const overlap = Math.min(subjEnd, pEnd) - Math.max(subjStart, pStart);
    if (overlap < 20) continue;
    if (![...subjMovements].some((m) => p.movements.includes(m))) continue;
    contemporaries.push(p);
  }

  // Sort each bucket by influence count desc, then by born year asc.
  const byImpact = (a: Photographer, b: Photographer) => {
    const ic = influenceCount();
    const da = (ic.get(b.id) ?? 0) - (ic.get(a.id) ?? 0);
    return da !== 0 ? da : a.born - b.born;
  };

  return {
    centerId,
    influencedBy: [...ibIds]
      .map(getPhotographer)
      .filter((p): p is Photographer => !!p)
      .sort(byImpact),
    contemporaries: contemporaries.sort(byImpact),
    influenced: influenced
      .map(getPhotographer)
      .filter((p): p is Photographer => !!p)
      .sort(byImpact),
  };
}

/* ── Force-graph layout seeds ───────────────────────────────────── */

/**
 * Pre-computed cluster layout: each movement gets a centroid arranged on a
 * logarithmic spiral by `period.peak`; photographers cluster around their
 * primary movement centroid with stable noise.
 *
 * Returns positions in an arbitrary coordinate system; the consuming view
 * normalizes to its viewport.
 */
export function clusterLayout(movements: Movement[]): Map<string, { x: number; y: number }> {
  const centroids = new Map<string, { x: number; y: number }>();
  const sorted = [...movements].sort((a, b) => a.period.peak - b.period.peak);
  const A = 18; // spiral coefficient
  sorted.forEach((m, i) => {
    const t = i * 0.6;
    const r = A * Math.sqrt(t + 1);
    const angle = t;
    centroids.set(m.id, { x: r * Math.cos(angle), y: r * Math.sin(angle) });
  });

  const positions = new Map<string, { x: number; y: number }>();
  for (const p of PHOTOGRAPHERS) {
    const primary = p.movements[0];
    const c = centroids.get(primary) ?? { x: 0, y: 0 };
    // stable pseudo-random noise from id hash
    let h = 0;
    for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) | 0;
    const nx = ((h & 0xffff) / 0xffff - 0.5) * 6;
    const ny = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 6;
    positions.set(p.id, { x: c.x + nx, y: c.y + ny });
  }
  return positions;
}
