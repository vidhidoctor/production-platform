import type { Request, Response } from "express";
import { materialsService } from "./materials.service.js";

const id = (req: Request) => req.params.id as unknown as number; // coerced by idParams

export const materialsController = {
  async listMaster(_req: Request, res: Response) {
    res.json(await materialsService.listMaster());
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await materialsService.create(req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await materialsService.update(id(req), req.body));
  },
  async remove(req: Request, res: Response) {
    await materialsService.remove(id(req));
    res.status(204).end();
  },
};
