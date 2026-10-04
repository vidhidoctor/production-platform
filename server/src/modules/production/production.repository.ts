// All Prisma queries for production orders and their lines.
import type { OrderStatus } from "@pp/shared";
import { prisma } from "../../database/prisma.js";

const withLines = {
  lines: { include: { punchingItem: { select: { component: true, size: true } } }, orderBy: { id: "asc" } },
} as const;

// Lines with each item's per-piece consumption, for the calculation engine.
const withConsumption = {
  lines: {
    include: { punchingItem: { include: { consumptions: { include: { material: { select: { code: true } } } } } } },
    orderBy: { id: "asc" },
  },
} as const;

export interface OrderWrite {
  party: string;
  designNo: string;
  item: string;
  orderDate: Date;
  quantity: number | null;
  lines: { punchingItemId: number; quantity: number }[];
}

export const productionRepository = {
  list: () => prisma.productionOrder.findMany({ include: withLines, orderBy: { createdAt: "desc" } }),

  get: (id: number) => prisma.productionOrder.findUnique({ where: { id }, include: withLines }),

  /** Orders for one design, newest first, with line quantities (for the order history). */
  listByDesign: (designNo: string) =>
    prisma.productionOrder.findMany({
      where: { designNo },
      include: { lines: { select: { quantity: true } } },
      orderBy: [{ orderDate: "desc" }, { id: "desc" }],
    }),

  /** designNo -> number of orders */
  countByDesign: async () =>
    new Map(
      (await prisma.productionOrder.groupBy({ by: ["designNo"], _count: { _all: true } })).map((r) => [r.designNo, r._count._all]),
    ),

  create: ({ lines, ...data }: OrderWrite) =>
    prisma.productionOrder.create({ data: { ...data, lines: { create: lines } }, include: withLines }),

  // Full replace of header and lines (status is changed separately).
  replace: (id: number, { lines, ...data }: OrderWrite) =>
    prisma.productionOrder.update({
      where: { id },
      data: { ...data, lines: { deleteMany: {}, create: lines } },
      include: withLines,
    }),

  setStatus: (id: number, status: OrderStatus) =>
    prisma.productionOrder.update({ where: { id }, data: { status }, include: withLines }),

  // One order by id (any status), or every order that is not cancelled.
  listWithConsumption: (orderId?: number) =>
    prisma.productionOrder.findMany({
      where: orderId ? { id: orderId } : { status: { not: "CANCELLED" } },
      include: withConsumption,
      orderBy: { id: "asc" },
    }),
};
