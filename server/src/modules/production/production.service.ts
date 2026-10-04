// Production orders, design search, and the per-order production calculation.
import {
  MESSAGES,
  type CreateOrderInput,
  type DesignDetailDTO,
  type DesignSummaryDTO,
  type OrderLineInput,
  type OrderStatus,
  type ProductionOrderDTO,
  type ProductionSummaryDTO,
  type UpdateOrderInput,
} from "@pp/shared";
import { calculate, type LineInput } from "../../calculation/engine.js";
import { AppError } from "../../middleware/error-handler.js";
import { materialsService } from "../materials/materials.service.js";
import { punchingService } from "../punching/punching.service.js";
import { productionRepository as repo, type OrderWrite } from "./production.repository.js";

type Order = NonNullable<Awaited<ReturnType<typeof repo.get>>>;

const toDTO = (o: Order): ProductionOrderDTO => ({
  id: o.id,
  party: o.party,
  designNo: o.designNo,
  item: o.item,
  orderDate: o.orderDate.toISOString(),
  createdAt: o.createdAt.toISOString(),
  quantity: o.quantity,
  status: o.status,
  lines: o.lines.map((l) => ({ component: l.punchingItem.component, size: l.punchingItem.size, quantity: l.quantity })),
});

// Resolve each line to the Punching Master item for the design + the line's Component + Size.
// All missing ones are reported together.
async function resolveLines(designNo: string, input: OrderLineInput[]): Promise<OrderWrite["lines"]> {
  const missing: string[] = [];
  const lines: OrderWrite["lines"] = [];
  for (const l of input) {
    const size = String(l.size);
    const item = await punchingService.findItem(designNo, l.component, size);
    if (!item) missing.push(`${designNo} ${l.component} ${size}`);
    else lines.push({ punchingItemId: item.id, quantity: l.quantity });
  }
  if (missing.length) throw new AppError(400, MESSAGES.CONSUMPTION_MISSING, { missing });
  return lines;
}

// Design numbers are matched ignoring case, spaces and dashes: "26249" finds "26-249".
const squash = (s: string) => s.toUpperCase().replace(/[\s-]/g, "");

const today = () => new Date().toISOString().slice(0, 10);

/** An order header plus its lines in the shape the calculation engine takes. */
export interface OrderForCalculation {
  id: number;
  party: string;
  designNo: string;
  item: string;
  orderDate: Date;
  quantity: number | null;
  status: OrderStatus;
  lines: LineInput[];
}

export const productionService = {
  /** Design + Component + Size combinations that have a Punching Master entry, for the order form. */
  catalog: () => punchingService.listCatalog(),

  /**
   * Designs whose number contains the search text (all if empty). Only designs that have at least
   * one component can be ordered, so designs Punching has only just created are left out.
   */
  async searchDesigns(q = ""): Promise<DesignSummaryDTO[]> {
    const [designs, counts] = await Promise.all([punchingService.listDesigns(), repo.countByDesign()]);
    const needle = squash(q);
    return designs
      .map((d) => ({
        designNo: d.designNo,
        productName: d.productName,
        entries: d.components.reduce((n, c) => n + c.sizes.length, 0),
        orders: counts.get(d.designNo) ?? 0,
      }))
      .filter((d) => d.entries > 0 && squash(d.designNo).includes(needle));
  },

  /** What Punching entered for a design, plus every order already created for it. */
  async getDesign(designNo: string): Promise<DesignDetailDTO> {
    const [design, orders] = await Promise.all([punchingService.getDesign(designNo), repo.listByDesign(designNo)]);
    if (!design) throw new AppError(404, `Design ${designNo} is not in the Punching Master.`);
    return {
      ...design,
      orders: orders.map((o) => ({
        id: o.id,
        party: o.party,
        quantity: o.quantity,
        totalPieces: o.lines.reduce((s, l) => s + l.quantity, 0),
        status: o.status,
        orderDate: o.orderDate.toISOString(),
      })),
    };
  },

  list: async () => (await repo.list()).map(toDTO),

  async get(id: number) {
    const order = await repo.get(id);
    if (!order) throw new AppError(404, "Order not found");
    return toDTO(order);
  },

  // Production enters Party + quantities; everything else comes from the design's Punching entries.
  // Without `lines`, every Component + Size of the design is ordered at `quantity` (validation
  // guarantees one of the two). With `lines`, the order has no common quantity (stored as null).
  async create(input: CreateOrderInput): Promise<ProductionOrderDTO> {
    const design = await punchingService.getDesign(input.designNo);
    if (!design) throw new AppError(400, `Design ${input.designNo} is not in the Punching Master.`);
    if (!design.items.length) throw new AppError(400, `Design ${input.designNo} has no components yet.`);
    const lineInput = input.lines ?? design.items.map((i) => ({ component: i.component, size: i.size, quantity: input.quantity! }));
    return toDTO(
      await repo.create({
        party: input.party,
        designNo: input.designNo,
        item: design.productName,
        orderDate: new Date(input.orderDate ?? today()),
        quantity: input.lines ? null : input.quantity!,
        lines: await resolveLines(input.designNo, lineInput),
      }),
    );
  },

  async update(id: number, input: UpdateOrderInput): Promise<ProductionOrderDTO> {
    const { party, designNo, item } = input;
    return toDTO(
      await repo.replace(id, {
        party,
        designNo,
        item,
        orderDate: new Date(input.orderDate),
        quantity: input.quantity ?? null,
        lines: await resolveLines(designNo, input.lines),
      }),
    );
  },

  setStatus: async (id: number, status: OrderStatus) => toDTO(await repo.setStatus(id, status)),

  /**
   * orderId given -> that order only (404 if missing); otherwise every order that is not
   * cancelled (cancelled orders don't need material). Used by reports.
   */
  async ordersForCalculation(orderId?: number): Promise<OrderForCalculation[]> {
    const orders = await repo.listWithConsumption(orderId);
    if (orderId && !orders.length) throw new AppError(404, "Order not found");
    return orders.map(({ lines, ...o }) => ({
      id: o.id,
      party: o.party,
      designNo: o.designNo,
      item: o.item,
      orderDate: o.orderDate,
      quantity: o.quantity,
      status: o.status,
      lines: lines.map((l) => ({
        component: l.punchingItem.component,
        size: l.punchingItem.size,
        quantity: l.quantity,
        consumption: Object.fromEntries(
          l.punchingItem.consumptions.map((c) => [c.material.code, c.qtyPerPiece.toString()]),
        ),
      })),
    }));
  },

  // Production calculation: requirement per Component + Size row.
  // Material totals and purchase conversion are in the reports module.
  async summary(id: number): Promise<ProductionSummaryDTO> {
    const [[order], materials] = await Promise.all([this.ordersForCalculation(id), materialsService.listRules()]);
    const result = calculate(order.lines, materials);
    const { party, designNo, item, quantity, status } = order;
    return {
      order: { party, designNo, item, orderDate: order.orderDate.toISOString(), quantity, status },
      lines: result.lines.map((l) => ({
        ...l,
        requirement: Object.fromEntries(Object.entries(l.requirement).map(([code, v]) => [code, v.toString()])),
      })),
      errors: result.errors,
    };
  },
};
