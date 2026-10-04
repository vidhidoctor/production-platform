// Runs Zod schemas on req.body / req.params / req.query and replaces them with the parsed values.
// Also exports the schema building blocks the module *.validation.ts files share.
import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { AppError } from "./error-handler.js";

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const first = result.error.issues[0];
        const details = result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
        return next(new AppError(400, first.message, details));
      }
      // req.query is a getter in Express 5; defineProperty works in both 4 and 5.
      Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true, enumerable: true });
    }
    next();
  };

// --- Schema building blocks ---

export const MIN_PASSWORD = 8;

/** Non-empty trimmed text; numbers are accepted and turned into text. */
export const requiredText = (field: string) =>
  z
    .union([z.string(), z.number()], { error: `${field} is required.` })
    .transform((v) => String(v).trim())
    .refine((v) => v.length > 0, `${field} is required.`);

/** Required text stored upper-case — for keys that must match exactly (design, component, size). */
export const upperText = (field: string) => requiredText(field).transform((v) => v.toUpperCase());

export const email = z
  .string({ error: "email is required." })
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email is not valid.");

export const password = z
  .string({ error: "password is required." })
  .min(MIN_PASSWORD, `password must be at least ${MIN_PASSWORD} characters.`);

export const positiveId = (field = "id") =>
  z.coerce.number({ error: `Invalid ${field}.` }).int(`Invalid ${field}.`).positive(`Invalid ${field}.`);

export const idParams = z.object({ id: positiveId() });

/** Whole number, 0 or more. */
export const nonNegativeInt = (field: string) =>
  z
    .number({ error: `${field} is required and must be a whole number.` })
    .int(`${field} must be a whole number.`)
    .min(0, `${field} cannot be negative.`);

/** Optional whole number, 0 or more; null clears the value. */
export const optionalNonNegativeInt = (field: string) => nonNegativeInt(field).nullable().optional();

/** Whole number above 0 (conversion rules: a 0 would divide by zero). */
export const positiveInt = (field: string) =>
  z
    .number({ error: `${field} must be a whole number.` })
    .int(`${field} must be a whole number.`)
    .positive(`${field} must be greater than 0.`);
