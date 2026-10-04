import { Link, useParams } from "react-router";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type LineRequirementDTO, type OrderStatus } from "@pp/shared";
import { useAuth } from "../../lib/auth";
import { formatDate, formatNumber } from "../../lib/format";
import { DataGrid, type Column } from "../../components/DataGrid";
import { ErrorAlert, PageHeader, QueryState } from "../../components/ui";
import { useOrderSummary, useSetOrderStatus } from "./production.hooks";
import { StatusBadge } from "./components/StatusBadge";

export function OrderDetailPage() {
  const id = Number(useParams().id);
  const { can } = useAuth();
  const summary = useOrderSummary(id);
  const setStatus = useSetOrderStatus();

  const lines = summary.data?.lines ?? [];
  const codes = lines.length ? Object.keys(lines[0].requirement) : [];
  const used = codes.filter((c) => lines.some((l) => Number(l.requirement[c]) !== 0));
  const colTotal = (code: string) => lines.reduce((s, l) => s + Number(l.requirement[code]), 0);

  const columns: Column<LineRequirementDTO>[] = [
    { key: "component", header: "Component", render: (l) => <strong>{l.component}</strong>, sticky: true, footer: "Total" },
    { key: "size", header: "Size", render: (l) => l.size },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      render: (l) => formatNumber(l.quantity),
      footer: formatNumber(lines.reduce((s, l) => s + l.quantity, 0)),
    },
    ...used.map(
      (code): Column<LineRequirementDTO> => ({
        key: code,
        header: code,
        align: "right",
        render: (l) => (Number(l.requirement[code]) ? formatNumber(l.requirement[code]) : "·"),
        cellClass: (l) => (Number(l.requirement[code]) ? undefined : "zero"),
        footer: formatNumber(colTotal(code)),
      }),
    ),
  ];

  const o = summary.data?.order;
  return (
    <>
      <PageHeader
        title={o ? `Order #${id} · ${o.party}` : "Order"}
        subtitle={
          o ? (
            <>
              <Link to={`/production/designs/${encodeURIComponent(o.designNo)}`}>Design {o.designNo}</Link> · {o.item} ·{" "}
              {formatDate(o.orderDate)}
              {o.quantity !== null ? <> · Order Quantity {formatNumber(o.quantity)}</> : <> · Quantity per row</>}
            </>
          ) : (
            <Link to="/production/orders">← Orders</Link>
          )
        }
        actions={
          <>
            {can("MATERIAL_REQUIREMENT_VIEW") && (
              <Link className="btn" to={`/materials/requirements?orderId=${id}`}>
                Material requirement
              </Link>
            )}
            {can("PURCHASE_REQUIREMENT_VIEW") && (
              <Link className="btn" to={`/materials/purchase?orderId=${id}`}>
                Purchase requirement
              </Link>
            )}
            {can("PRODUCTION_UPDATE") && (
              <Link className="btn" to={`/production/orders/${id}/edit`}>
                Edit order
              </Link>
            )}
          </>
        }
      />
      <QueryState isPending={summary.isPending} error={summary.error}>
        {() => (
          <>
            <div className="card">
              <div className="card-body row">
                <span className="muted">Status</span>
                {can("PRODUCTION_UPDATE") ? (
                  <select
                    className="input"
                    style={{ width: 180 }}
                    aria-label="Order status"
                    value={o!.status}
                    disabled={setStatus.isPending}
                    onChange={(e) => setStatus.mutate({ id, status: e.target.value as OrderStatus })}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={o!.status} />
                )}
                {o!.status === "CANCELLED" && <span className="muted">Not counted in the combined material / purchase requirement.</span>}
              </div>
            </div>
            <ErrorAlert error={setStatus.error} />
            {summary.data!.errors.map((e) => (
              <div key={e} className="alert alert-warning">
                {e}
              </div>
            ))}
            <div className="card">
              <div className="card-header">
                <h2>Requirement per row</h2>
                <span className="muted">consumption × quantity (PCS; CORD in MTR)</span>
              </div>
              <DataGrid columns={columns} rows={lines} rowKey={(l) => `${l.component}|${l.size}`} maxHeight="calc(100vh - 340px)" />
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}
