import { useState } from "react";
import { useNavigate } from "react-router";
import type { DesignDetailDTO } from "@pp/shared";
import { formatNumber, today } from "../../../lib/format";
import { Modal } from "../../../components/Modal";
import { ErrorAlert, Field, NumberInput } from "../../../components/ui";
import { useCreateOrder } from "../production.hooks";

type Mode = "same" | "perRow";

const key = (component: string, size: string) => `${component}|${size}`;

/**
 * New order for a design. Two ways to enter quantities:
 * - Same for all rows: one Order Quantity used for every Component + Size.
 * - Different per row: the Order Quantity is disabled and each row gets its own quantity
 *   (blank / 0 = that row is not ordered).
 */
export function NewOrderDialog({ design, onClose }: { design: DesignDetailDTO; onClose: () => void }) {
  const navigate = useNavigate();
  const create = useCreateOrder();
  const [party, setParty] = useState("");
  const [orderDate, setOrderDate] = useState(today());
  const [mode, setMode] = useState<Mode>("same");
  const [quantity, setQuantity] = useState("");
  const [rowQty, setRowQty] = useState<Record<string, string>>({});

  const parties = [...new Set(design.orders.map((o) => o.party))];
  const components = [...new Set(design.items.map((i) => i.component))];
  const sizesOf = (c: string) => design.items.filter((i) => i.component === c);

  const rows = design.items.map((i) => ({
    component: i.component,
    size: i.size,
    quantity: Number(mode === "same" ? quantity : rowQty[key(i.component, i.size)]) || 0,
  }));
  const ordered = rows.filter((r) => r.quantity > 0);
  const totalPieces = ordered.reduce((s, r) => s + r.quantity, 0);
  const canSubmit = ordered.length > 0;

  // Typing in a component's "fill" box sets every size of that component.
  const fillComponent = (c: string, v: string) =>
    setRowQty({ ...rowQty, ...Object.fromEntries(sizesOf(c).map((i) => [key(c, i.size), v])) });
  const commonValue = (c: string) => {
    const values = new Set(sizesOf(c).map((i) => rowQty[key(c, i.size)] ?? ""));
    return values.size === 1 ? [...values][0] : "";
  };

  function submit() {
    if (!canSubmit) return;
    create.mutate(
      mode === "same"
        ? { designNo: design.designNo, party, orderDate, quantity: Number(quantity) }
        : { designNo: design.designNo, party, orderDate, lines: ordered },
      { onSuccess: (order) => navigate(`/production/orders/${order.id}`) },
    );
  }

  return (
    <Modal
      open
      width={680}
      title={`New order · Design ${design.designNo}`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <span className="muted" style={{ marginRight: "auto" }}>
            {canSubmit
              ? `${ordered.length} of ${rows.length} rows · ${formatNumber(totalPieces)} pieces`
              : mode === "same"
                ? "Enter the Order Quantity"
                : "Enter a quantity for at least one row"}
          </span>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={create.isPending || !canSubmit}>
            {create.isPending ? "Creating…" : "Create New Order"}
          </button>
        </>
      }
    >
      <ErrorAlert error={create.error} />
      <p className="muted" style={{ margin: 0 }}>
        {design.productName} · {components.length} component(s), {rows.length} size rows. Consumption comes from the Punching Master.
      </p>

      <div className="form-grid">
        <Field label="Party">
          <input className="input" required autoFocus list="order-parties" value={party} onChange={(e) => setParty(e.target.value)} />
        </Field>
        <Field label="Order date">
          <input className="input" type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </Field>
      </div>
      <datalist id="order-parties">
        {parties.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className="field">
        <span>Quantities</span>
        <div className="segmented" role="radiogroup" aria-label="How quantities are entered">
          {(
            [
              ["same", "Same for all rows"],
              ["perRow", "Different per row"],
            ] as const
          ).map(([m, label]) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <Field
        label="Order Quantity"
        hint={mode === "same" ? `Used for all ${rows.length} rows.` : "Not used — enter a quantity for each row below."}
      >
        <NumberInput
          integer
          min={1}
          required={mode === "same"}
          disabled={mode === "perRow"}
          placeholder={mode === "same" ? "e.g. 230" : "—"}
          style={{ maxWidth: 220 }}
          value={mode === "same" ? quantity : ""}
          onChange={setQuantity}
        />
      </Field>

      {mode === "perRow" && (
        <div className="table-wrap card" style={{ maxHeight: "42vh" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Size</th>
                <th className="num" style={{ width: 170 }}>
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => [
                <tr key={c} className="group-row">
                  <td colSpan={2}>
                    <strong>{c}</strong> <span className="muted">· {sizesOf(c).length} size(s)</span>
                  </td>
                  <td>
                    {sizesOf(c).length > 1 && (
                      <NumberInput
                        integer
                        aria-label={`Fill all ${c} sizes`}
                        placeholder="Fill all sizes"
                        value={commonValue(c)}
                        onChange={(v) => fillComponent(c, v)}
                      />
                    )}
                  </td>
                </tr>,
                ...sizesOf(c).map((i) => (
                  <tr key={i.id}>
                    <td />
                    <td>{i.size}</td>
                    <td>
                      <NumberInput
                        integer
                        aria-label={`${c} ${i.size} quantity`}
                        placeholder="0"
                        value={rowQty[key(c, i.size)] ?? ""}
                        onChange={(v) => setRowQty({ ...rowQty, [key(c, i.size)]: v })}
                      />
                    </td>
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </div>
      )}
      {mode === "perRow" && <small className="muted">Rows left blank or 0 are not ordered.</small>}
    </Modal>
  );
}
