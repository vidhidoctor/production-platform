import type { DepartmentDTO, PermissionCode, RoleDTO, UserDTO, UserInput } from "@pp/shared";
import { api } from "../../api/client";

export const usersApi = {
  list: () => api.get<UserDTO[]>("/admin/users"),
  create: (body: UserInput) => api.post<UserDTO>("/admin/users", body),
  update: (id: number, body: UserInput) => api.patch<UserDTO>(`/admin/users/${id}`, body),
  remove: (id: number) => api.delete(`/admin/users/${id}`),

  roles: () => api.get<RoleDTO[]>("/admin/roles"),
  createRole: (name: string) => api.post<RoleDTO>("/admin/roles", { name, permissions: [] }),
  setRolePermissions: (id: number, permissions: PermissionCode[]) =>
    api.put<RoleDTO>(`/admin/roles/${id}/permissions`, { permissions }),

  departments: () => api.get<DepartmentDTO[]>("/admin/departments"),
  createDepartment: (name: string) => api.post<DepartmentDTO>("/admin/departments", { name }),
};
