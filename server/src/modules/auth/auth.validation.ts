import { z } from "zod";
import { requiredText, email, password } from "../../middleware/validate.js";

export const signupSchema = z.object({ name: requiredText("name"), email, password });

export const loginSchema = z.object({
  email,
  password: z.string({ error: "password is required." }).min(1, "password is required."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ token: requiredText("token"), password });
