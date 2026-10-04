import type { OrderStatus } from "../constants/orders.js";
import type { MaterialColumnDTO } from "./material.types.js";
import type { DecimalString, PunchingItemDTO } from "./punching.types.js";

/** An order line; the Design comes from the order header. */
export interface OrderLineInput {
  component: string;
  size: string | number;
  quantity: number;
}

/**
 * POST /api/production/orders — Production enters Party + quantities for a design. Two ways:
 * - same quantity for every Component + Size: send `quantity` only;
 * - a different quantity per row: send `lines` (rows left out are not ordered); `quantity` is then
 *   not needed and the order is stored with quantity null ("per row").
 * Item comes from the design's product name; orderDate defaults to today.
 */
export interface CreateOrderInput {
  designNo: string;
  party: string;
  quantity?: number;
  orderDate?: string;
  lines?: OrderLineInput[];
}

/** PUT /api/production/orders/:id — full replace of an existing order. */
export interface UpdateOrderInput {
  party: string;
  /** Must have Punching Master entries; order lines are looked up as Design + Component + Size. */
  designNo: string;
  item: string;
  /** YYYY-MM-DD */
  orderDate: string;
  quantity?: number | null;
  lines: OrderLineInput[];
}

export interface ProductionOrderDTO {
  id: number;
  party: string;
  designNo: string;
  item: string;
  orderDate: string;
  createdAt: string;
  /** The Order Quantity entered; null on orders made before it was recorded. */
  quantity: number | null;
  status: OrderStatus;
  lines: { component: string; size: string; quantity: number }[];
}

export interface LineRequirementDTO {
  component: string;
  size: string;
  quantity: number;
  /** material code -> requirement for this row */
  requirement: Record<string, DecimalString>;
}

export interface ProductionSummaryDTO {
  order: { party: string; designNo: string; item: string; orderDate: string; quantity: number | null; status: OrderStatus };
  lines: LineRequirementDTO[];
  errors: string[];
}

/** GET /api/production/catalog — Design + Component + Size combinations that can be ordered. */
export interface CatalogItemDTO {
  designNo: string;
  productName: string;
  component: string;
  size: string;
}

/** GET /api/production/designs?q= — one row per design in the Punching Master. */
export interface DesignSummaryDTO {
  designNo: string;
  productName: string;
  /** Component + Size rows in the Punching Master */
  entries: number;
  /** production orders created for this design */
  orders: number;
}

/** A previous order, as listed on the design page. */
export interface DesignOrderDTO {
  id: number;
  party: string;
  quantity: number | null;
  totalPieces: number;
  status: OrderStatus;
  orderDate: string;
}

/** GET /api/production/designs/:designNo — what Punching entered, plus the order history. */
export interface DesignDetailDTO {
  designNo: string;
  productName: string;
  materials: MaterialColumnDTO[];
  items: PunchingItemDTO[];
  orders: DesignOrderDTO[];
}
