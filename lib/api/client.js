"use client";

// Single fetch entry-point for the admin panel. Mirrors the storefront client
// (Bearer token + envelope unwrap) but talks only to /admin and /auth routes.

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const TOKEN_KEY = "Decor N Art-admin:accessToken";
const REFRESH_KEY = "Decor N Art-admin:refreshToken";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (!isBrowser()) return;
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Single-flight refresh: if many requests fire at once and all see 401, only one
// hits /auth/refresh; the rest await the same promise. Returns the new access
// token on success, null otherwise (and clears creds so callers stop retrying).
let refreshPromise = null;
async function refreshTokens() {
  const rt = getRefreshToken();
  if (!rt) return null;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const json = await res.json();
      const data = json && json.data;
      if (!json?.success || !data?.accessToken) {
        clearTokens();
        return null;
      }
      setTokens(data);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request(method, path, opts = {}) {
  const { body, query, auth = "auto", signal, envelope = false, _retried } = opts;
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      if (Array.isArray(v)) v.forEach((item) => url.searchParams.append(k, item));
      else url.searchParams.append(k, String(v));
    }
  }

  const headers = { "Content-Type": "application/json" };
  if (auth !== false) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Network error — could not reach the server.", { status: 0 });
  }

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError("Malformed server response.", { status: res.status });
    }
  }

  if (!res.ok || (payload && payload.success === false)) {
    // Silent refresh: the access token is 15-min; before surfacing a 401, try
    // to mint a new one from the (30-day) refresh token and retry the request
    // once. Skip for the refresh call itself and for explicit unauthenticated
    // requests.
    if (
      res.status === 401 &&
      auth !== false &&
      !_retried &&
      path !== "/auth/refresh" &&
      getRefreshToken()
    ) {
      const newToken = await refreshTokens();
      if (newToken) {
        return request(method, path, { ...opts, _retried: true });
      }
    }

    const err = payload && payload.error;
    throw new ApiError((err && err.message) || res.statusText || "Request failed", {
      status: res.status,
      code: err && err.code,
      details: err && err.details,
    });
  }

  if (envelope) {
    return {
      data: payload ? payload.data : null,
      meta: payload && payload.meta ? payload.meta : null,
    };
  }
  return payload ? payload.data : null;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
};
