// All Prisma queries for the Material Master.
import type { MaterialCategory } from "@pp/shared";
import { prisma } from "../../database/prisma.js";

export interface MaterialWrite {
  name: string;
  category: MaterialCategory;
  sortOrder: number;
  seqPerCd: number | null;
  cdPerRoll: number | null;
  cdPerRound: number | null;
  pcsPerKg: number | null;
  denier: number | null;
}

export const materialsRepository = {
  listAll: () => prisma.material.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),

  maxSortOrder: async () => (await prisma.material.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1,

  create: (code: string, data: MaterialWrite) => prisma.material.create({ data: { code, ...data } }),

  update: (id: number, data: MaterialWrite) => prisma.material.update({ where: { id }, data }),

  /** Punching Master rows that use this material. */
  countUsage: (id: number) => prisma.consumption.count({ where: { materialId: id } }),

  delete: (id: number) => prisma.material.delete({ where: { id } }),
};
