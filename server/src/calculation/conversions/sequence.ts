// SEQUENCE: PCS -> CD -> Roll
import type { Decimal } from "decimal.js";
import { MESSAGES } from "@pp/shared";
import type { MaterialRule, Purchase } from "../types.js";

export function convertSequence(m: MaterialRule, total: Decimal): Purchase {
  if (!m.seqPerCd || !m.cdPerRoll) throw new Error(MESSAGES.CONVERSION_RULE_MISSING);
  const cds = total.div(m.seqPerCd);
  return { kind: "SEQUENCE", cds, rolls: cds.div(m.cdPerRoll) };
}
