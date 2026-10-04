import type { MaterialCategory, MaterialUnit } from "../constants/materials.js";
import type { DecimalString } from "./punching.types.js";

export type PurchaseDTO =
  | { kind: "SEQUENCE"; cds: DecimalString; rolls: DecimalString }
  | { kind: "BEAD"; kg: DecimalString }
  | { kind: "CORD"; grams: DecimalString; kg: DecimalString };

/** Level 1: total production requirement per material (GET /api/material/requirements). */
export interface MaterialSummaryDTO {
  orderIds: number[];
  /** components the result is limited to (?components=KALI,GALISH); empty = all */
  components: string[];
  totals: { code: string; name: string; category: MaterialCategory; unit: MaterialUnit; total: DecimalString }[];
}

/** Level 2: purchase requirement per material (GET /api/purchase/requirements). */
export interface PurchaseRequirementDTO {
  orderIds: number[];
  /** components the result is limited to (?components=KALI,GALISH); empty = all */
  components: string[];
  totals: {
    code: string;
    name: string;
    category: MaterialCategory;
    unit: MaterialUnit;
    total: DecimalString;
    purchase: PurchaseDTO | null;
    error?: string;
  }[];
  errors: string[];
}

/** GET /api/reports/* — flat rows (also downloadable as CSV). */
export type ReportRowDTO = Record<string, string | number>;
