import type { MaterialDTO, MaterialInput } from "@pp/shared";
import { api } from "../../api/client";

export const materialsApi = {
  master: () => api.get<MaterialDTO[]>("/material/master"),
  create: (body: MaterialInput) => api.post<MaterialDTO>("/material/master", body),
  // The code cannot change after creation.
  update: (id: number, { code: _code, ...body }: MaterialInput) => api.put<MaterialDTO>(`/material/master/${id}`, body),
  remove: (id: number) => api.delete(`/material/master/${id}`),
};
