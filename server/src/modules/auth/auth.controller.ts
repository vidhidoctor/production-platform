import type { Request, Response } from "express";
import { authService } from "./auth.service.js";

export const authController = {
  async signup(req: Request, res: Response) {
    res.status(201).json(await authService.signup(req.body));
  },
  async login(req: Request, res: Response) {
    res.json(await authService.login(req.body));
  },
  async logout(req: Request, res: Response) {
    await authService.logout(req.token!);
    res.json({ message: "Logged out." });
  },
  // What the frontend needs to build the dashboard and protect routes.
  async me(req: Request, res: Response) {
    res.json(req.user);
  },
  async forgotPassword(req: Request, res: Response) {
    res.json(await authService.forgotPassword(req.body.email));
  },
  async resetPassword(req: Request, res: Response) {
    res.json(await authService.resetPassword(req.body));
  },
};
