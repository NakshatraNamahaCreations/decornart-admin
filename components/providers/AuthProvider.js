"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import * as authApi from "@/lib/api/auth";
import { getAccessToken, clearTokens } from "@/lib/api/client";

const AuthContext = createContext(null);

const PUBLIC_PATHS = new Set(["/login"]);

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | guest | authed

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setStatus("guest");
      return null;
    }
    try {
      const me = await authApi.me();
      if (me.role !== "admin") {
        clearTokens();
        setUser(null);
        setStatus("guest");
        return null;
      }
      setUser(me);
      setStatus("authed");
      return me;
    } catch {
      clearTokens();
      setUser(null);
      setStatus("guest");
      return null;
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Hard route gate: kick guests off any non-public page.
  useEffect(() => {
    if (status === "loading") return;
    if (status === "guest" && !PUBLIC_PATHS.has(pathname)) {
      router.replace("/login");
    }
    if (status === "authed" && pathname === "/login") {
      router.replace("/");
    }
  }, [status, pathname, router]);

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials);
      if (!data.user || data.user.role !== "admin") {
        clearTokens();
        throw new Error("This account is not an admin.");
      }
      setUser(data.user);
      setStatus("authed");
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("guest");
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isAuthed: status === "authed",
        isLoading: status === "loading",
        login,
        logout,
        refresh: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
