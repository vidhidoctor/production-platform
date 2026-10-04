import { useState } from "react";
import { ORDER_STATUS_LABELS, type ProductionOrderDTO } from "@pp/shared";
import { useAuth } from "../../../lib/auth";
import { formatDate, formatNumber } from "../../../lib/format";
import { DataGrid, type Column } from "../../../components/DataGrid";
import type { Scope } from "../reports.api";
import { useOrderChoices } from "../reports.hooks";

// "26249" finds design "26-249"
const squash = (s: string) => s.toUpperCase().replace(/[\s-]/g, "");

const matches = (o: ProductionOrderDTO, q: string) =>
  squash(o.designNo).includes(squash(q)) || o.party.toUpperCase().includes(q.trim().toUpperCase()) || String(o.id) === q.trim();

const resultColumns: Column<ProductionOrderDTO>[] = [
  { key: "id", header: "Order #", render: (o) => <span className="muted">#{o.id}</span> },
  { key: "designNo", header: "Design No.", render: (o) => <strong>{o.designNo}</strong> },
  { key: "party", header: "Party", render: (o) => o.party },
  { key: "qty", header: "Order Quantity", align: "right", render: (o) => (o.quantity === null ? "Per row" : formatNumber(o.quantity)) },
  { key: "status", header: "Status", render: (o) => ORDER_STATUS_LABELS[o.status] },
  { key: "date", header: "Order date", render: (o) => formatDate(o.orderDate) },
];

export const orderComponents = (o: ProductionOrderDTO) => [...new Set(o.lines.map((l) => l.component))];

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

/**
 * Filter panel rows for choosing the orders a requirement covers: search an order (design no.,
 * party or order #), then tick the components to include. No order = all orders combined;
 * no component ticked = every component of the order.
 */
export function OrderScope({ scope, onChange }: { scope: Scope; onChange: (s: Scope) => void }) {
  const { can } = useAuth();
  const orders = useOrderChoices(can("PRODUCTION_VIEW"));
  const [q, setQ] = useState("");
  const selected = orders.data?.find((o) => o.id === scope.orderId);

  if (!can("PRODUCTION_VIEW")) {
    return (
      <div className="filter-row">
        <span className="filter-label">Orders</span>
        <span className="chip chip-active">All orders combined (except cancelled)</span>
      </div>
    );
  }

  if (scope.orderId) {
    const components = selected ? orderComponents(selected) : [];
    const toggle = (c: string) =>
      onChange({
        orderId: scope.orderId,
        components: scope.components.includes(c) ? scope.components.filter((x) => x !== c) : [...scope.components, c],
      });
    const clear = () => {
      setQ("");
      onChange({ components: [] });
    };
    return (
      <>
        <div className="filter-row">
          <span className="filter-label">Order</span>
          <div className="selected-order">
            <strong>#{scope.orderId}</strong>
            {selected && (
              <>
                <span>Design {selected.designNo}</span>
                <span className="muted">·</span>
                <span>{selected.party}</span>
                <span className="muted">
                  · {selected.quantity === null ? "Quantity per row" : `Order Quantity ${formatNumber(selected.quantity)}`} ·{" "}
                  {ORDER_STATUS_LABELS[selected.status]}
                </span>
              </>
            )}
          </div>
          <button type="button" className="btn btn-sm" onClick={clear}>
            ✕ Clear order
          </button>
        </div>
        {components.length > 0 && (
          <div className="filter-row" role="group" aria-label="Components">
            <span className="filter-label">Components</span>
            {components.map((c) => (
              <label key={c} className="chip chip-check">
                <input type="checkbox" checked={scope.components.includes(c)} onChange={() => toggle(c)} />
                {c}
              </label>
            ))}
            <span className="muted" style={{ fontSize: 12 }}>
              {scope.components.length ? (
                <button type="button" className="link-btn" onClick={() => onChange({ orderId: scope.orderId, components: [] })}>
                  Show all components
                </button>
              ) : (
                "None ticked = all components"
              )}
            </span>
          </div>
        )}
      </>
    );
  }

  const results = q.trim() ? (orders.data ?? []).filter((o) => matches(o, q)).slice(0, 10) : [];
  return (
    <>
      <div className="filter-row">
        <span className="filter-label">Order</span>
        <div className="search-box">
          <SearchIcon />
          <input
            className="input"
            type="search"
            placeholder="Search order — design no., party or order #"
            aria-label="Search order"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="muted" style={{ fontSize: 12 }}>
          Search by <span className="chip">Design No.</span> <span className="chip">Party</span> <span className="chip">Order #</span>
        </span>
      </div>
      {q.trim() ? (
        <div className="search-results">
          <DataGrid
            columns={resultColumns}
            rows={results}
            rowKey={(o) => o.id}
            onRowClick={(o) => onChange({ orderId: o.id, components: [] })}
            empty={`No order matching "${q}".`}
          />
        </div>
      ) : (
        <div className="filter-row">
          <span className="filter-label" />
          <span className="chip chip-active">Showing all orders combined (except cancelled)</span>
        </div>
      )}
    </>
  );
}
