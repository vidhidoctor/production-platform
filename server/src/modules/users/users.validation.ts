import { z } from "zod";
import { PERMISSIONS, type PermissionCode } from "@pp/shared";
import { requiredText, email, password, positiveId } from "../../middleware/validate.js";

const isActive = z.boolean({ error: "isActive must be true or false." }).optional();
const optionalId = (field: string) => positiveId(field).nullable().optional();

export const createUserSchema = z.object({
  name: requiredText("name"),
  email,
  password,
  roleId: optionalId("roleId"),
  departmentId: optionalId("departmentId"),
  isActive,
});

export const updateUserSchema = z.object({
  name: requiredText("name").optional(),
  password: password.optional(),
  roleId: optionalId("roleId"),
  departmentId: optionalId("departmentId"),
  isActive,
});

const permissionCodes = z
  .array(z.string(), { error: "permissions must be a list of permission codes." })
  .superRefine((codes, ctx) => {
    const unknown = codes.filter((c) => !(c in PERMISSIONS));
    if (unknown.length) ctx.addIssue({ code: "custom", message: `Unknown permission codes: ${unknown.join(", ")}` });
  })
  .transform((codes) => [...new Set(codes)] as PermissionCode[]);

export const createRoleSchema = z.object({ name: requiredText("name"), permissions: permissionCodes.default([]) });

export const setRolePermissionsSchema = z.object({ permissions: permissionCodes });

export const createDepartmentSchema = z.object({ name: requiredText("name") });
