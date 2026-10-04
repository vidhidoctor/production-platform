import type { Request, Response } from "express";
import { reportsService, type ReportRow } from "./reports.service.js";

// Parsed by requirementsQuery
const orderId = (req: Request) => req.query.orderId as unknown as number | undefined;
const components = (req: Request) => req.query.components as unknown as string[];

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function sendReport(req: Request, res: Response, filename: string, rows: ReportRow[]) {
  if (req.query.format !== "csv") return res.json(rows);
  const cols = rows.length ? Object.keys(rows[0]) : [];
  const csv = [cols, ...rows.map((r) => cols.map((c) => r[c]))].map((r) => r.map(csvCell).join(",")).join("\n");
  res.type("text/csv").attachment(`${filename}.csv`).send(csv);
}

export const reportsController = {
  async materialRequirements(req: Request, res: Response) {
    res.json(await reportsService.materialRequirements(orderId(req), components(req)));
  },
  async purchaseRequirements(req: Request, res: Response) {
    res.json(await reportsService.purchaseRequirements(orderId(req), components(req)));
  },
  async production(req: Request, res: Response) {
    sendReport(req, res, "production-report", await reportsService.productionReport());
  },
  async material(req: Request, res: Response) {
    sendReport(req, res, "material-report", await reportsService.materialReport());
  },
  async purchase(req: Request, res: Response) {
    sendReport(req, res, "purchase-report", await reportsService.purchaseReport());
  },
};
