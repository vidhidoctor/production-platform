import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { DesignOrderDTO, PunchingItemDTO } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { formatDate, formatNumber } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { PageHeader, QueryState } from "../../components/ui";
import { useDesign } from "./production.hooks";
import { StatusBadge } from "./components/StatusBadge";
import { NewOrderDialog } from "./components/NewOrderDialog";

const optional = (v: number | null) => (v === null ? <span className="muted">—</span> : formatNumber(v));

/** One design: what Punching entered, the orders already made for it, and "Create New Order". */
export function DesignPage() {
  const designNo = useParams().designNo!;
  const { can } = useAuth();
  const navigate = useNavigate();
  const design = useDesign(designNo);
  const [creating, setCreating] = useState(false);
  const d = design.data;

  const orderColumns: Column<DesignOrderDTO>[] = [
    { key: "designNo", header: "Design No.", render: () => d!.designNo },
    { key: "party", header: "Party", render: (o) => <strong>{o.party}</strong> },
    {
      key: "quantity",
      header: "Order Quantity",
      align: "right",
      render: (o) => (o.quantity === null ? <span className="muted">Per row</span> : formatNumber(o.quantity)),
    },
    { key: "pieces", header: "Total pieces", align: "right", render: (o) => formatNumber(o.totalPieces) },
    { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
    { key: "date", header: "Order date", render: (o) => formatDate(o.orderDate) },
  ];

  // Only the material columns this design actually uses.
  const used = d?.materials.filter((m) => d.items.some((i) => i.consumption[m.code])) ?? [];
  const itemColumns: Column<PunchingItemDTO>[] = [
    { key: "component", header: "Component", render: (i) => <strong>{i.component}</strong>, sticky: true },
    { key: "size", header: "Size", render: (i) => i.size },
    { key: "stitch", header: "Stitch", align: "right", render: (i) => optional(i.stitch) },
    { key: "laser", header: "Laser", align: "right", render: (i) => optional(i.laser) },
    ...used.map(
      (m): Column<PunchingItemDTO> => ({
        key: m.code,
        header: (
          <>
            {m.name}
            <br />
            <span className="muted">{m.unit} / pc</span>
          </>
        ),
        align: "right",
        render: (i) => (i.consumption[m.code] ? formatNumber(i.consumption[m.code], 3) : "·"),
        cellClass: (i) => (i.consumption[m.code] ? undefined : "zero"),
      }),
    ),
  ];

  return (
    <>
      <PageHeader
        title={d ? `Design ${d.designNo}` : `Design ${designNo}`}
        subtitle={d ? d.productName : <Link to="/production">← Design search</Link>}
        actions={
          <>
            <Link className="btn" to="/production">
              ← Search
            </Link>
            {can("PRODUCTION_CREATE") && d && (
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                + Create New Order
              </button>
            )}
          </>
        }
      />
      <QueryState isPending={design.isPending} error={design.error}>
        {() => (
          <>
            <div className="card">
              <div className="card-header">
                <h2>Previous orders</h2>
                <span className="muted">{d!.orders.length} order(s) for this design</span>
              </div>
              <DataGrid
                columns={orderColumns}
                rows={d!.orders}
                rowKey={(o) => o.id}
                onRowClick={(o) => navigate(`/production/orders/${o.id}`)}
                empty="No orders yet for this design."
              />
            </div>
            <div className="card">
              <div className="card-header">
                <h2>Punching details</h2>
                <span className="muted">{d!.items.length} Component + Size rows · consumption per piece</span>
              </div>
              <DataGrid columns={itemColumns} rows={d!.items} rowKey={(i) => i.id} maxHeight="60vh" />
            </div>
          </>
        )}
      </QueryState>
      {creating && d && <NewOrderDialog design={d} onClose={() => setCreating(false)} />}
    </>
  );
}
