import { ORDER_STATUS_LABELS, type OrderStatus } from "@pp/shared";

const TONE: Record<OrderStatus, string> = {
  PENDING: "badge-warning",
  IN_PROGRESS: "badge-primary",
  COMPLETED: "badge-success",
  CANCELLED: "",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${TONE[status]}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
