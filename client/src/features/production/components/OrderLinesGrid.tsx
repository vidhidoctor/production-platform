import { useMemo, useState } from "react";
import type { CatalogItemDTO } from "@pp/shared";
import { formatNumber } from "../../../lib/format";
import { NumberInput } from "../../../components/ui";

export interface LineDraft {
  key: number;
  component: string;
  size: string;
  quantity: string;
}

let nextKey = 1;
export const newLine = (component = "", size = "", quantity = ""): LineDraft => ({ key: nextKey++, component, size, quantity });

interface Props {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  /** Punching Master entries of the order's design only. */
  catalog: CatalogItemDTO[];
}

/** Editable Component + Size + Quantity rows. Only combinations in the design's Punching Master can be picked. */
export function OrderLinesGrid({ lines, onChange, catalog }: Props) {
  const components = useMemo(() => [...new Set(catalog.map((c) => c.component))], [catalog]);
  const sizesOf = (component: string) => catalog.filter((c) => c.component === component).map((c) => c.size);
  const [bulkComponent, setBulkComponent] = useState("");
  const disabled = catalog.length === 0;

  const update = (key: number, patch: Partial<LineDraft>) =>
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  // Adds a row for every size of a component that is not already in the order.
  function addAllSizes() {
    const have = new Set(lines.map((l) => `${l.component}|${l.size}`));
    const added = sizesOf(bulkComponent)
      .filter((s) => !have.has(`${bulkComponent}|${s}`))
      .map((s) => newLine(bulkComponent, s));
    onChange([...lines.filter((l) => l.component || l.size || l.quantity), ...added]);
  }

  const totalPieces = lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0);

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th>Component</th>
              <th>Size</th>
              <th className="num" style={{ width: 160 }}>
                Order quantity
              </th>
              <th style={{ width: 60 }} />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.key}>
                <td className="muted">{i + 1}</td>
                <td>
                  <select
                    className="input"
                    required
                    value={l.component}
                    disabled={disabled}
                    aria-label={`Row ${i + 1} component`}
                    onChange={(e) => update(l.key, { component: e.target.value, size: "" })}
                  >
                    <option value="">{disabled ? "Pick a design first" : "Choose…"}</option>
                    {components.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className="input"
                    required
                    value={l.size}
                    disabled={!l.component}
                    aria-label={`Row ${i + 1} size`}
                    onChange={(e) => update(l.key, { size: e.target.value })}
                  >
                    <option value="">Choose…</option>
                    {sizesOf(l.component).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberInput
                    integer
                    min={1}
                    required
                    aria-label={`Row ${i + 1} quantity`}
                    value={l.quantity}
                    onChange={(v) => update(l.key, { quantity: v })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    aria-label={`Remove row ${i + 1}`}
                    disabled={lines.length === 1}
                    onClick={() => onChange(lines.filter((x) => x.key !== l.key))}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td colSpan={2}>{lines.length} rows</td>
              <td className="num">{formatNumber(totalPieces)} pcs</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => onChange([...lines, newLine()])}>
          + Add row
        </button>
        <span className="spacer" />
        <select
          className="input"
          style={{ width: 160 }}
          value={bulkComponent}
          disabled={disabled}
          onChange={(e) => setBulkComponent(e.target.value)}
          aria-label="Component to add all sizes for"
        >
          <option value="">Component…</option>
          {components.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button type="button" className="btn btn-sm" disabled={!bulkComponent} onClick={addAllSizes}>
          Add all sizes
        </button>
      </div>
    </div>
  );
}
