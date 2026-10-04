import { Router } from "express";
import { asyncHandler as ah } from "../../middleware/async-handler.js";
import { validate, idParams } from "../../middleware/validate.js";
import { guard } from "../../middleware/auth.js";
import { punchingController as c } from "./punching.controller.js";
import {
  createPunchingSchema, updatePunchingSchema, createDesignSchema, updateDesignSchema,
  designParams, componentParams, componentSchema,
} from "./punching.validation.js";

export const punchingRoutes = Router();

// Designs are the parent record; components (with their sizes) are added under a design.
punchingRoutes.get("/punching/designs", ...guard("PUNCHING_VIEW"), ah(c.listDesigns));
punchingRoutes.post("/punching/designs", ...guard("PUNCHING_CREATE"), validate({ body: createDesignSchema }), ah(c.createDesign));
punchingRoutes.get("/punching/designs/:designNo", ...guard("PUNCHING_VIEW"), validate({ params: designParams }), ah(c.getDesign));
punchingRoutes.put(
  "/punching/designs/:designNo",
  ...guard("PUNCHING_UPDATE"),
  validate({ params: designParams, body: updateDesignSchema }),
  ah(c.updateDesign),
);
// Adds a component or replaces its sizes, so it needs both create and update.
punchingRoutes.put(
  "/punching/designs/:designNo/components/:component",
  ...guard("PUNCHING_CREATE", "PUNCHING_UPDATE"),
  validate({ params: componentParams, body: componentSchema }),
  ah(c.saveComponent),
);
punchingRoutes.delete(
  "/punching/designs/:designNo/components/:component",
  ...guard("PUNCHING_UPDATE"),
  validate({ params: componentParams }),
  ah(c.deleteComponent),
);

// Flat list of every row, and single-row create / update.
punchingRoutes.get("/punching/master", ...guard("PUNCHING_VIEW"), ah(c.getMaster));
punchingRoutes.post("/punching/master", ...guard("PUNCHING_CREATE"), validate({ body: createPunchingSchema }), ah(c.create));
punchingRoutes.put(
  "/punching/master/:id",
  ...guard("PUNCHING_UPDATE"),
  validate({ params: idParams, body: updatePunchingSchema }),
  ah(c.update),
);
