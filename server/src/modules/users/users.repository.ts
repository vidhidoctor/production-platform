// All Prisma queries for users, roles, permissions and departments.
import { prisma } from "../../database/prisma.js";

const publicUser = {
  id: true, name: true, email: true, isActive: true, createdAt: true,
  role: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} as const;

const roleView = {
  include: { permissions: { select: { code: true } }, _count: { select: { users: true } } },
} as const;

export interface UserWrite {
  name?: string;
  email?: string;
  passwordHash?: string;
  roleId?: number | null;
  departmentId?: number | null;
  isActive?: boolean;
}

export const usersRepository = {
  listUsers: () => prisma.user.findMany({ select: publicUser, orderBy: { id: "asc" } }),

  createUser: (data: UserWrite & { name: string; email: string; passwordHash: string }) =>
    prisma.user.create({ data, select: publicUser }),

  updateUser: (id: number, data: UserWrite) => prisma.user.update({ where: { id }, data, select: publicUser }),

  deleteUser: (id: number) => prisma.user.delete({ where: { id } }),

  findRole: (id: number) => prisma.role.findUnique({ where: { id }, include: { permissions: true } }),

  listRoles: () => prisma.role.findMany({ ...roleView, orderBy: { id: "asc" } }),

  createRole: (name: string, codes: string[]) =>
    prisma.role.create({ data: { name, permissions: { connect: codes.map((code) => ({ code })) } }, ...roleView }),

  setRolePermissions: (id: number, codes: string[]) =>
    prisma.role.update({ where: { id }, data: { permissions: { set: codes.map((code) => ({ code })) } }, ...roleView }),

  listPermissions: () =>
    prisma.permission.findMany({ select: { code: true, description: true }, orderBy: { id: "asc" } }),

  findDepartment: (id: number) => prisma.department.findUnique({ where: { id } }),

  listDepartments: () =>
    prisma.department.findMany({ include: { _count: { select: { users: true } } }, orderBy: { id: "asc" } }),

  createDepartment: (name: string) => prisma.department.create({ data: { name } }),
};
