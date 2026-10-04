// Session state shared by the whole app: who is logged in and what they may do.
// Lives in lib/ (not features/auth) because every feature needs `useAuth().can(...)`.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUserDTO, LoginResponseDTO, PermissionCode } from "@pp/shared";
import { api, getToken, setToken, setUnauthorizedHandler } from "../api/client";
import { Forbidden, Loading } from "../components/ui";

interface AuthState {
  user: AuthUserDTO | null;
  loading: boolean;
  /** True after "Log out" was clicked (as opposed to the session expiring). */
  loggedOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (...codes: PermissionCode[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [hasToken, setHasToken] = useState(() => !!getToken());
  const [loggedOut, setLoggedOut] = useState(false);

  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<AuthUserDTO>("/auth/me"),
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setHasToken(false);
      qc.clear();
    });
  }, [qc]);

  const user = hasToken ? (me.data ?? null) : null;

  const value: AuthState = {
    user,
    loading: hasToken && me.isPending,
    loggedOut,
    async login(email, password) {
      const res = await api.post<LoginResponseDTO>("/auth/login", { email, password });
      setToken(res.token);
      qc.setQueryData(["auth", "me"], res.user);
      setLoggedOut(false);
      setHasToken(true);
    },
    async logout() {
      try {
        await api.post("/auth/logout");
      } catch {
        // already logged out on the server — clear locally anyway
      }
      setToken(null);
      setLoggedOut(true);
      setHasToken(false);
      qc.clear();
    },
    can: (...codes) => !!user && codes.every((c) => user.permissions.includes(c)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * Route guard: sends logged-out users to /login. If the session expired, they come back to the
 * same page after logging in. After an explicit "Log out" they don't — the next person to log
 * in on this browser may be someone else, with different access.
 */
export function RequireAuth() {
  const { user, loading, loggedOut } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Checking your session…" />;
  if (!user) {
    const state = loggedOut ? undefined : { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/** Route guard: shows "No access" unless the user has every listed permission. */
export function RequirePermission({ perm, children }: { perm: PermissionCode | PermissionCode[]; children: ReactNode }) {
  const { can } = useAuth();
  const codes = Array.isArray(perm) ? perm : [perm];
  return can(...codes) ? <>{children}</> : <Forbidden />;
}
