"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  apiFetch,
  saveAdminSession,
  loadAdminSession,
  clearAdminSession,
  logoutAdminSession,
  refreshAdminSession,
  type AdminSession,
} from "@/lib/api";

// ─── Context ────────────────────────────────────────

type AuthState = {
  session: AdminSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Provider ───────────────────────────────────────

const DEV_EMAIL = "richronholl@tuckinn.local";
const DEV_PASSWORD = "Tuckinn2026!";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Try stored session first
      const existing = loadAdminSession();
      if (existing) {
        try {
          const refreshed = await refreshAdminSession(existing.refreshToken);
          saveAdminSession(refreshed);
          setSession(refreshed);
          setIsLoading(false);
          return;
        } catch {
          clearAdminSession();
        }
      }
      // Dev auto-login
      try {
        const response = await apiFetch<AdminSession>("/auth/staff/login", {
          method: "POST",
          body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
        });
        saveAdminSession(response);
        setSession(response);
      } catch {
        // If API login fails, set a fallback so the UI still renders
        setSession({
          accessToken: "dev-fallback",
          refreshToken: "dev-fallback",
          user: { id: "dev-1", email: DEV_EMAIL, firstName: "Platform", lastName: "Admin", roles: ["admin"] },
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiFetch<AdminSession>("/auth/staff/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveAdminSession(response);
    setSession(response);
  }, []);

  const logout = useCallback(async () => {
    await logoutAdminSession(session);
    setSession(null);
  }, [session]);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const refreshed = await refreshAdminSession(session.refreshToken);
      setSession(refreshed);
    } catch {
      clearAdminSession();
      setSession(null);
    }
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}