import { useState } from "react";
import type { MaterialColumnDTO, PunchingItemDTO } from "@pp/shared";
import { Modal } from "../../../components/Modal";
import { ErrorAlert, Field, NumberInput } from "../../../components/ui";
import { useSaveComponent } from "../punching.hooks";

const COMPONENT_EXAMPLES = ["FROCK", "KALI", "BLOUSE", "BELT", "GALISH"];

interface RowDraft {
  key: number;
  size: string;
  stitch: string;
  laser: string;
  qty: Record<string, string>;
}

let nextKey = 1;
const text = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

function toDraft(materials: MaterialColumnDTO[], item?: PunchingItemDTO): RowDraft {
  return {
    key: nextKey++,
    size: item?.size ?? "",
    stitch: text(item?.stitch),
    laser: text(item?.laser),
    qty: Object.fromEntries(materials.map((m) => [m.code, item?.consumption[m.code] ?? ""])),
  };
}

interface Props {
  designNo: string;
  materials: MaterialColumnDTO[];
  /** Components the design already has (can't be added twice). */
  existing: string[];
  /** Editing: the component and its current size rows. Adding: undefined. */
  component?: string;
  rows?: PunchingItemDTO[];
  onClose: () => void;
}

/** One component of a design: a grid with one row per size (Stitch, Laser, consumption per piece). */
export function ComponentEditor({ designNo, materials, existing, component, rows, onClose }: Props) {
  const save = useSaveComponent();
  const [name, setName] = useState(component ?? "");
  const [drafts, setDrafts] = useState<RowDraft[]>(() =>
    rows?.length ? rows.map((r) => toDraft(materials, r)) : [toDraft(materials)],
  );
  const taken = !component && existing.includes(name.trim().toUpperCase());

  const update = (key: number, patch: Partial<RowDraft>) => setDrafts(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  function submit() {
    if (taken) return;
    save.mutate(
      {
        designNo,
        component: name,
        rows: drafts.map((d) => ({
          size: d.size,
          stitch: Number(d.stitch),
          laser: d.laser === "" ? null : Number(d.laser),
          // blank = 0; the server drops zeros
          consumption: Object.fromEntries(materials.map((m) => [m.code, d.qty[m.code] === "" ? 0 : d.qty[m.code]])),
        })),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal
      open
      width={1200}
      title={component ? `${designNo} · Edit ${component}` : `${designNo} · Add component`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={save.isPending || taken}>
            {save.isPending ? "Saving…" : "Save component"}
          </button>
        </>
      }
    >
      <ErrorAlert error={save.error} />
      <div className="form-grid">
        <Field
          label="Component"
          hint={taken ? "This design already has that component — edit it instead." : component ? "Cannot be renamed." : "e.g. Kali, Galish, Frock"}
        >
          <input className="input" required autoFocus={!component} disabled={!!component} list="ce-components" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      <datalist id="ce-components">
        {COMPONENT_EXAMPLES.filter((c) => !existing.includes(c)).map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="row">
        <h2>Sizes</h2>
        <span className="muted">One row per size. Consumption is per piece; blank = 0.</span>
      </div>
      <div className="table-wrap" style={{ maxHeight: "50vh" }}>
        <table className="table">
          <thead>
            <tr>
              <th className="sticky-col" style={{ minWidth: 90 }}>
                Size
              </th>
              <th style={{ minWidth: 90 }}>Stitch</th>
              <th style={{ minWidth: 90 }}>
                Laser <span className="muted">(opt.)</span>
              </th>
              {materials.map((m) => (
                <th key={m.code} style={{ minWidth: 110 }}>
                  {m.name}
                  <br />
                  <span className="muted">{m.unit}</span>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {drafts.map((d, i) => (
              <tr key={d.key}>
                <td className="sticky-col">
                  <input className="input" required aria-label={`Row ${i + 1} size`} value={d.size} onChange={(e) => update(d.key, { size: e.target.value })} />
                </td>
                <td>
                  <NumberInput integer required aria-label={`Row ${i + 1} stitch`} value={d.stitch} onChange={(v) => update(d.key, { stitch: v })} />
                </td>
                <td>
                  <NumberInput integer aria-label={`Row ${i + 1} laser`} value={d.laser} onChange={(v) => update(d.key, { laser: v })} />
                </td>
                {materials.map((m) => (
                  <td key={m.code}>
                    <NumberInput
                      placeholder="0"
                      aria-label={`Row ${i + 1} ${m.name}`}
                      value={d.qty[m.code]}
                      onChange={(v) => update(d.key, { qty: { ...d.qty, [m.code]: v } })}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    aria-label={`Remove row ${i + 1}`}
                    disabled={drafts.length === 1}
                    onClick={() => setDrafts(drafts.filter((x) => x.key !== d.key))}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row">
        <button type="button" className="btn btn-sm" onClick={() => setDrafts([...drafts, toDraft(materials)])}>
          + Add size
        </button>
        {component && <span className="muted">Removing a size deletes it when you save (not allowed if an order uses it).</span>}
      </div>
    </Modal>
  );
}
