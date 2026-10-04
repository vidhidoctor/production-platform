import { Router } from "express";
import { asyncHandler as ah } from "../../middleware/async-handler.js";
import { validate, idParams } from "../../middleware/validate.js";
import { guard } from "../../middleware/auth.js";
import { usersController as c } from "./users.controller.js";
import {
  createUserSchema, updateUserSchema, createRoleSchema, setRolePermissionsSchema, createDepartmentSchema,
} from "./users.validation.js";

export const usersRoutes = Router();

usersRoutes.get("/admin/users", ...guard("USER_VIEW"), ah(c.listUsers));
usersRoutes.post("/admin/users", ...guard("USER_CREATE"), validate({ body: createUserSchema }), ah(c.createUser));
usersRoutes.patch("/admin/users/:id", ...guard("USER_UPDATE"), validate({ params: idParams, body: updateUserSchema }), ah(c.updateUser));
usersRoutes.delete("/admin/users/:id", ...guard("USER_DELETE"), validate({ params: idParams }), ah(c.deleteUser));

// Listed under USER_VIEW because assigning a role needs the list of roles.
usersRoutes.get("/admin/roles", ...guard("USER_VIEW"), ah(c.listRoles));
usersRoutes.post("/admin/roles", ...guard("ROLE_MANAGE"), validate({ body: createRoleSchema }), ah(c.createRole));
usersRoutes.put(
  "/admin/roles/:id/permissions",
  ...guard("PERMISSION_MANAGE"),
  validate({ params: idParams, body: setRolePermissionsSchema }),
  ah(c.setRolePermissions),
);
usersRoutes.get("/admin/permissions", ...guard("PERMISSION_MANAGE"), ah(c.listPermissions));

usersRoutes.get("/admin/departments", ...guard("USER_VIEW"), ah(c.listDepartments));
usersRoutes.post("/admin/departments", ...guard("DEPARTMENT_MANAGE"), validate({ body: createDepartmentSchema }), ah(c.createDepartment));
