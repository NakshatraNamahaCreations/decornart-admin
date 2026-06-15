"use client";

import { api, setTokens, clearTokens } from "./client";

export async function login({ email, password }) {
  const data = await api.post("/auth/login", { email, password }, { auth: false });
  setTokens(data);
  return data;
}

export function me() {
  return api.get("/auth/me");
}

export async function logout() {
  try {
    await api.post("/auth/logout", {});
  } catch {
    /* ignore */
  }
  clearTokens();
}
