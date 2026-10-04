import { Router } from "express";
import { asyncHandler as ah } from "../../middleware/async-handler.js";
import { validate, idParams } from "../../middleware/validate.js";
import { guard } from "../../middleware/auth.js";
import { materialsController as c } from "./materials.controller.js";
import { createMaterialSchema, updateMaterialSchema } from "./materials.validation.js";

export const materialsRoutes = Router();

materialsRoutes.get("/material/master", ...guard("MATERIAL_MASTER_VIEW"), ah(c.listMaster));
materialsRoutes.post("/material/master", ...guard("MATERIAL_MASTER_MANAGE"), validate({ body: createMaterialSchema }), ah(c.create));
materialsRoutes.put(
  "/material/master/:id",
  ...guard("MATERIAL_MASTER_MANAGE"),
  validate({ params: idParams, body: updateMaterialSchema }),
  ah(c.update),
);
materialsRoutes.delete("/material/master/:id", ...guard("MATERIAL_MASTER_MANAGE"), validate({ params: idParams }), ah(c.remove));
