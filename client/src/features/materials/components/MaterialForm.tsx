import { useState } from "react";
import { CORD_DIVISOR, MATERIAL_CATEGORIES, type MaterialCategory, type MaterialDTO } from "@pp/shared";
import { Modal } from "../../../components/Modal";
import { ErrorAlert, Field, NumberInput } from "../../../components/ui";
import { useSaveMaterial } from "../materials.hooks";

type RuleField = "seqPerCd" | "cdPerRoll" | "cdPerRound" | "pcsPerKg" | "denier";

// Which conversion numbers each category uses (the server requires the non-optional ones).
const RULES: Record<MaterialCategory, { field: RuleField; label: string; optional?: boolean }[]> = {
  SEQUENCE: [
    { field: "seqPerCd", label: "Sequences per CD" },
    { field: "cdPerRoll", label: "CDs per roll" },
    { field: "cdPerRound", label: "CDs per round", optional: true },
  ],
  BEAD: [{ field: "pcsPerKg", label: "Pieces per KG" }],
  CORD: [{ field: "denier", label: "Denier" }],
};

const HELP: Record<MaterialCategory, string> = {
  SEQUENCE: "Measured in PCS. Purchase: PCS ÷ sequences per CD = CD, ÷ CDs per roll = rolls.",
  BEAD: "Bead, moti, pipe, zardoshi. Measured in PCS. Purchase: PCS ÷ pieces per KG = KG.",
  CORD: `Measured in MTR. Purchase: MTR × denier ÷ ${CORD_DIVISOR} = grams.`,
};

const text = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function MaterialForm({ material, onClose }: { material?: MaterialDTO; onClose: () => void }) {
  const save = useSaveMaterial();
  const [code, setCode] = useState(material?.code ?? "");
  const [name, setName] = useState(material?.name ?? "");
  const [category, setCategory] = useState<MaterialCategory>(material?.category ?? "SEQUENCE");
  const [sortOrder, setSortOrder] = useState(text(material?.sortOrder));
  const [rules, setRules] = useState<Record<RuleField, string>>({
    seqPerCd: text(material?.seqPerCd),
    cdPerRoll: text(material?.cdPerRoll),
    cdPerRound: text(material?.cdPerRound),
    pcsPerKg: text(material?.pcsPerKg),
    denier: text(material?.denier),
  });

  function submit() {
    const ruleValues = Object.fromEntries(
      RULES[category].map(({ field }) => [field, rules[field] === "" ? null : Number(rules[field])]),
    );
    save.mutate(
      {
        id: material?.id,
        body: { code, name, category, sortOrder: sortOrder === "" ? undefined : Number(sortOrder), ...ruleValues },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal
      open
      width={600}
      title={material ? `Edit ${material.name}` : "Add material"}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <ErrorAlert error={save.error} />
      <div className="form-grid">
        <Field label="Code" hint={material ? "Cannot be changed." : "e.g. SEQ-5MM — used in reports"}>
          <input className="input" required disabled={!!material} value={code} onChange={(e) => setCode(e.target.value)} autoFocus={!material} />
        </Field>
        <Field label="Name" hint="Column heading in the Punching Master">
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} autoFocus={!!material} />
        </Field>
        <Field label="Category">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as MaterialCategory)}>
            {MATERIAL_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Column position" hint={material ? "Lower comes first" : "Blank = last"}>
          <NumberInput integer value={sortOrder} onChange={setSortOrder} />
        </Field>
      </div>
      <div className="alert alert-info">{HELP[category]}</div>
      <div className="form-grid">
        {RULES[category].map(({ field, label, optional }) => (
          <Field key={field} label={label} hint={optional ? "Optional" : undefined}>
            <NumberInput integer min={1} required={!optional} value={rules[field]} onChange={(v) => setRules({ ...rules, [field]: v })} />
          </Field>
        ))}
      </div>
      {material && material.category !== category && (
        <div className="alert alert-warning">
          Changing the category changes how this material is converted to purchase units. Rules from {material.category} will be cleared.
        </div>
      )}
    </Modal>
  );
}
