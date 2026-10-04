// Mounts every module under /api. Each module's routes file holds its full paths and permissions.
import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { materialsRoutes } from "./modules/materials/materials.routes.js";
import { punchingRoutes } from "./modules/punching/punching.routes.js";
import { productionRoutes } from "./modules/production/production.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";

export const routes = Router();

routes.use(authRoutes); //       /auth/*                       (public except logout, me)
routes.use(usersRoutes); //      /admin/*                      users, roles, permissions, departments
routes.use(materialsRoutes); //  /material/master
routes.use(punchingRoutes); //   /punching/master
routes.use(productionRoutes); // /production/orders
routes.use(reportsRoutes); //    /material/requirements, /purchase/requirements, /reports/*
