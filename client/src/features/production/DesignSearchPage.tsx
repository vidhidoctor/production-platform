import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import type { DesignSummaryDTO } from "@pp/shared";
import { DataGrid, type Column } from "../../components/DataGrid";
import { PageHeader, QueryState } from "../../components/ui";
import { useDesignSearch } from "./production.hooks";

const columns: Column<DesignSummaryDTO>[] = [
  { key: "designNo", header: "Design No.", render: (d) => <strong>{d.designNo}</strong> },
  { key: "productName", header: "Product", render: (d) => d.productName },
  { key: "entries", header: "Component + Size rows", align: "right", render: (d) => d.entries },
  {
    key: "orders",
    header: "Previous orders",
    align: "right",
    render: (d) => (d.orders ? d.orders : <span className="muted">none</span>),
  },
];

/** Production starts here: find the design Punching has set up, then order it. */
export function DesignSearchPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const results = useDesignSearch(q.trim());
  const designs = results.data ?? [];
  const open = (d: DesignSummaryDTO) => navigate(`/production/designs/${encodeURIComponent(d.designNo)}`);

  // Enter opens the design when the search leaves exactly one.
  function submit(e: FormEvent) {
    e.preventDefault();
    if (designs.length === 1) open(designs[0]);
  }

  return (
    <>
      <PageHeader
        title="Design search"
        subtitle="Find a design entered by Punching to see its details and previous orders."
        actions={
          <Link className="btn" to="/production/orders">
            All orders
          </Link>
        }
      />
      <form onSubmit={submit}>
        <input
          className="input"
          style={{ height: 44, fontSize: 16, maxWidth: 480 }}
          type="search"
          autoFocus
          placeholder="Design Number, e.g. 26-49"
          aria-label="Design Number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <QueryState isPending={results.isPending} error={results.error}>
        {() => (
          <div className="card">
            <DataGrid
              columns={columns}
              rows={designs}
              rowKey={(d) => d.designNo}
              onRowClick={open}
              empty={q ? `No design matching "${q}" in the Punching Master.` : "No designs in the Punching Master yet."}
            />
          </div>
        )}
      </QueryState>
    </>
  );
}
