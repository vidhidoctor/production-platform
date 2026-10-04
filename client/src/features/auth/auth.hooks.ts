import { useMutation } from "@tanstack/react-query";
import { authApi } from "./auth.api";

export const useSignup = () => useMutation({ mutationFn: authApi.signup });
export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgotPassword });
export const useResetPassword = () => useMutation({ mutationFn: authApi.resetPassword });
