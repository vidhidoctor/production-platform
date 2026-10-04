import { z } from "zod";
import { positiveId } from "../../middleware/validate.js";

// ?orderId=N limits to one order; without it, all orders that are not cancelled are combined.
// ?components=KALI,GALISH limits to those components (case-insensitive); omitted = all.
export const requirementsQuery = z.object({
  orderId: positiveId("orderId").optional(),
  components: z
    .string()
    .optional()
    .transform((s) => [...new Set((s ?? "").split(",").map((c) => c.trim().toUpperCase()).filter(Boolean))]),
});

// ?format=csv downloads the report instead of returning JSON.
export const reportQuery = z.object({ format: z.enum(["json", "csv"]).default("json") });
