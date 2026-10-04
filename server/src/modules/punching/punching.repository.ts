// All Prisma queries for designs and the Punching Master (Component + Size consumption).
import { prisma } from "../../database/prisma.js";

const withConsumption = { consumptions: { include: { material: true } } } as const;
const masterOrder = [{ designNo: "asc" }, { component: "asc" }, { id: "asc" }] as const;

export interface ConsumptionRow {
  materialId: number;
  qtyPerPiece: string;
}

export interface PunchingItemWrite {
  designNo?: string;
  component?: string;
  size?: string;
  stitch?: number | null;
  laser?: number | null;
}

/** One size of a component, ready to write. */
export interface ComponentRowWrite {
  size: string;
  stitch: number;
  laser: number | null;
  consumption: ConsumptionRow[];
}

export const punchingRepository = {
  // --- designs ---

  listDesigns: () =>
    prisma.design.findMany({
      include: { items: { select: { component: true, size: true }, orderBy: [{ component: "asc" }, { id: "asc" }] } },
      orderBy: { designNo: "asc" },
    }),

  findDesign: (designNo: string) =>
    prisma.design.findUnique({
      where: { designNo },
      include: { items: { include: withConsumption, orderBy: [{ component: "asc" }, { id: "asc" }] } },
    }),

  createDesign: (designNo: string, productName: string) => prisma.design.create({ data: { designNo, productName } }),

  updateDesign: (designNo: string, productName: string) =>
    prisma.design.update({ where: { designNo }, data: { productName } }),

  // --- component rows ---

  list: () => prisma.punchingItem.findMany({ include: withConsumption, orderBy: [...masterOrder] }),

  listComponentRows: (designNo: string, component: string) =>
    prisma.punchingItem.findMany({ where: { designNo, component }, select: { id: true, size: true } }),

  /** How many production order lines use these rows. */
  countOrderLines: (itemIds: number[]) => prisma.orderLine.count({ where: { punchingItemId: { in: itemIds } } }),

  listCatalog: () =>
    prisma.punchingItem.findMany({
      select: { designNo: true, component: true, size: true, design: { select: { productName: true } } },
      orderBy: [...masterOrder],
    }),

  findByKey: (designNo: string, component: string, size: string) =>
    prisma.punchingItem.findUnique({ where: { designNo_component_size: { designNo, component, size } } }),

  create: (data: PunchingItemWrite & { designNo: string; component: string; size: string }, consumption: ConsumptionRow[]) =>
    prisma.punchingItem.create({
      data: { ...data, consumptions: { create: consumption } },
      include: withConsumption,
    }),

  // consumption given -> replaces the whole list; undefined -> left as is.
  update: (id: number, data: PunchingItemWrite, consumption?: ConsumptionRow[]) =>
    prisma.punchingItem.update({
      where: { id },
      data: { ...data, ...(consumption ? { consumptions: { deleteMany: {}, create: consumption } } : {}) },
      include: withConsumption,
    }),

  /** Writes every size of a component (insert or update by size) and deletes `removeIds`, in one transaction. */
  saveComponent: (designNo: string, component: string, rows: ComponentRowWrite[], removeIds: number[]) =>
    prisma.$transaction(async (tx) => {
      if (removeIds.length) await tx.punchingItem.deleteMany({ where: { id: { in: removeIds } } });
      for (const { consumption, ...row } of rows) {
        await tx.punchingItem.upsert({
          where: { designNo_component_size: { designNo, component, size: row.size } },
          create: { designNo, component, ...row, consumptions: { create: consumption } },
          update: { stitch: row.stitch, laser: row.laser, consumptions: { deleteMany: {}, create: consumption } },
        });
      }
    }),

  deleteRows: (itemIds: number[]) => prisma.punchingItem.deleteMany({ where: { id: { in: itemIds } } }),
};
