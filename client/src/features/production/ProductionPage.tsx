import { Link, useNavigate } from "react-router";
import type { ProductionOrderDTO } from "@pp/shared";
import { formatDate, formatNumber } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { PageHeader, QueryState } from "../../components/ui";
import { useOrders } from "./production.hooks";
import { StatusBadge } from "./components/StatusBadge";

const pieces = (o: ProductionOrderDTO) => o.lines.reduce((s, l) => s + l.quantity, 0);

const columns: Column<ProductionOrderDTO>[] = [
  { key: "id", header: "#", render: (o) => <span className="muted">{o.id}</span> },
  { key: "designNo", header: "Design No.", render: (o) => <strong>{o.designNo}</strong> },
  { key: "item", header: "Item", render: (o) => o.item },
  { key: "party", header: "Party", render: (o) => o.party },
  { key: "orderDate", header: "Order date", render: (o) => formatDate(o.orderDate) },
  {
    key: "quantity",
    header: "Order Quantity",
    align: "right",
    render: (o) => (o.quantity === null ? <span className="muted">Per row</span> : formatNumber(o.quantity)),
  },
  { key: "pieces", header: "Total pieces", align: "right", render: (o) => formatNumber(pieces(o)) },
  { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
];

export function ProductionPage() {
  const orders = useOrders();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="All production orders"
        subtitle="Open an order to see its material calculation. New orders start from a design."
        actions={
          <Link className="btn btn-primary" to="/production">
            Search design
          </Link>
        }
      />
      <QueryState isPending={orders.isPending} error={orders.error}>
        {() => (
          <div className="card">
            <DataGrid
              columns={columns}
              rows={orders.data!}
              rowKey={(o) => o.id}
              onRowClick={(o) => navigate(`/production/orders/${o.id}`)}
              empty="No production orders yet."
            />
          </div>
        )}
      </QueryState>
    </>
  );
}
