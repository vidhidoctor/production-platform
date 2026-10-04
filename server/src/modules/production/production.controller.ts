import type { Request, Response } from "express";
import { productionService } from "./production.service.js";

const id = (req: Request) => req.params.id as unknown as number; // coerced by idParams

export const productionController = {
  async catalog(_req: Request, res: Response) {
    res.json(await productionService.catalog());
  },
  async searchDesigns(req: Request, res: Response) {
    res.json(await productionService.searchDesigns(req.query.q as string));
  },
  async getDesign(req: Request, res: Response) {
    res.json(await productionService.getDesign(req.params.designNo));
  },
  async list(_req: Request, res: Response) {
    res.json(await productionService.list());
  },
  async get(req: Request, res: Response) {
    res.json(await productionService.get(id(req)));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await productionService.create(req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await productionService.update(id(req), req.body));
  },
  async setStatus(req: Request, res: Response) {
    res.json(await productionService.setStatus(id(req), req.body.status));
  },
  async summary(req: Request, res: Response) {
    res.json(await productionService.summary(id(req)));
  },
};
