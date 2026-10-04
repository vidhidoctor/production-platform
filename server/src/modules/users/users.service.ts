// User, role, permission and department management (Admin).
import type { AuthUserDTO, PermissionCode, UserInput } from "@pp/shared";
import { AppError } from "../../middleware/error-handler.js";
import { hashPassword } from "../auth/auth.crypto.js";
import { authService } from "../auth/auth.service.js";
import { usersRepository as repo, type UserWrite } from "./users.repository.js";

type Actor = AuthUserDTO;

// A user may only hand out access they have themselves (blocks privilege escalation).
function assertCanGrant(actor: Actor, codes: string[]) {
  const beyond = codes.filter((c) => !actor.permissions.includes(c as PermissionCode));
  if (beyond.length) throw new AppError(403, "You cannot grant permissions you do not have.", { beyond });
}

async function checkRoleAndDepartment(actor: Actor, input: UserInput) {
  if (input.roleId) {
    const role = await repo.findRole(input.roleId);
    if (!role) throw new AppError(400, "roleId does not exist.");
    assertCanGrant(actor, role.permissions.map((p) => p.code));
  }
  if (input.departmentId && !(await repo.findDepartment(input.departmentId))) {
    throw new AppError(400, "departmentId does not exist.");
  }
}

async function toWrite({ password, ...rest }: UserInput): Promise<UserWrite> {
  return { ...rest, ...(password ? { passwordHash: await hashPassword(password) } : {}) };
}

const shapeRole = (r: { id: number; name: string; permissions: { code: string }[]; _count: { users: number } }) => ({
  id: r.id,
  name: r.name,
  permissions: r.permissions.map((p) => p.code),
  users: r._count.users,
});

export const usersService = {
  listUsers: () => repo.listUsers(),

  // Admin-created users are active immediately unless isActive: false is sent.
  async createUser(actor: Actor, input: UserInput & { name: string; email: string; password: string }) {
    await checkRoleAndDepartment(actor, input);
    const data = await toWrite({ isActive: true, ...input });
    return repo.createUser(data as UserWrite & { name: string; email: string; passwordHash: string });
  },

  // Edit name, assign role / department, activate / deactivate, or set a new password.
  async updateUser(actor: Actor, id: number, input: UserInput) {
    if (id === actor.id && (input.isActive === false || input.roleId !== undefined)) {
      throw new AppError(400, "You cannot deactivate yourself or change your own role.");
    }
    await checkRoleAndDepartment(actor, input);
    const user = await repo.updateUser(id, await toWrite(input));
    // Deactivation or a password change ends the user's existing logins.
    if (input.isActive === false || input.password) await authService.endAllSessions(id);
    return user;
  },

  async deleteUser(actor: Actor, id: number) {
    if (id === actor.id) throw new AppError(400, "You cannot delete yourself.");
    await repo.deleteUser(id);
  },

  listRoles: async () => (await repo.listRoles()).map(shapeRole),

  async createRole(actor: Actor, input: { name: string; permissions: PermissionCode[] }) {
    assertCanGrant(actor, input.permissions);
    return shapeRole(await repo.createRole(input.name, input.permissions));
  },

  // Replaces the role's permission list.
  async setRolePermissions(actor: Actor, id: number, codes: PermissionCode[]) {
    assertCanGrant(actor, codes);
    const role = await repo.findRole(id);
    if (!role) throw new AppError(404, "Role not found.");
    if (role.name === actor.role && !codes.includes("PERMISSION_MANAGE")) {
      throw new AppError(400, "You cannot remove PERMISSION_MANAGE from your own role.");
    }
    return shapeRole(await repo.setRolePermissions(id, codes));
  },

  listPermissions: () => repo.listPermissions(),
  listDepartments: () => repo.listDepartments(),
  createDepartment: (name: string) => repo.createDepartment(name),
};
