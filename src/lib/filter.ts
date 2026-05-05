import type { FilterState, Photographer, Region } from "./types";
import { PHOTOGRAPHERS, YEAR_BOUNDS } from "./data";

export function defaultFilter(): FilterState {
  return {
    movementIds: [],
    regions: [],
    yearRange: YEAR_BOUNDS,
  };
}

export function parseFilter(
  search: URLSearchParams | Record<string, string | string[] | undefined>
): FilterState {
  const get = (k: string): string | undefined => {
    if (search instanceof URLSearchParams) return search.get(k) ?? undefined;
    const v = search[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const m = get("m");
  const r = get("r");
  const y = get("y");
  const out = defaultFilter();
  if (m) out.movementIds = m.split(",").filter(Boolean);
  if (r) out.regions = r.split(",").filter(Boolean) as Region[];
  if (y) {
    const [a, b] = y.split("-").map((s) => parseInt(s, 10));
    if (Number.isFinite(a) && Number.isFinite(b)) out.yearRange = [a, b];
  }
  return out;
}

export function toSearchParams(f: FilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.movementIds.length) sp.set("m", f.movementIds.join(","));
  if (f.regions.length) sp.set("r", f.regions.join(","));
  if (f.yearRange[0] !== YEAR_BOUNDS[0] || f.yearRange[1] !== YEAR_BOUNDS[1]) {
    sp.set("y", `${f.yearRange[0]}-${f.yearRange[1]}`);
  }
  return sp;
}

/**
 * "Pass" the filter — match ALL of (movements?, regions?, yearRange).
 * yearRange match: lifespan overlaps the requested range.
 */
export function passes(p: Photographer, f: FilterState): boolean {
  if (f.movementIds.length && !p.movements.some((m) => f.movementIds.includes(m))) {
    return false;
  }
  if (f.regions.length && !f.regions.includes(p.region)) {
    return false;
  }
  const [ya, yb] = f.yearRange;
  const pStart = p.born;
  const pEnd = p.died ?? new Date().getFullYear();
  if (pEnd < ya || pStart > yb) return false;
  return true;
}

export function applyFilter(f: FilterState): Photographer[] {
  return PHOTOGRAPHERS.filter((p) => passes(p, f));
}
