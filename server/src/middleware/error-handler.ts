// AppError + the global error handler. Services throw AppError; this turns it into JSON.
import type { ErrorRequestHandler, RequestHandler } from "express";

export class AppError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  }
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Request body is not valid JSON." });
  // Prisma: unique constraint / record not found
  if (err?.code === "P2002") return res.status(409).json({ error: "A record with this value already exists." });
  if (err?.code === "P2025") return res.status(404).json({ error: "Record not found." });
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
