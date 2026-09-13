import { NextRequest, NextResponse } from "next/server";
import {
  AF_NAME_COOKIE,
  AF_VALUE_COOKIE,
  API_ORIGIN,
  AUTH_COOKIE_NAME,
  XSRF_COOKIE_NAME,
} from "@/lib/api/config";
import {
  collectSetCookieHeaders,
  parseSetCookieHeaders,
  writeAuthCookiesToResponse,
} from "@/lib/api/auth-cookies";

export const runtime = "nodejs";

/** Làm mới antiforgery/XSRF từ session Identity hiện có (sau F5 / login cũ). */
export async function POST(request: NextRequest) {
  const identity = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!identity) {
    return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const cfgRes = await fetch(
      `${API_ORIGIN}/api/abp/application-configuration`,
      {
        headers: {
          Accept: "application/json",
          Cookie: `.AspNetCore.Identity.Application=${identity}`,
        },
      },
    );

    if (!cfgRes.ok) {
      return NextResponse.json(
        { message: `Không lấy được CSRF (${cfgRes.status})` },
        { status: 502 },
      );
    }

    const cfgCookies = parseSetCookieHeaders(collectSetCookieHeaders(cfgRes));
    if (!cfgCookies.xsrf || !cfgCookies.antiforgeryValue) {
      return NextResponse.json(
        { message: "API không trả antiforgery/XSRF" },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ ok: true });
    writeAuthCookiesToResponse(response, {
      identity,
      antiforgeryName: cfgCookies.antiforgeryName,
      antiforgeryValue: cfgCookies.antiforgeryValue,
      xsrf: cfgCookies.xsrf,
    });
    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "CSRF bootstrap thất bại";
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const has =
    Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value) &&
    Boolean(request.cookies.get(XSRF_COOKIE_NAME)?.value) &&
    Boolean(request.cookies.get(AF_VALUE_COOKIE)?.value) &&
    Boolean(request.cookies.get(AF_NAME_COOKIE)?.value);
  return NextResponse.json({ ready: has });
}
