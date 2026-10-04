// Express app: JSON, CORS, routes, error handling. server.ts only calls listen().
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { routes } from "./routes.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
