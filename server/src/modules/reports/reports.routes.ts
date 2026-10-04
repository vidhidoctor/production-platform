import { Router } from "express";
import { asyncHandler as ah } from "../../middleware/async-handler.js";
import { validate } from "../../middleware/validate.js";
import { guard } from "../../middleware/auth.js";
import { reportsController as c } from "./reports.controller.js";
import { requirementsQuery, reportQuery } from "./reports.validation.js";

export const reportsRoutes = Router();

reportsRoutes.get(
  "/material/requirements",
  ...guard("MATERIAL_REQUIREMENT_VIEW"),
  validate({ query: requirementsQuery }),
  ah(c.materialRequirements),
);
reportsRoutes.get(
  "/purchase/requirements",
  ...guard("PURCHASE_REQUIREMENT_VIEW"),
  validate({ query: requirementsQuery }),
  ah(c.purchaseRequirements),
);

reportsRoutes.get("/reports/production", ...guard("PRODUCTION_REPORT_VIEW"), validate({ query: reportQuery }), ah(c.production));
reportsRoutes.get("/reports/material", ...guard("MATERIAL_REPORT_VIEW"), validate({ query: reportQuery }), ah(c.material));
reportsRoutes.get("/reports/purchase", ...guard("PURCHASE_REPORT_VIEW"), validate({ query: reportQuery }), ah(c.purchase));
