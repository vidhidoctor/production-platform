// authenticate: who is calling (401 if not logged in).
// requirePermission: may they do this (403 if a permission is missing).
import type { RequestHandler } from "express";
import type { AuthUserDTO, PermissionCode } from "@pp/shared";
import { authService } from "../modules/auth/auth.service.js";
import { asyncHandler } from "./async-handler.js";
import { AppError } from "./error-handler.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUserDTO;
    token?: string;
  }
}

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new AppError(401, "Login required.");
  req.user = await authService.userForToken(token);
  req.token = token;
  next();
});

export const requirePermission =
  (...codes: PermissionCode[]): RequestHandler =>
  (req, _res, next) => {
    const missing = codes.filter((c) => !req.user?.permissions.includes(c));
    if (missing.length) return next(new AppError(403, "You do not have permission for this action.", { missing }));
    next();
  };

/** Login + every listed permission. Usage: router.get(path, ...guard("PRODUCTION_VIEW"), handler) */
export const guard = (...codes: PermissionCode[]): RequestHandler[] => [authenticate, requirePermission(...codes)];
