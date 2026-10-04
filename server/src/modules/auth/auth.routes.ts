import { Router } from "express";
import { asyncHandler as ah } from "../../middleware/async-handler.js";
import { validate } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { authController as c } from "./auth.controller.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.validation.js";

export const authRoutes = Router();

authRoutes.post("/auth/signup", validate({ body: signupSchema }), ah(c.signup));
authRoutes.post("/auth/login", validate({ body: loginSchema }), ah(c.login));
authRoutes.post("/auth/logout", authenticate, ah(c.logout));
authRoutes.get("/auth/me", authenticate, ah(c.me));
authRoutes.post("/auth/forgot-password", validate({ body: forgotPasswordSchema }), ah(c.forgotPassword));
authRoutes.post("/auth/reset-password", validate({ body: resetPasswordSchema }), ah(c.resetPassword));
