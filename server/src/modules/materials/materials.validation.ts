import { z } from "zod";
import { MATERIAL_CATEGORIES } from "@pp/shared";
import { requiredText, nonNegativeInt, positiveInt } from "../../middleware/validate.js";

const rule = (field: string) => positiveInt(field).nullable().optional();

// The conversion rule fields each category needs (the engine divides by them).
const REQUIRED_RULES = {
  SEQUENCE: ["seqPerCd", "cdPerRoll"],
  BEAD: ["pcsPerKg"],
  CORD: ["denier"],
} as const;

const materialFields = z.object({
  name: requiredText("name"),
  category: z.enum(MATERIAL_CATEGORIES, { error: `category must be one of ${MATERIAL_CATEGORIES.join(", ")}.` }),
  sortOrder: nonNegativeInt("sortOrder").optional(),
  seqPerCd: rule("seqPerCd"),
  cdPerRoll: rule("cdPerRoll"),
  cdPerRound: rule("cdPerRound"),
  pcsPerKg: rule("pcsPerKg"),
  denier: rule("denier"),
});

const withRulesForCategory = <T extends z.infer<typeof materialFields>>(m: T, ctx: z.RefinementCtx) => {
  for (const field of REQUIRED_RULES[m.category]) {
    if (!m[field]) ctx.addIssue({ code: "custom", path: [field], message: `${field} is required for ${m.category} materials.` });
  }
};

export const createMaterialSchema = materialFields
  .extend({
    code: requiredText("code")
      .transform((v) => v.toUpperCase())
      .refine((v) => /^[A-Z0-9][A-Z0-9.-]*$/.test(v), "code may only use letters, digits, '.' and '-' (e.g. SEQ-5MM)."),
  })
  .superRefine(withRulesForCategory);

// Full replace of everything except the code (the code identifies the column in reports and CSVs).
export const updateMaterialSchema = materialFields.superRefine(withRulesForCategory);
