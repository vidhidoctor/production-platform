import type { MaterialColumnDTO } from "./material.types.js";

/** Decimal quantities travel as strings so no precision is lost. */
export type DecimalString = string;

/** One Punching Master row: a Component + Size of a design and its per-piece consumption. */
export interface PunchingItemDTO {
  id: number;
  designNo: string;
  component: string;
  size: string;
  stitch: number | null;
  laser: number | null;
  /** material code -> qty per piece (non-zero only) */
  consumption: Record<string, DecimalString>;
}

export interface PunchingMasterDTO {
  materials: MaterialColumnDTO[];
  items: PunchingItemDTO[];
}

/** POST /api/punching/master — one row; the design must already exist. */
export interface PunchingItemInput {
  designNo: string;
  component: string;
  size: string;
  /** whole number, 0 or more */
  stitch: number;
  /** optional whole number, 0 or more */
  laser?: number | null;
  consumption?: Record<string, number | string>;
}

// --- Designs: the parent record of the components ---

/** POST /api/punching/designs */
export interface DesignInput {
  designNo: string;
  productName: string;
}

/** GET /api/punching/designs — one row per design. */
export interface PunchingDesignSummaryDTO {
  designNo: string;
  productName: string;
  createdAt: string;
  components: { component: string; sizes: string[] }[];
}

/** GET /api/punching/designs/:designNo — the design with every component row. */
export interface PunchingDesignDTO {
  designNo: string;
  productName: string;
  materials: MaterialColumnDTO[];
  items: PunchingItemDTO[];
}

/** One size of a component, as entered in the component grid. */
export interface ComponentRowInput {
  size: string;
  stitch: number;
  laser?: number | null;
  consumption?: Record<string, number | string>;
}

/**
 * PUT /api/punching/designs/:designNo/components/:component — adds the component or replaces its
 * sizes. Sizes left out are removed (refused if a production order uses them).
 */
export interface ComponentInput {
  rows: ComponentRowInput[];
}
