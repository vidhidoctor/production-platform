// All Prisma queries for login, sessions and password resets.
import { prisma } from "../../database/prisma.js";

const userWithAccess = { role: { include: { permissions: true } }, department: true } as const;

export const authRepository = {
  findUserByEmail: (email: string) => prisma.user.findUnique({ where: { email }, include: userWithAccess }),

  createInactiveUser: (data: { name: string; email: string; passwordHash: string }) => prisma.user.create({ data }),

  createSession: (data: { tokenHash: string; userId: number; expiresAt: Date }) => prisma.session.create({ data }),

  findSession: (tokenHash: string) =>
    prisma.session.findUnique({ where: { tokenHash }, include: { user: { include: userWithAccess } } }),

  deleteSession: (tokenHash: string) => prisma.session.deleteMany({ where: { tokenHash } }),

  deleteUserSessions: (userId: number) => prisma.session.deleteMany({ where: { userId } }),

  createPasswordReset: (data: { tokenHash: string; userId: number; expiresAt: Date }) =>
    prisma.passwordReset.create({ data }),

  findPasswordReset: (tokenHash: string) => prisma.passwordReset.findUnique({ where: { tokenHash } }),

  // New password + use up every outstanding reset token + log out every session, atomically.
  applyPasswordReset: (userId: number, passwordHash: string) =>
    prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.passwordReset.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { userId } }),
    ]),
};
