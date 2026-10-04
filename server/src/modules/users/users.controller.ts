import type { Request, Response } from "express";
import { usersService } from "./users.service.js";

const id = (req: Request) => req.params.id as unknown as number; // coerced by idParams

export const usersController = {
  async listUsers(_req: Request, res: Response) {
    res.json(await usersService.listUsers());
  },
  async createUser(req: Request, res: Response) {
    res.status(201).json(await usersService.createUser(req.user!, req.body));
  },
  async updateUser(req: Request, res: Response) {
    res.json(await usersService.updateUser(req.user!, id(req), req.body));
  },
  async deleteUser(req: Request, res: Response) {
    await usersService.deleteUser(req.user!, id(req));
    res.status(204).end();
  },
  async listRoles(_req: Request, res: Response) {
    res.json(await usersService.listRoles());
  },
  async createRole(req: Request, res: Response) {
    res.status(201).json(await usersService.createRole(req.user!, req.body));
  },
  async setRolePermissions(req: Request, res: Response) {
    res.json(await usersService.setRolePermissions(req.user!, id(req), req.body.permissions));
  },
  async listPermissions(_req: Request, res: Response) {
    res.json(await usersService.listPermissions());
  },
  async listDepartments(_req: Request, res: Response) {
    res.json(await usersService.listDepartments());
  },
  async createDepartment(req: Request, res: Response) {
    res.status(201).json(await usersService.createDepartment(req.body.name));
  },
};
