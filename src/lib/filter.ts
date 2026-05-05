import type { FilterState, Photographer, Region } from "./types";
import { PHOTOGRAPHERS } from "./data";

export function defaultFilter(): FilterState {
  return {
    movementIds: [],
    regions: [],
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
  const out = defaultFilter();
  if (m) out.movementIds = m.split(",").filter(Boolean);
  if (r) out.regions = r.split(",").filter(Boolean) as Region[];
  return out;
}

export function toSearchParams(f: FilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.movementIds.length) sp.set("m", f.movementIds.join(","));
  if (f.regions.length) sp.set("r", f.regions.join(","));
  return sp;
}

/**
 * "Pass" the filter — match ALL of (movements?, regions?).
 *
 * 数据规模较小,年代筛选意义不大,已移除。如未来再加回,在此函数和
 * FilterState 中扩展即可。
 */
export function passes(p: Photographer, f: FilterState): boolean {
  if (
    f.movementIds.length &&
    !p.movements.some((m) => f.movementIds.includes(m))
  ) {
    return false;
  }
  if (f.regions.length && !f.regions.includes(p.region)) {
    return false;
  }
  return true;
}

export function applyFilter(f: FilterState): Photographer[] {
  return PHOTOGRAPHERS.filter((p) => passes(p, f));
}
