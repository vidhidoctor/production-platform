// Display pieces of the Purchase Requirements page. Every number comes straight from the
// /purchase/requirements response; nothing here recalculates a requirement.
import type { ReactNode } from "react";
import { CORD_DIVISOR, type PurchaseRequirementDTO } from "@pp/shared";
import { formatFixed, formatNumber } from "../../../lib/format";
import { DataGrid, type Column } from "../../../components/DataGrid";

export type Row = PurchaseRequirementDTO["totals"][number];

/** One field of a row's purchase conversion as a number, or null when it doesn't apply / failed. */
export function purchaseValue(r: Row, field: "cds" | "rolls" | "kg" | "grams"): number | null {
  const p = r.purchase as Record<string, string> | null;
  return p && field in p ? Number(p[field]) : null;
}

const sum = (rows: Row[], field: "rolls" | "kg") => rows.reduce((s, r) => s + (purchaseValue(r, field) ?? 0), 0);
const isRequired = (r: Row) => Number(r.total) > 0;

// ---------- summary ----------

function SummaryCard({ href, label, value, unit, sub }: { href: string; label: string; value: string; unit: string; sub: ReactNode }) {
  return (
    <a className="card summary-card" href={href}>
      <span className="label">{label}</span>
      <span className="value">
        {value}
        <small>{unit}</small>
      </span>
      <span className="sub">{sub}</span>
    </a>
  );
}

const required = (rows: Row[]) => `${rows.filter(isRequired).length} of ${rows.length} materials required`;

/** Totals of the purchase quantities shown in the sections below (links jump to them). */
export function PurchaseSummary({ sequence, beads, cord }: { sequence: Row[]; beads: Row[]; cord: Row[] }) {
  const cordRow = cord[0];
  return (
    <div className="summary-grid">
      <SummaryCard href="#sequence" label="Sequence rolls" value={formatFixed(sum(sequence, "rolls"))} unit="Rolls" sub={required(sequence)} />
      <SummaryCard href="#beads" label="Beads & decorative" value={formatFixed(sum(beads, "kg"))} unit="KG" sub={required(beads)} />
      <SummaryCard
        href="#cord"
        label="Cord"
        value={formatFixed(sum(cord, "kg"))}
        unit="KG"
        sub={cordRow ? `${formatNumber(cordRow.total)} MTR required` : "No cord material"}
      />
    </div>
  );
}

// ---------- sections ----------

function Section({ id, title, subtitle, flow, children }: { id: string; title: string; subtitle: string; flow: string; children: ReactNode }) {
  return (
    <section id={id} className="card" style={{ scrollMarginTop: 16 }}>
      <div className="section-head">
        <div className="titles">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="flow-badge">{flow}</span>
      </div>
      {children}
    </section>
  );
}

const materialCol: Column<Row> = {
  key: "name",
  header: "Material",
  render: (r) => (
    <>
      <strong>{r.name}</strong>
      {r.error && (
        <>
          {" "}
          <span className="badge badge-warning">{r.error}</span>
        </>
      )}
    </>
  ),
};

const withUnit = (v: string, unit: string, soft = false) => (
  <span className={soft ? "num-soft" : undefined}>
    {v}
    <span className="unit">{unit}</span>
  </span>
);

const emphasized = (v: number | null) =>
  v === null ? <span className="muted">—</span> : <span className={`qty-strong ${v === 0 ? "zero" : ""}`}>{formatFixed(v)}</span>;

const SEQUENCE_COLUMNS: Column<Row>[] = [
  materialCol,
  { key: "total", header: "Required", align: "right", render: (r) => withUnit(formatNumber(r.total), "PCS") },
  { key: "cds", header: "CD", align: "right", render: (r) => withUnit(formatFixed(purchaseValue(r, "cds")), "CD", true) },
  { key: "rolls", header: <span className="emph">Purchase · Rolls</span>, align: "right", render: (r) => emphasized(purchaseValue(r, "rolls")) },
];

