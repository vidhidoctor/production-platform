import { useMemo, useState, type FormEvent } from "react";
import type { CatalogItemDTO, ProductionOrderDTO, UpdateOrderInput } from "@pp/shared";
import { ErrorAlert, Field, NumberInput } from "../../../components/ui";
import { OrderLinesGrid, newLine, type LineDraft } from "./OrderLinesGrid";

/** Edits an existing order (new orders are created from the design page). */
interface Props {
  initial: ProductionOrderDTO;
  catalog: CatalogItemDTO[];
  saving: boolean;
  error: unknown;
  onSubmit: (values: UpdateOrderInput) => void;
  onCancel: () => void;
}

export function OrderForm({ initial, catalog, saving, error, onSubmit, onCancel }: Props) {
  const [header, setHeader] = useState({
    party: initial.party,
    designNo: initial.designNo,
    item: initial.item,
    orderDate: initial.orderDate.slice(0, 10),
  });
  const [quantity, setQuantity] = useState(initial.quantity === null ? "" : String(initial.quantity));
  const [lines, setLines] = useState<LineDraft[]>(() => initial.lines.map((l) => newLine(l.component, l.size, String(l.quantity))));
  const set = (k: keyof typeof header) => (e: React.ChangeEvent<HTMLInputElement>) => setHeader({ ...header, [k]: e.target.value });

  // Designs that have Punching Master entries (plus the order's own, if it has none any more).
  const designs = useMemo(() => {
    const byDesign = new Map(catalog.map((c) => [c.designNo, c.productName]));
    if (!byDesign.has(initial.designNo)) byDesign.set(initial.designNo, initial.item);
    return [...byDesign].map(([designNo, productName]) => ({ designNo, productName }));
  }, [catalog, initial]);
  const designCatalog = catalog.filter((c) => c.designNo === header.designNo);

  // A new design fills in the product as the Item, and drops lines that design doesn't have.
  function changeDesign(designNo: string) {
    const product = designs.find((d) => d.designNo === designNo)?.productName ?? "";
    const oldProduct = designs.find((d) => d.designNo === header.designNo)?.productName ?? "";
    setHeader({ ...header, designNo, item: !header.item || header.item === oldProduct ? product : header.item });
    const valid = new Set(catalog.filter((c) => c.designNo === designNo).map((c) => `${c.component}|${c.size}`));
    const kept = lines.filter((l) => valid.has(`${l.component}|${l.size}`));
    setLines(kept.length ? kept : [newLine()]);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      ...header,
      quantity: quantity === "" ? null : Number(quantity),
      lines: lines.map((l) => ({ component: l.component, size: l.size, quantity: Number(l.quantity) })),
    });
  }

  return (
    <form className="stack" onSubmit={submit}>
      <ErrorAlert error={error} />
      <div className="card">
        <div className="card-header">
          <h2>Order details</h2>
        </div>
        <div className="card-body form-grid">
          <Field label="Design No." hint={designs.length ? undefined : "No designs in the Punching Master yet."}>
            <select className="input" required autoFocus value={header.designNo} onChange={(e) => changeDesign(e.target.value)}>
              <option value="">Choose…</option>
              {designs.map((d) => (
                <option key={d.designNo} value={d.designNo}>
                  {d.designNo} — {d.productName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Item">
            <input className="input" required value={header.item} onChange={set("item")} />
          </Field>
          <Field label="Party">
            <input className="input" required value={header.party} onChange={set("party")} />
          </Field>
          <Field label="Order date">
            <input className="input" type="date" required value={header.orderDate} onChange={set("orderDate")} />
          </Field>
          <Field label="Order Quantity" hint="As entered for the design; rows below can differ.">
            <NumberInput integer min={1} value={quantity} onChange={setQuantity} />
          </Field>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h2>Lines</h2>
          <span className="muted">
            {header.designNo ? `Components and sizes of design ${header.designNo} in the Punching Master.` : "Choose a design first."}
          </span>
        </div>
        <div className="card-body">
          <OrderLinesGrid lines={lines} onChange={setLines} catalog={designCatalog} />
        </div>
      </div>
      <div className="row">
        <span className="spacer" />
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
