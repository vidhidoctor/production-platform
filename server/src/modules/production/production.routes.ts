import { Router } from "express";
import { asyncHandler as ah } from "../../middleware/async-handler.js";
import { validate, idParams } from "../../middleware/validate.js";
import { guard } from "../../middleware/auth.js";
import { productionController as c } from "./production.controller.js";
import {
  createOrderSchema, updateOrderSchema, statusSchema, designParams, designSearchQuery,
} from "./production.validation.js";

export const productionRoutes = Router();

// Design search: what Punching entered for a design + its order history.
// (Production cannot open the full Punching Master; this shows one design's entries.)
productionRoutes.get("/production/designs", ...guard("PRODUCTION_VIEW"), validate({ query: designSearchQuery }), ah(c.searchDesigns));
productionRoutes.get("/production/designs/:designNo", ...guard("PRODUCTION_VIEW"), validate({ params: designParams }), ah(c.getDesign));

// Design + Component + Size choices for the order edit form.
productionRoutes.get("/production/catalog", ...guard("PRODUCTION_VIEW"), ah(c.catalog));

productionRoutes.get("/production/orders", ...guard("PRODUCTION_VIEW"), ah(c.list));
productionRoutes.get("/production/orders/:id", ...guard("PRODUCTION_VIEW"), validate({ params: idParams }), ah(c.get));
productionRoutes.post("/production/orders", ...guard("PRODUCTION_CREATE"), validate({ body: createOrderSchema }), ah(c.create));
productionRoutes.put(
  "/production/orders/:id",
  ...guard("PRODUCTION_UPDATE"),
  validate({ params: idParams, body: updateOrderSchema }),
  ah(c.update),
);
productionRoutes.patch(
  "/production/orders/:id/status",
  ...guard("PRODUCTION_UPDATE"),
  validate({ params: idParams, body: statusSchema }),
  ah(c.setStatus),
);
productionRoutes.get("/production/orders/:id/summary", ...guard("PRODUCTION_VIEW"), validate({ params: idParams }), ah(c.summary));
