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