const BEAD_COLUMNS: Column<Row>[] = [
  materialCol,
  { key: "total", header: "Required", align: "right", render: (r) => withUnit(formatNumber(r.total), "PCS") },
  { key: "kg", header: <span className="emph">Purchase · KG</span>, align: "right", render: (r) => emphasized(purchaseValue(r, "kg")) },
];

function MaterialTable({ rows, columns, hiddenCount, what }: { rows: Row[]; columns: Column<Row>[]; hiddenCount: number; what: string }) {
  return (
    <>
      {rows.length > 0 ? (
        <DataGrid columns={columns} rows={rows} rowKey={(r) => r.code} />
      ) : (
        <div className="section-empty">No {what} required for this selection.</div>
      )}
      {hiddenCount > 0 && <div className="section-empty">{hiddenCount} material(s) hidden by the filters.</div>}
    </>
  );
}

export function SequenceSection({ rows, hiddenCount }: { rows: Row[]; hiddenCount: number }) {
  return (
    <Section id="sequence" title="Sequence Material Requirements" subtitle="Required sequence quantity converted into purchase rolls" flow="PCS → CD → Rolls">
      <MaterialTable rows={rows} columns={SEQUENCE_COLUMNS} hiddenCount={hiddenCount} what="sequence material" />
    </Section>
  );
}

export function BeadsSection({ rows, hiddenCount }: { rows: Row[]; hiddenCount: number }) {
  return (
    <Section id="beads" title="Beads & Decorative Materials" subtitle="Required material quantity converted into kilograms" flow="PCS → KG">
      <MaterialTable rows={rows} columns={BEAD_COLUMNS} hiddenCount={hiddenCount} what="beads or decorative material" />
    </Section>
  );
}

/** Cord: Total MTR, Denier and the purchase KG, as three blocks per cord material. */
export function CordSection({ rows, hiddenCount }: { rows: Row[]; hiddenCount: number }) {
  return (
    <Section id="cord" title="Cord Requirement" subtitle="Total cord requirement converted into purchase quantity" flow="MTR × Denier ÷ 9000 → KG">
      {rows.length === 0 && <div className="section-empty">No cord required for this selection.</div>}
      {rows.map((r, i) => {
        const grams = purchaseValue(r, "grams");
        const mtr = Number(r.total);
        // Denier isn't in the response; it is read back from values that are (grams = MTR × denier ÷ 9000).
        const denier = grams !== null && mtr > 0 ? (grams * CORD_DIVISOR) / mtr : null;
        return (
          <div key={r.code} style={i ? { borderTop: "1px solid var(--border)" } : undefined}>
            {rows.length > 1 && <div className="section-empty" style={{ paddingBottom: 0 }}><strong>{r.name}</strong></div>}
            {r.error && <div className="alert alert-warning" style={{ margin: "12px 16px 0" }}>{r.error}</div>}
            <div className="cord-grid">
              <div>
                <span className="label">Total required</span>
                <span className="value">{withUnit(formatNumber(r.total), "MTR")}</span>
              </div>
              <div>
                <span className="label">Denier</span>
                <span className="value">{denier === null ? <span className="muted">—</span> : formatNumber(denier, 0)}</span>
              </div>
              <div className="result">
                <span className="label">Purchase quantity</span>
                <span className="value">
                  {purchaseValue(r, "kg") === null ? "—" : formatFixed(purchaseValue(r, "kg"))}
                  <span className="unit">KG</span>
                </span>
                {grams !== null && <span className="muted" style={{ fontSize: 12 }}>= {formatFixed(grams, 0)} grams</span>}
              </div>
            </div>
          </div>
        );
      })}
      {hiddenCount > 0 && <div className="section-empty">{hiddenCount} material(s) hidden by the filters.</div>}
    </Section>
  );
}
