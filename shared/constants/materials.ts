export const MATERIAL_CATEGORIES = ["SEQUENCE", "BEAD", "CORD"] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** Cord: MTR × denier ÷ 9000 = grams */
export const CORD_DIVISOR = 9000;

export type MaterialUnit = "PCS" | "MTR";
export const unitFor = (category: MaterialCategory): MaterialUnit => (category === "CORD" ? "MTR" : "PCS");
