// CORD: MTR × denier ÷ 9000 = grams, ÷ 1000 = KG
import type { Decimal } from "decimal.js";
import { MESSAGES, CORD_DIVISOR } from "@pp/shared";
import type { MaterialRule, Purchase } from "../types.js";

export function convertCord(m: MaterialRule, total: Decimal): Purchase {
  if (!m.denier) throw new Error(MESSAGES.CORD_DENIER_MISSING);
  const grams = total.times(m.denier).div(CORD_DIVISOR);
  return { kind: "CORD", grams, kg: grams.div(1000) };
}
