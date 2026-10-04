// Calculation engine — pure functions, no database, no Express, nothing from modules/.
// Input: order lines (with their per-piece consumption) + material rules.
// Output: per-row requirement, totals, and purchase conversion.

import { Decimal } from "decimal.js";
import { MESSAGES, unitFor } from "@pp/shared";
import { convert } from "./conversions/index.js";
import type { CalcResult, LineInput, LineResult, MaterialRule, MaterialTotal } from "./types.js";

export * from "./types.js";
export { convert } from "./conversions/index.js";

export function calculate(lines: LineInput[], materials: MaterialRule[]): CalcResult {
  const errors: string[] = [];

  // Step 1–3: requirement per row = consumption × quantity
  const lineResults: LineResult[] = lines.map((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      errors.push(`${line.component} ${line.size}: ${MESSAGES.INVALID_QUANTITY}`);
    }
    const requirement: Record<string, Decimal> = {};
    for (const m of materials) {
      const perPiece = new Decimal(line.consumption[m.code] ?? 0);
      requirement[m.code] = perPiece.times(line.quantity);
    }
    return { component: line.component, size: line.size, quantity: line.quantity, requirement };
  });

  // Step 4–5: combine all rows per material
  const totals: MaterialTotal[] = materials.map((m) => {
    const total = lineResults.reduce((sum, l) => sum.plus(l.requirement[m.code]), new Decimal(0));
    const t: MaterialTotal = { code: m.code, name: m.name, category: m.category, unit: unitFor(m.category), total, purchase: null };
    // Step 6+: convert to purchase unit
    try {
      t.purchase = convert(m, total);
    } catch (e) {
      t.error = (e as Error).message;
      errors.push(`${m.name}: ${t.error}`);
    }
    return t;
  });

  return { lines: lineResults, totals, errors };
}
