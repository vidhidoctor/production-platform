import { useState } from "react";
import type { MaterialCategory } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { PageHeader, QueryState } from "../../components/ui";
import { OrderScope } from "./components/OrderScope";
import { ComponentDetails } from "./components/ComponentDetails";
import { BeadsSection, CordSection, PurchaseSummary, SequenceSection, type Row } from "./components/PurchaseSections";
import { useOrderChoices, usePurchaseRequirements, useScopeParams } from "./reports.hooks";

type CategoryFilter = "ALL" | MaterialCategory;

const CATEGORIES: [CategoryFilter, string][] = [
  ["ALL", "All materials"],
  ["SEQUENCE", "Sequence"],
  ["BEAD", "Beads & decorative"],
  ["CORD", "Cord"],
];

export function PurchaseRequirementsPage() {
  const [scope, setScope] = useScopeParams();
  const req = usePurchaseRequirements(scope);
  const { can } = useAuth();
  const order = useOrderChoices(can("PRODUCTION_VIEW")).data?.find((o) => o.id === scope.orderId);

  // Display filters — they only hide rows / sections; the figures themselves never change.
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [onlyRequired, setOnlyRequired] = useState(true);
  const [materialQ, setMaterialQ] = useState("");
  const viewFiltered = category !== "ALL" || !onlyRequired || materialQ !== "";
  const anyFilter = viewFiltered || !!scope.orderId;

  function resetAll() {
    setCategory("ALL");
    setOnlyRequired(true);
    setMaterialQ("");
    setScope({ components: [] });
  }

  const byCategory = (c: MaterialCategory) => req.data?.totals.filter((t) => t.category === c) ?? [];
  const visible = (rows: Row[]) =>
    rows.filter(
      (r) => (!onlyRequired || Number(r.total) > 0) && (!materialQ || r.name.toLowerCase().includes(materialQ.trim().toLowerCase())),
    );
  const show = (c: MaterialCategory) => category === "ALL" || category === c;

  return (
    <>
      <PageHeader
        title="Purchase Requirements"
        subtitle="Review the material required for production orders and plan your purchases."
      />

      <div className="card filter-panel">
        <div className="filter-section">
          <div className="row">
            <span className="eyebrow">Filters</span>
            <span className="spacer" />
            {anyFilter && (
              <button type="button" className="link-btn" style={{ fontSize: 13 }} onClick={resetAll}>
                Reset all filters
              </button>
            )}
          </div>
          <OrderScope scope={scope} onChange={setScope} />
        </div>
        <div className="filter-section">
          <div className="filter-row">
            <span className="filter-label">Show</span>
            <div className="segmented" role="radiogroup" aria-label="Material category">
              {CATEGORIES.map(([c, label]) => (
                <button key={c} type="button" role="radio" aria-checked={category === c} onClick={() => setCategory(c)}>
                  {label}
                </button>
              ))}
            </div>
            <label className="switch">
              <input type="checkbox" checked={onlyRequired} onChange={(e) => setOnlyRequired(e.target.checked)} />
              Only materials with a requirement
            </label>
            <span className="spacer" />
            <input
              className="input"
              type="search"
              style={{ maxWidth: 220 }}
              placeholder="Find material…"
              aria-label="Find material"
              value={materialQ}
              onChange={(e) => setMaterialQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      <QueryState isPending={req.isPending} error={req.error}>
        {() => {
          const sequence = byCategory("SEQUENCE");
          const beads = byCategory("BEAD");
          const cord = byCategory("CORD");
          const hidden = (rows: Row[]) => rows.length - visible(rows).length;
          return (
            <div className={`stack ${req.isPlaceholderData ? "stale" : ""}`} aria-busy={req.isPlaceholderData}>
              {req.data!.errors.map((e) => (
                <div key={e} className="alert alert-warning">
                  {e}
                </div>
              ))}

              <div className="stack" style={{ gap: 8 }}>
                <div className="row">
                  <span className="eyebrow">Summary</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {scope.orderId
                      ? `Order #${scope.orderId}${scope.components.length ? ` · ${scope.components.join(" + ")} only` : ""}`
                      : `${req.data!.orderIds.length} order(s) combined`}
                  </span>
                </div>
                <PurchaseSummary sequence={sequence} beads={beads} cord={cord} />
              </div>

              {show("SEQUENCE") && <SequenceSection rows={visible(sequence)} hiddenCount={hidden(sequence)} />}
              {show("BEAD") && <BeadsSection rows={visible(beads)} hiddenCount={hidden(beads)} />}
              {show("CORD") && <CordSection rows={visible(cord)} hiddenCount={hidden(cord)} />}

              {/* The chosen order: what Punching entered for the ticked components (all if none ticked).
                  Folded until components are ticked, so the page stays short. */}
              {order && (
                <details key={scope.components.join(",")} className="card fold" open={scope.components.length > 0}>
                  <summary>
                    <span className="eyebrow">Punched details</span>
                    <span className="muted" style={{ fontSize: 13 }}>
                      Design {order.designNo} · {scope.components.length ? scope.components.join(", ") : "all components"} · consumption per piece
                    </span>
                  </summary>
                  <div className="stack" style={{ padding: 12 }}>
                    <ComponentDetails designNo={order.designNo} components={scope.components} />
                  </div>
                </details>
              )}
            </div>
          );
        }}
      </QueryState>
    </>
  );
}
