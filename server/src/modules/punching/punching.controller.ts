import type { Request, Response } from "express";
import { punchingService } from "./punching.service.js";

export const punchingController = {
  async listDesigns(_req: Request, res: Response) {
    res.json(await punchingService.listDesigns());
  },
  async getDesign(req: Request, res: Response) {
    res.json(await punchingService.getDesignOrFail(req.params.designNo));
  },
  async createDesign(req: Request, res: Response) {
    res.status(201).json(await punchingService.createDesign(req.body.designNo, req.body.productName));
  },
  async updateDesign(req: Request, res: Response) {
    res.json(await punchingService.updateDesign(req.params.designNo, req.body.productName));
  },
  async saveComponent(req: Request, res: Response) {
    res.json(await punchingService.saveComponent(req.params.designNo, req.params.component, req.body.rows));
  },
  async deleteComponent(req: Request, res: Response) {
    res.json(await punchingService.deleteComponent(req.params.designNo, req.params.component));
  },
  async getMaster(_req: Request, res: Response) {
    res.json(await punchingService.getMaster());
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await punchingService.create(req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await punchingService.update(req.params.id as unknown as number, req.body));
  },
};
