import { z } from "zod";
import { Decimal } from "decimal.js";
import { requiredText, upperText, nonNegativeInt, optionalNonNegativeInt } from "../../middleware/validate.js";

const isNonNegativeDecimal = (v: string | number) => {
  try {
    const d = new Decimal(v);
    return d.isFinite() && !d.isNeg();
  } catch {
    return false;
  }
};

// { materialCode: qtyPerPiece }
const consumption = z
  .record(z.string(), z.union([z.number(), z.string()]), {
    error: "consumption must be an object of { materialCode: qtyPerPiece }.",
  })
  .superRefine((values, ctx) => {
    for (const [code, qty] of Object.entries(values)) {
      if (!isNonNegativeDecimal(qty)) {
        ctx.addIssue({ code: "custom", path: [code], message: `${code}: quantity cannot be negative.` });
      }
    }
  });

// Design, component and size are matched against order lines, so they are stored upper-case
// ("kali" and "KALI" are the same component). Stitch is required, Laser optional; neither can be negative.

// --- designs ---

export const createDesignSchema = z.object({ designNo: upperText("designNo"), productName: requiredText("productName") });

export const updateDesignSchema = z.object({ productName: requiredText("productName") });

export const designParams = z.object({ designNo: upperText("designNo") });

export const componentParams = z.object({ designNo: upperText("designNo"), component: upperText("component") });

// All sizes of one component. Sizes must be unique within the component.
export const componentSchema = z.object({
  rows: z
    .array(
      z.object({
        size: upperText("size"),
        stitch: nonNegativeInt("stitch"),
        laser: optionalNonNegativeInt("laser"),
        consumption: consumption.optional(),
      }),
      { error: "rows must be a list of sizes." },
    )
    .min(1, "Add at least one size.")
    .superRefine((rows, ctx) => {
      const seen = new Set<string>();
      for (const r of rows) {
        if (seen.has(r.size)) ctx.addIssue({ code: "custom", message: `Size ${r.size} is entered twice.` });
        seen.add(r.size);
      }
    }),
});

// --- single rows ---

export const createPunchingSchema = z.object({
  designNo: upperText("designNo"),
  component: upperText("component"),
  size: upperText("size"),
  stitch: nonNegativeInt("stitch"),
  laser: optionalNonNegativeInt("laser"),
  consumption: consumption.optional(),
});

// Fields left out are unchanged; a sent `consumption` replaces the whole list.
export const updatePunchingSchema = createPunchingSchema.partial();
