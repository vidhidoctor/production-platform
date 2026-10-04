// Sign up, login, logout, sessions, forgot / reset password.
import type { AuthUserDTO, LoginResponseDTO, PermissionCode } from "@pp/shared";
import { env } from "../../config/env.js";
import { AppError } from "../../middleware/error-handler.js";
import { authRepository } from "./auth.repository.js";
import { hashPassword, verifyPassword, newToken, sha256, SESSION_HOURS, RESET_MINUTES } from "./auth.crypto.js";

type UserWithAccess = {
  id: number;
  name: string;
  email: string;
  role: { name: string; permissions: { code: string }[] } | null;
  department: { name: string } | null;
};

function toAuthUser(u: UserWithAccess): AuthUserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role?.name ?? null,
    department: u.department?.name ?? null,
    permissions: (u.role?.permissions.map((p) => p.code) ?? []) as PermissionCode[],
  };
}

export const authService = {
  // New accounts are inactive with no role until Admin assigns department + role and activates them.
  async signup(input: { name: string; email: string; password: string }) {
    const user = await authRepository.createInactiveUser({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    });
    return {
      id: user.id,
      message: "Account created. An Admin must assign your department and role and activate the account before you can log in.",
    };
  },

  async login(input: { email: string; password: string }): Promise<LoginResponseDTO> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new AppError(401, "Invalid email or password.");
    }
    if (!user.isActive) throw new AppError(403, "Account is waiting for Admin activation.");

    const token = newToken();
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
    await authRepository.createSession({ tokenHash: sha256(token), userId: user.id, expiresAt });
    return { token, expiresAt: expiresAt.toISOString(), user: toAuthUser(user) };
  },

  async logout(token: string) {
    await authRepository.deleteSession(sha256(token));
  },

  // Used by the authenticate middleware on every request. User, role and permissions are
  // loaded fresh each time, so deactivation or permission changes take effect immediately.
  async userForToken(token: string): Promise<AuthUserDTO> {
    const session = await authRepository.findSession(sha256(token));
    if (!session || session.expiresAt < new Date()) throw new AppError(401, "Session expired. Please log in again.");
    if (!session.user.isActive) throw new AppError(403, "Account is not active.");
    return toAuthUser(session.user);
  },

  async endAllSessions(userId: number) {
    await authRepository.deleteUserSessions(userId);
  },

  // Answers the same way whether or not the email exists, so it cannot be used to discover accounts.
  async forgotPassword(email: string) {
    const result: { message: string; devResetToken?: string } = {
      message: "If that email is registered, a password reset link has been sent.",
    };
    const user = await authRepository.findUserByEmail(email);
    if (!user) return result;

    const token = newToken();
    await authRepository.createPasswordReset({
      tokenHash: sha256(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000),
    });
    // No email service yet: the token is logged, and returned outside production so it can be tested.
    console.log(`[password reset] ${email}: token ${token} (valid ${RESET_MINUTES} min)`);
    if (env.NODE_ENV !== "production") result.devResetToken = token;
    return result;
  },

  async resetPassword(input: { token: string; password: string }) {
    const reset = await authRepository.findPasswordReset(sha256(input.token));
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new AppError(400, "Reset link is invalid or has expired.");
    }
    await authRepository.applyPasswordReset(reset.userId, await hashPassword(input.password));
    return { message: "Password updated. Please log in." };
  },
};
