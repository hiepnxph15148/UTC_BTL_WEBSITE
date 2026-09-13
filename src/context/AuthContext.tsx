"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loginWithPassword,
  logoutLocal,
  ensureCsrf,
  readAuthSession,
  registerAccount,
  type AuthSession,
} from "@/lib/api";

type AuthContextValue = {
  session: AuthSession | null;
  hydrated: boolean;
  isAuthenticated: boolean;
  login: (userName: string, password: string) => Promise<void>;
  register: (input: {
    userName: string;
    emailAddress: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = readAuthSession();
    if (!existing) {
      setHydrated(true);
      return;
    }

    if (existing.expiresAt > Date.now() + 30_000) {
      setSession(existing);
      // Session cũ có thể thiếu cookie CSRF → làm mới
      void ensureCsrf().finally(() => setHydrated(true));
      return;
    }

    // Cookie / hết hạn: xóa session local
    void logoutLocal();
    setHydrated(true);
  }, []);

  const login = useCallback(async (userName: string, password: string) => {
    const next = await loginWithPassword(userName, password);
    setSession(next);
    await ensureCsrf();
  }, []);

  const register = useCallback(
    async (input: {
      userName: string;
      emailAddress: string;
      password: string;
    }) => {
      await registerAccount(input);
      const next = await loginWithPassword(input.userName, input.password);
      setSession(next);
    },
    [],
  );

  const logout = useCallback(() => {
    void logoutLocal();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      hydrated,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      register,
      logout,
    }),
    [session, hydrated, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
