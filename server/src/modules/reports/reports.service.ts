// Material requirement (Level 1), purchase requirement (Level 2) and reports.
// No repository: order data comes from productionService, rules from materialsService.
import { ORDER_STATUS_LABELS, type MaterialSummaryDTO, type PurchaseDTO, type PurchaseRequirementDTO } from "@pp/shared";
import { calculate, type Purchase } from "../../calculation/engine.js";
import { materialsService } from "../materials/materials.service.js";
import { productionService } from "../production/production.service.js";

export type ReportRow = Record<string, string | number>;

const toPurchaseDTO = (p: Purchase): PurchaseDTO => {
  switch (p.kind) {
    case "SEQUENCE":
      return { kind: p.kind, cds: p.cds.toString(), rolls: p.rolls.toString() };
    case "BEAD":
      return { kind: p.kind, kg: p.kg.toString() };
    case "CORD":
      return { kind: p.kind, grams: p.grams.toString(), kg: p.kg.toString() };
  }
};

// orderId given -> that order only; otherwise all orders that are not cancelled, combined.
// components given -> only lines of those components.
async function calculateOrders(orderId?: number, components: string[] = []) {
  const [orders, materials] = await Promise.all([
    productionService.ordersForCalculation(orderId),
    materialsService.listRules(),
  ]);
  const lines = orders.flatMap((o) => o.lines).filter((l) => !components.length || components.includes(l.component));
  return { orders, materials, result: calculate(lines, materials) };
}

export const reportsService = {
  async materialRequirements(orderId?: number, components: string[] = []): Promise<MaterialSummaryDTO> {
    const { orders, result } = await calculateOrders(orderId, components);
    return {
      orderIds: orders.map((o) => o.id),
      components,
      totals: result.totals.map(({ code, name, category, unit, total }) => ({ code, name, category, unit, total: total.toString() })),
    };
  },

  async purchaseRequirements(orderId?: number, components: string[] = []): Promise<PurchaseRequirementDTO> {
    const { orders, result } = await calculateOrders(orderId, components);
    return {
      orderIds: orders.map((o) => o.id),
      components,
      totals: result.totals.map((t) => ({
        ...t,
        total: t.total.toString(),
        purchase: t.purchase && toPurchaseDTO(t.purchase),
      })),
      errors: result.errors,
    };
  },

  // One row per production order, including cancelled ones (with their status).
  async productionReport(): Promise<ReportRow[]> {
    const orders = await productionService.list();
    return orders.map((o) => ({
      orderId: o.id,
      designNo: o.designNo,
      item: o.item,
      party: o.party,
      orderDate: o.orderDate.slice(0, 10),
      orderQuantity: o.quantity ?? "",
      lines: o.lines.length,
      totalPieces: o.lines.reduce((s, l) => s + l.quantity, 0),
      status: ORDER_STATUS_LABELS[o.status],
    }));
  },

  // One row per order, one column per material (PCS / cord MTR).
  async materialReport(): Promise<ReportRow[]> {
    const { orders, materials } = await calculateOrders();
    return orders.map((o) => ({
      orderId: o.id,
      designNo: o.designNo,
      party: o.party,
      ...Object.fromEntries(calculate(o.lines, materials).totals.map((t) => [t.code, t.total.toNumber()])),
    }));
  },

  // All orders combined: one row per material with its purchase unit.
  async purchaseReport(): Promise<ReportRow[]> {
    const { result } = await calculateOrders();
    return result.totals.map((t) => {
      const p = t.purchase;
      return {
        code: t.code,
        name: t.name,
        requirement: t.total.toNumber(),
        unit: t.unit,
        cds: p?.kind === "SEQUENCE" ? p.cds.toDecimalPlaces(2).toNumber() : "",
        rolls: p?.kind === "SEQUENCE" ? p.rolls.toDecimalPlaces(2).toNumber() : "",
        kg: p && p.kind !== "SEQUENCE" ? p.kg.toDecimalPlaces(2).toNumber() : "",
        error: t.error ?? "",
      };
    });
  },
};
