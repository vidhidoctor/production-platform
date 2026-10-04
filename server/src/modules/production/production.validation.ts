import { z } from "zod";
import { MESSAGES, ORDER_STATUSES } from "@pp/shared";
import { requiredText, upperText, positiveInt } from "../../middleware/validate.js";

// Whole number above 0; the FRD message, optionally prefixed with the row ("KALI 18: ").
const isOrderQuantity = (v: unknown) => v !== null && v !== undefined && v !== "" && Number.isInteger(Number(v)) && Number(v) > 0;

const orderQuantity = z
  .unknown()
  .refine(isOrderQuantity, MESSAGES.INVALID_QUANTITY)
  .transform((v) => Number(v));

const orderLine = z
  .object({ component: upperText("component"), size: upperText("size"), quantity: z.unknown() })
  .transform((l, ctx) => {
    if (!isOrderQuantity(l.quantity)) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: `${l.component} ${l.size}: ${MESSAGES.INVALID_QUANTITY}` });
      return z.NEVER;
    }
    return { component: l.component, size: l.size, quantity: Number(l.quantity) };
  });

const lines = z.array(orderLine, { error: "lines must have at least one row." }).min(1, "lines must have at least one row.");

const isoDate = z
  .string({ error: "orderDate is required." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "orderDate must be a valid date (YYYY-MM-DD).")
  .refine((s) => !Number.isNaN(new Date(s).getTime()), "orderDate must be a valid date (YYYY-MM-DD).");

// Design No. is upper-cased to match the Punching Master.
// POST: either one Order Quantity for every Component + Size (`quantity`), or a quantity per
// row (`lines`). One of the two is required.
export const createOrderSchema = z
  .object({
    designNo: upperText("designNo"),
    party: requiredText("party"),
    quantity: z.unknown().optional(),
    orderDate: isoDate.optional(),
    lines: lines.optional(),
  })
  .transform((o, ctx) => {
    if (o.quantity === undefined || o.quantity === null || o.quantity === "") {
      if (!o.lines) ctx.addIssue({ code: "custom", path: ["quantity"], message: MESSAGES.INVALID_QUANTITY });
      return { ...o, quantity: undefined };
    }
    const q = orderQuantity.safeParse(o.quantity);
    if (!q.success) {
      ctx.addIssue({ code: "custom", path: ["quantity"], message: MESSAGES.INVALID_QUANTITY });
      return z.NEVER;
    }
    return { ...o, quantity: q.data };
  });

// PUT: full replace of an existing order.
export const updateOrderSchema = z.object({
  party: requiredText("party"),
  designNo: upperText("designNo"),
  item: requiredText("item"),
  orderDate: isoDate,
  quantity: positiveInt("quantity").nullable().optional(),
  lines,
});

export const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: `status must be one of ${ORDER_STATUSES.join(", ")}.` }),
});

export const designParams = z.object({ designNo: upperText("designNo") });

export const designSearchQuery = z.object({ q: z.string().trim().default("") });
