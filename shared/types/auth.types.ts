import type { PermissionCode } from "../constants/roles.js";

/** The logged-in user (GET /api/auth/me, and `user` in the login response). */
export interface AuthUserDTO {
  id: number;
  name: string;
  email: string;
  role: string | null;
  department: string | null;
  permissions: PermissionCode[];
}

export interface LoginResponseDTO {
  token: string;
  expiresAt: string;
  user: AuthUserDTO;
}
