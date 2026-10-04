import type { MaterialCategory, MaterialUnit } from "../constants/materials.js";

/** Material master row with its conversion rule (GET /api/material/master). */
export interface MaterialDTO {
  id: number;
  code: string;
  name: string;
  category: MaterialCategory;
  sortOrder: number;
  seqPerCd: number | null;
  cdPerRoll: number | null;
  cdPerRound: number | null;
  pcsPerKg: number | null;
  denier: number | null;
}

/** POST / PUT /api/material/master. The code cannot be changed after creation. */
export interface MaterialInput {
  code: string;
  name: string;
  category: MaterialCategory;
  sortOrder?: number;
  seqPerCd?: number | null;
  cdPerRoll?: number | null;
  cdPerRound?: number | null;
  pcsPerKg?: number | null;
  denier?: number | null;
}

/** Material as a column header, without conversion rules (shown to Punching). */
export interface MaterialColumnDTO {
  code: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
}
