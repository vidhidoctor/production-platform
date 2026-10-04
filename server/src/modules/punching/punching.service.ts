// Designs and their components: per-piece material consumption for each Component + Size.
import { Decimal } from "decimal.js";
import type {
  CatalogItemDTO,
  ComponentRowInput,
  PunchingDesignDTO,
  PunchingDesignSummaryDTO,
  PunchingItemDTO,
  PunchingItemInput,
  PunchingMasterDTO,
} from "@pp/shared";
import { AppError } from "../../middleware/error-handler.js";
import { materialsService } from "../materials/materials.service.js";
import { punchingRepository as repo, type ConsumptionRow } from "./punching.repository.js";

type Item = Awaited<ReturnType<typeof repo.list>>[number];

const toDTO = (p: Item): PunchingItemDTO => ({
  id: p.id,
  designNo: p.designNo,
  component: p.component,
  size: p.size,
  stitch: p.stitch,
  laser: p.laser,
  consumption: Object.fromEntries(p.consumptions.map((c) => [c.material.code, c.qtyPerPiece.toString()])),
});

// { "SEQ-3MM": 975, "CORD": 30 } -> rows by material id (zeros dropped; unknown codes rejected)
async function toRows(consumption: Record<string, string | number>, ids?: Map<string, number>): Promise<ConsumptionRow[]> {
  ids ??= await materialsService.idsByCode();
  const unknown = Object.keys(consumption).filter((code) => !ids.has(code));
  if (unknown.length) throw new AppError(400, "Unknown material codes.", { unknown });
  return Object.entries(consumption)
    .filter(([, qty]) => !new Decimal(qty).isZero())
    .map(([code, qty]) => ({ materialId: ids.get(code)!, qtyPerPiece: new Decimal(qty).toString() }));
}

async function requireDesign(designNo: string) {
  const design = await repo.findDesign(designNo);
  if (!design) throw new AppError(404, `Design ${designNo} does not exist. Create the design first.`);
  return design;
}

// Refuses to delete rows that production orders already use (the order would lose its consumption).
async function assertUnused(itemIds: number[], what: string) {
  const used = itemIds.length ? await repo.countOrderLines(itemIds) : 0;
  if (used) throw new AppError(409, `${what} is used by ${used} production order line(s), so it cannot be removed.`);
}

export const punchingService = {
  // --- designs (the parent record) ---

  async listDesigns(): Promise<PunchingDesignSummaryDTO[]> {
    return (await repo.listDesigns()).map((d) => {
      const components = new Map<string, string[]>();
      for (const i of d.items) components.set(i.component, [...(components.get(i.component) ?? []), i.size]);
      return {
        designNo: d.designNo,
        productName: d.productName,
        createdAt: d.createdAt.toISOString(),
        components: [...components].map(([component, sizes]) => ({ component, sizes })),
      };
    });
  },

  /** The design with all its component rows and the material columns. null if it doesn't exist. */
  async getDesign(designNo: string): Promise<PunchingDesignDTO | null> {
    const [materials, design] = await Promise.all([materialsService.listColumns(), repo.findDesign(designNo)]);
    if (!design) return null;
    return { designNo: design.designNo, productName: design.productName, materials, items: design.items.map(toDTO) };
  },

  async getDesignOrFail(designNo: string): Promise<PunchingDesignDTO> {
    const design = await this.getDesign(designNo);
    if (!design) throw new AppError(404, `Design ${designNo} does not exist.`);
    return design;
  },

  async createDesign(designNo: string, productName: string): Promise<PunchingDesignDTO> {
    if (await repo.findDesign(designNo)) throw new AppError(409, `Design ${designNo} already exists.`);
    await repo.createDesign(designNo, productName);
    return (await this.getDesign(designNo))!;
  },

  async updateDesign(designNo: string, productName: string): Promise<PunchingDesignDTO> {
    await requireDesign(designNo);
    await repo.updateDesign(designNo, productName);
    return (await this.getDesign(designNo))!;
  },

  // --- components of a design ---

  /** Adds a component to the design, or replaces its sizes. Sizes left out are removed. */
  async saveComponent(designNo: string, component: string, rows: ComponentRowInput[]): Promise<PunchingDesignDTO> {
    await requireDesign(designNo);
    const existing = await repo.listComponentRows(designNo, component);
    const keep = new Set(rows.map((r) => r.size));
    const removed = existing.filter((e) => !keep.has(e.size));
    await assertUnused(removed.map((r) => r.id), `${component} size ${removed.map((r) => r.size).join(", ")}`);

    const ids = await materialsService.idsByCode();
    const writes = [];
    for (const r of rows) {
      writes.push({ size: r.size, stitch: r.stitch, laser: r.laser ?? null, consumption: await toRows(r.consumption ?? {}, ids) });
    }
    await repo.saveComponent(designNo, component, writes, removed.map((r) => r.id));
    return (await this.getDesign(designNo))!;
  },

  async deleteComponent(designNo: string, component: string): Promise<PunchingDesignDTO> {
    await requireDesign(designNo);
    const rows = await repo.listComponentRows(designNo, component);
    if (!rows.length) throw new AppError(404, `Design ${designNo} has no component ${component}.`);
    await assertUnused(rows.map((r) => r.id), component);
    await repo.deleteRows(rows.map((r) => r.id));
    return (await this.getDesign(designNo))!;
  },

  // --- single rows (flat Punching Master) ---

  // Material columns come from the Material Master, so materials Admin adds or renames
  // appear here automatically. Conversion rules are not included (Punching can't see them).
  async getMaster(): Promise<PunchingMasterDTO> {
    const [materials, items] = await Promise.all([materialsService.listColumns(), repo.list()]);
    return { materials, items: items.map(toDTO) };
  },

  async create({ consumption, ...data }: PunchingItemInput): Promise<PunchingItemDTO> {
    await requireDesign(data.designNo);
    return toDTO(await repo.create(data, await toRows(consumption ?? {})));
  },

  async update(id: number, { consumption, ...data }: Partial<PunchingItemInput>): Promise<PunchingItemDTO> {
    if (data.designNo) await requireDesign(data.designNo);
    return toDTO(await repo.update(id, data, consumption ? await toRows(consumption) : undefined));
  },

  /** Design + Component + Size only (no consumption) — what Production picks from when editing an order. */
  async listCatalog(): Promise<CatalogItemDTO[]> {
    return (await repo.listCatalog()).map(({ design, ...c }) => ({ ...c, productName: design.productName }));
  },

  /** Used by production to resolve an order line. */
  findItem: (designNo: string, component: string, size: string) => repo.findByKey(designNo, component, size),
};
