// Material Master and conversion rules. Other modules get material data through here.
// The materials are the consumption columns of the Punching Master, so adding or renaming
// one here changes those columns everywhere.
import { unitFor, type MaterialColumnDTO, type MaterialDTO, type MaterialInput } from "@pp/shared";
import type { MaterialRule } from "../../calculation/engine.js";
import { AppError } from "../../middleware/error-handler.js";
import { materialsRepository as repo, type MaterialWrite } from "./materials.repository.js";

// Keep only the rule fields that apply to the category, so a material that changed
// category doesn't carry stale numbers.
async function toWrite(input: Omit<MaterialInput, "code">): Promise<MaterialWrite> {
  const c = input.category;
  return {
    name: input.name,
    category: c,
    sortOrder: input.sortOrder ?? (await repo.maxSortOrder()) + 1,
    seqPerCd: c === "SEQUENCE" ? (input.seqPerCd ?? null) : null,
    cdPerRoll: c === "SEQUENCE" ? (input.cdPerRoll ?? null) : null,
    cdPerRound: c === "SEQUENCE" ? (input.cdPerRound ?? null) : null,
    pcsPerKg: c === "BEAD" ? (input.pcsPerKg ?? null) : null,
    denier: c === "CORD" ? (input.denier ?? null) : null,
  };
}

export const materialsService = {
  listMaster: async (): Promise<MaterialDTO[]> => repo.listAll(),

  /** Conversion rules in the shape the calculation engine takes. */
  listRules: async (): Promise<MaterialRule[]> => repo.listAll(),

  /** Column headers without conversion rules (what Punching sees). */
  async listColumns(): Promise<MaterialColumnDTO[]> {
    return (await repo.listAll()).map(({ code, name, category }) => ({ code, name, category, unit: unitFor(category) }));
  },

  /** material code -> id */
  async idsByCode(): Promise<Map<string, number>> {
    return new Map((await repo.listAll()).map((m) => [m.code, m.id]));
  },

  // New materials go to the end of the column list unless sortOrder is given.
  create: async ({ code, ...input }: MaterialInput): Promise<MaterialDTO> => repo.create(code, await toWrite(input)),

  update: async (id: number, input: Omit<MaterialInput, "code">): Promise<MaterialDTO> => repo.update(id, await toWrite(input)),

  // Refuses while Punching Master rows still use it, so no consumption data is lost silently.
  async remove(id: number) {
    const used = await repo.countUsage(id);
    if (used) {
      throw new AppError(409, `This material is used in ${used} Punching Master row(s). Set it to 0 there first, then remove it.`);
    }
    await repo.delete(id);
  },
};
