import {
  AF_NAME_COOKIE,
  AF_VALUE_COOKIE,
  AUTH_COOKIE_NAME,
  XSRF_COOKIE_NAME,
} from "./config";

export type BackendAuthCookies = {
  identity: string | null;
  antiforgeryName: string | null;
  antiforgeryValue: string | null;
  xsrf: string | null;
};

/** Parse một hoặc nhiều Set-Cookie header từ API .NET. */
export function parseSetCookieHeaders(
  setCookieHeaders: string[],
): BackendAuthCookies {
  let identity: string | null = null;
  let antiforgeryName: string | null = null;
  let antiforgeryValue: string | null = null;
  let xsrf: string | null = null;

  for (const raw of setCookieHeaders) {
    const match = raw.match(/^([^=]+)=([^;]*)/);
    if (!match) continue;
    const name = match[1].trim();
    const value = match[2];
    if (name === ".AspNetCore.Identity.Application") {
      identity = value;
    } else if (name.startsWith(".AspNetCore.Antiforgery.")) {
      antiforgeryName = name;
      antiforgeryValue = value;
    } else if (name === "XSRF-TOKEN") {
      xsrf = value;
    }
  }

  return { identity, antiforgeryName, antiforgeryValue, xsrf };
}

export function collectSetCookieHeaders(res: Response): string[] {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

type CookieWriter = {
  cookies: {
    set: (options: {
      name: string;
      value: string;
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      path?: string;
      secure?: boolean;
      maxAge?: number;
    }) => void;
  };
};

export function writeAuthCookiesToResponse(
  response: CookieWriter,
  cookies: BackendAuthCookies,
  maxAge = 60 * 60 * 24 * 14,
) {
  if (cookies.identity) {
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: cookies.identity,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge,
    });
  }
  if (cookies.antiforgeryName && cookies.antiforgeryValue) {
    response.cookies.set({
      name: AF_NAME_COOKIE,
      value: cookies.antiforgeryName,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge,
    });
    response.cookies.set({
      name: AF_VALUE_COOKIE,
      value: cookies.antiforgeryValue,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge,
    });
  }
  if (cookies.xsrf) {
    response.cookies.set({
      name: XSRF_COOKIE_NAME,
      value: cookies.xsrf,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      maxAge,
    });
  }
}

export function clearAuthCookies(response: CookieWriter) {
  for (const name of [
    AUTH_COOKIE_NAME,
    AF_NAME_COOKIE,
    AF_VALUE_COOKIE,
    XSRF_COOKIE_NAME,
  ]) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

/** Cookie jar gửi sang ShoeStore API. */
export function buildBackendCookieHeader(input: {
  identity?: string | null;
  antiforgeryName?: string | null;
  antiforgeryValue?: string | null;
  xsrf?: string | null;
}): string | null {
  const parts: string[] = [];
  if (input.identity) {
    parts.push(`.AspNetCore.Identity.Application=${input.identity}`);
  }
  if (input.antiforgeryName && input.antiforgeryValue) {
    parts.push(`${input.antiforgeryName}=${input.antiforgeryValue}`);
  }
  if (input.xsrf) {
    parts.push(`XSRF-TOKEN=${input.xsrf}`);
  }
  return parts.length ? parts.join("; ") : null;
}
