import type {
  DesignDetailDTO,
  MaterialSummaryDTO,
  ProductionOrderDTO,
  PurchaseRequirementDTO,
  ReportRowDTO,
} from "@pp/shared";
import { api, downloadFile } from "../../api/client";

export type ReportKind = "production" | "material" | "purchase";

/** Which orders / components a requirement is calculated for. */
export interface Scope {
  orderId?: number;
  components: string[];
}

function scopeQuery({ orderId, components }: Scope) {
  const q = new URLSearchParams();
  if (orderId) q.set("orderId", String(orderId));
  if (components.length) q.set("components", components.join(","));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const reportsApi = {
  materialRequirements: (scope: Scope) => api.get<MaterialSummaryDTO>(`/material/requirements${scopeQuery(scope)}`),
  purchaseRequirements: (scope: Scope) => api.get<PurchaseRequirementDTO>(`/purchase/requirements${scopeQuery(scope)}`),
  report: (kind: ReportKind) => api.get<ReportRowDTO[]>(`/reports/${kind}`),
  downloadCsv: (kind: ReportKind) => downloadFile(`/reports/${kind}?format=csv`, `${kind}-report.csv`),
  // For the order search and punched details. (Features don't import each other, so these do
  // not reuse production.api.)
  orders: () => api.get<ProductionOrderDTO[]>("/production/orders"),
  design: (designNo: string) => api.get<DesignDetailDTO>(`/production/designs/${encodeURIComponent(designNo)}`),
};
