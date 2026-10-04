// Account endpoints that don't need a session. (Login / logout / me live in lib/auth.tsx.)
import { api } from "../../api/client";

export const authApi = {
  signup: (body: { name: string; email: string; password: string }) =>
    api.post<{ id: number; message: string }>("/auth/signup", body),

  forgotPassword: (email: string) =>
    api.post<{ message: string; devResetToken?: string }>("/auth/forgot-password", { email }),

  resetPassword: (body: { token: string; password: string }) =>
    api.post<{ message: string }>("/auth/reset-password", body),
};
