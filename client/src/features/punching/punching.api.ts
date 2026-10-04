import type { ComponentRowInput, PunchingDesignDTO, PunchingDesignSummaryDTO } from "@pp/shared";
import { api } from "../../api/client";

const d = (designNo: string) => `/punching/designs/${encodeURIComponent(designNo)}`;

export const punchingApi = {
  designs: () => api.get<PunchingDesignSummaryDTO[]>("/punching/designs"),
  design: (designNo: string) => api.get<PunchingDesignDTO>(d(designNo)),
  createDesign: (body: { designNo: string; productName: string }) => api.post<PunchingDesignDTO>("/punching/designs", body),
  updateDesign: (designNo: string, productName: string) => api.put<PunchingDesignDTO>(d(designNo), { productName }),
  saveComponent: (designNo: string, component: string, rows: ComponentRowInput[]) =>
    api.put<PunchingDesignDTO>(`${d(designNo)}/components/${encodeURIComponent(component)}`, { rows }),
  deleteComponent: (designNo: string, component: string) =>
    api.delete<PunchingDesignDTO>(`${d(designNo)}/components/${encodeURIComponent(component)}`),
};
