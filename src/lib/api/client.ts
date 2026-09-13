import { API_BASE_URL, API_ORIGIN, AUTH_STORAGE_KEY } from "./config";
import type { AbpErrorBody } from "./types";

export class ApiError extends Error {
  status: number;
  body: AbpErrorBody | null;

  constructor(status: number, message: string, body: AbpErrorBody | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userName?: string;
  mode?: "cookie" | "bearer";
};

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function resolveUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Ảnh local của API đi qua proxy rewrite
  if (API_BASE_URL.startsWith("/")) {
    return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

export { mediaUrl };

async function parseError(res: Response): Promise<ApiError> {
  let body: AbpErrorBody | null = null;
  let message = res.statusText || `HTTP ${res.status}`;
  try {
    body = (await res.json()) as AbpErrorBody;
    message =
      body?.error?.message ||
      body?.error?.details ||
      body?.error?.validationErrors?.[0]?.message ||
      message;
  } catch {
    // ignore non-JSON
  }
  return new ApiError(res.status, message, body);
}

export type ApiFetchOptions = RequestInit & {
  auth?: boolean | "optional";
  json?: unknown;
  searchParams?: Record<string, string | number | boolean | null | undefined>;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth = false, json, searchParams, headers, ...rest } = options;

  let url = resolveUrl(path);
  if (searchParams) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      qs.set(key, String(value));
    }
    const q = qs.toString();
    if (q) url += (url.includes("?") ? "&" : "?") + q;
  }

  const finalHeaders = new Headers(headers);
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
  }
  finalHeaders.set("Accept", "application/json");

  if (auth === true || auth === "optional") {
    const session = readAuthSession();
    if (session?.accessToken && session.mode !== "cookie" && session.accessToken !== "cookie") {
      finalHeaders.set("Authorization", `Bearer ${session.accessToken}`);
    } else if (auth === true && !session?.accessToken) {
      throw new ApiError(401, "Bạn cần đăng nhập để tiếp tục.");
    }
  }

  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  // Một số proxy/API trả 302 "Found" — không coi là thành công
  if (res.status >= 300) {
    throw new ApiError(
      res.status,
      res.status === 302
        ? "Yêu cầu bị chuyển hướng (thường thiếu CSRF). Hãy đăng nhập lại."
        : res.statusText || `HTTP ${res.status}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
