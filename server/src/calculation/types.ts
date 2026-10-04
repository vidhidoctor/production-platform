import type { Decimal } from "decimal.js";
import type { MaterialCategory, MaterialUnit } from "@pp/shared";

export interface MaterialRule {
  code: string;
  name: string;
  category: MaterialCategory;
  seqPerCd?: number | null;
  cdPerRoll?: number | null;
  pcsPerKg?: number | null;
  denier?: number | null;
}

export interface LineInput {
  component: string;
  size: string;
  quantity: number;
  // material code -> qty per piece (missing = 0)
  consumption: Record<string, Decimal.Value>;
}

export interface LineResult {
  component: string;
  size: string;
  quantity: number;
  requirement: Record<string, Decimal>;
}

export type Purchase =
  | { kind: "SEQUENCE"; cds: Decimal; rolls: Decimal }
  | { kind: "BEAD"; kg: Decimal }
  | { kind: "CORD"; grams: Decimal; kg: Decimal };

export interface MaterialTotal {
  code: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  total: Decimal; // Level 1: production requirement
  purchase: Purchase | null; // Level 2: purchase requirement
  error?: string;
}

export interface CalcResult {
  lines: LineResult[];
  totals: MaterialTotal[];
  errors: string[];
}
