/**
 * Photo History — type definitions
 * Source of truth for the curated dataset under src/data/*.json.
 */

export type Region =
  | "europe"
  | "n-america"
  | "latin"
  | "asia"
  | "africa"
  | "oceania"
  | "middle-east";

export type Photographer = {
  /** kebab-case unique id, used in URLs and edges */
  id: string;
  /** primary Latin/English name */
  name: string;
  /** Chinese display name */
  nameZh: string;
  born: number;
  /** undefined = still living */
  died?: number | null;
  /** ISO-3166 alpha-2 */
  country: string;
  region: Region;
  /** Movement.id list. movements[0] is the primary (used for swim-lane / node color). */
  movements: string[];
  /** authoritative source for influence relations */
  influencedBy: string[];
  studentOf?: string[];
  teacherOf?: string[];
  /** 2-3 line summary in Chinese */
  bio: string;
  /** optional longer biographical paragraph */
  bioLong?: string;
  keyDates: { year: number; event: string }[];
  works: PhotographerWork[];
  techniques: string[];
  quote?: string;
  /** reference URLs (Wikipedia / archive / book) */
  sources?: string[];
  /** optional portrait avatar URL */
  portrait?: string;
};

export type PhotographerWork = {
  title: string;
  year?: number;
  /** external URL (Wikimedia Commons / Unsplash / etc). null = no image, render gradient fallback */
  image: string | null;
  credit: string;
  /** optional source / detail page URL */
  href?: string;
};

export type Movement = {
  id: string;
  nameZh: string;
  nameEn: string;
  period: { start: number; peak: number; end?: number | null };
  countries: string[];
  /** hex color tuned for dark background */
  color: string;
  description: string;
  arc: string;
  precededBy: string[];
  succeededBy: string[];
  /** signature works that represent the movement */
  signatureWorks: { photographerId: string; workIndex: number }[];
};

export type HistoryEvent = {
  year: number;
  label: string;
  tier: "tech" | "exhibition" | "publication" | "institution";
};

export type LineageNodeKind =
  | "root"
  | "event"
  | "movement"
  | "photographer";

export type LineageNode = {
  id: string;
  /** display label */
  label: string;
  kind: LineageNodeKind;
  year?: number | null;
  /** when kind='movement'|'photographer', explicit reference id (else derived from id path prefix) */
  refId?: string;
  children?: LineageNode[];
};

/* ── Derived view models ───────────────────────────────────────── */

export type Edge = {
  from: string;
  to: string;
  type?: "influence" | "mentor";
};

export type EgoGraph = {
  /** the focused photographer id */
  centerId: string;
  influencedBy: Photographer[];
  contemporaries: Photographer[];
  influenced: Photographer[];
};

/* ── Filter state (URL search params) ──────────────────────────── */

export type FilterState = {
  movementIds: string[];
  regions: Region[];
  yearRange: [number, number];
};
