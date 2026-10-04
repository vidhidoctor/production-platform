import { useState } from "react";
import { useNavigate } from "react-router";
import type { PunchingDesignSummaryDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { formatDate } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { PageHeader, QueryState } from "../../components/ui";
import { useDesigns } from "./punching.hooks";
import { NewDesignDialog } from "./components/NewDesignDialog";

// "26249" finds "26-249"
const squash = (s: string) => s.toUpperCase().replace(/[\s-]/g, "");

const columns: Column<PunchingDesignSummaryDTO>[] = [
  { key: "designNo", header: "Design No.", render: (d) => <strong>{d.designNo}</strong> },
  { key: "productName", header: "Product", render: (d) => d.productName },
  {
    key: "components",
    header: "Components",
    render: (d) =>
      d.components.length ? (
        <div className="row" style={{ gap: 4 }}>
          {d.components.map((c) => (
            <span key={c.component} className="badge badge-primary" title={`Sizes: ${c.sizes.join(", ")}`}>
              {c.component} · {c.sizes.length}
            </span>
          ))}
        </div>
      ) : (
        <span className="badge badge-warning">No components yet</span>
      ),
  },
  { key: "created", header: "Created", render: (d) => formatDate(d.createdAt) },
];

/** Punching starts here: every design, each with its components. */
export function PunchingPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const designs = useDesigns();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  const rows = designs.data?.filter((d) => squash(d.designNo).includes(squash(q))) ?? [];
  const products = [...new Set(designs.data?.map((d) => d.productName))];

  return (
    <>
      <PageHeader
        title="Punching Master"
        subtitle="Each design holds its components (Kali, Galish …), and each component its sizes and consumption."
        actions={
          can("PUNCHING_CREATE") && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              + New design
            </button>
          )
        }
      />
      <input
        className="input"
        type="search"
        style={{ maxWidth: 360 }}
        placeholder="Search Design Number"
        aria-label="Search Design Number"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <QueryState isPending={designs.isPending} error={designs.error}>
        {() => (
          <div className="card">
            <DataGrid
              columns={columns}
              rows={rows}
              rowKey={(d) => d.designNo}
              onRowClick={(d) => navigate(`/punching/designs/${encodeURIComponent(d.designNo)}`)}
              empty={q ? `No design matching "${q}".` : "No designs yet. Create the first one."}
            />
          </div>
        )}
      </QueryState>
      {creating && <NewDesignDialog products={products} onClose={() => setCreating(false)} />}
    </>
  );
}
