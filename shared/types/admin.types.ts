import type { PermissionCode } from "../constants/roles.js";

/** GET /api/admin/users */
export interface UserDTO {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
}

export interface UserInput {
  name?: string;
  email?: string;
  password?: string;
  roleId?: number | null;
  departmentId?: number | null;
  isActive?: boolean;
}

/** GET /api/admin/roles */
export interface RoleDTO {
  id: number;
  name: string;
  permissions: PermissionCode[];
  /** number of users with this role */
  users: number;
}

/** GET /api/admin/departments */
export interface DepartmentDTO {
  id: number;
  name: string;
  _count: { users: number };
}

/** GET /api/admin/permissions */
export interface PermissionDTO {
  code: PermissionCode;
  description: string;
}
