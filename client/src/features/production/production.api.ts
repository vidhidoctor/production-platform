import type {
  CatalogItemDTO,
  CreateOrderInput,
  DesignDetailDTO,
  DesignSummaryDTO,
  OrderStatus,
  ProductionOrderDTO,
  ProductionSummaryDTO,
  UpdateOrderInput,
} from "@pp/shared";
import { api } from "../../api/client";

export const productionApi = {
  searchDesigns: (q: string) => api.get<DesignSummaryDTO[]>(`/production/designs?q=${encodeURIComponent(q)}`),
  design: (designNo: string) => api.get<DesignDetailDTO>(`/production/designs/${encodeURIComponent(designNo)}`),
  catalog: () => api.get<CatalogItemDTO[]>("/production/catalog"),
  list: () => api.get<ProductionOrderDTO[]>("/production/orders"),
  get: (id: number) => api.get<ProductionOrderDTO>(`/production/orders/${id}`),
  summary: (id: number) => api.get<ProductionSummaryDTO>(`/production/orders/${id}/summary`),
  create: (body: CreateOrderInput) => api.post<ProductionOrderDTO>("/production/orders", body),
  update: (id: number, body: UpdateOrderInput) => api.put<ProductionOrderDTO>(`/production/orders/${id}`, body),
  setStatus: (id: number, status: OrderStatus) => api.patch<ProductionOrderDTO>(`/production/orders/${id}/status`, { status }),
};
