// Picks the purchase-unit converter for a material's category.
import type { Decimal } from "decimal.js";
import type { MaterialRule, Purchase } from "../types.js";
import { convertSequence } from "./sequence.js";
import { convertBead } from "./bead.js";
import { convertCord } from "./cord.js";

export function convert(m: MaterialRule, total: Decimal): Purchase {
  switch (m.category) {
    case "SEQUENCE":
      return convertSequence(m, total);
    case "BEAD":
      return convertBead(m, total);
    case "CORD":
      return convertCord(m, total);
  }
}
