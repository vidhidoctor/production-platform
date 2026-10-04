import type { MaterialSummaryDTO } from "@pp/shared";
import { formatNumber } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { PageHeader, QueryState } from "../../components/ui";
import { OrderScope } from "./components/OrderScope";
import { useMaterialRequirements, useScopeParams } from "./reports.hooks";

type Row = MaterialSummaryDTO["totals"][number];

const columns: Column<Row>[] = [
  { key: "name", header: "Material", render: (t) => <strong>{t.name}</strong> },
  { key: "category", header: "Category", render: (t) => <span className="badge">{t.category}</span> },
  {
    key: "total",
    header: "Total requirement",
    align: "right",
    render: (t) => formatNumber(t.total),
    cellClass: (t) => (Number(t.total) ? undefined : "zero"),
  },
  { key: "unit", header: "Unit", render: (t) => t.unit },
];

export function MaterialRequirementsPage() {
  const [scope, setScope] = useScopeParams();
  const req = useMaterialRequirements(scope);

  return (
    <>
      <PageHeader title="Material requirement" subtitle="Total material needed for production (Level 1)." />
      <div className="card filter-panel">
        <div className="filter-section">
          <OrderScope scope={scope} onChange={setScope} />
        </div>
      </div>
      <div className="card">
        <QueryState isPending={req.isPending} error={req.error}>
          {() => (
            <div className={req.isPlaceholderData ? "stale" : undefined} aria-busy={req.isPlaceholderData}>
              <DataGrid columns={columns} rows={req.data!.totals} rowKey={(t) => t.code} />
            </div>
          )}
        </QueryState>
      </div>
    </>
  );
}
