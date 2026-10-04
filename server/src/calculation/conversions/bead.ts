// BEAD (bead, moti, pipe, zardoshi): PCS -> KG
import type { Decimal } from "decimal.js";
import { MESSAGES } from "@pp/shared";
import type { MaterialRule, Purchase } from "../types.js";

export function convertBead(m: MaterialRule, total: Decimal): Purchase {
  if (!m.pcsPerKg) throw new Error(MESSAGES.CONVERSION_RULE_MISSING);
  return { kind: "BEAD", kg: total.div(m.pcsPerKg) };
}
