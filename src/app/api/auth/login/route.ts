import { NextRequest, NextResponse } from "next/server";
import { API_ORIGIN } from "@/lib/api/config";
import {
  collectSetCookieHeaders,
  parseSetCookieHeaders,
  writeAuthCookiesToResponse,
} from "@/lib/api/auth-cookies";

export const runtime = "nodejs";

type Body = {
  userName?: string;
  password?: string;
};

/** Đăng nhập cookie ABP — hoạt động trên HTTP :5000, không cần /connect/token HTTPS. */
export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Body JSON không hợp lệ" }, { status: 400 });
  }

  const userName = body.userName?.trim();
  const password = body.password ?? "";
  if (!userName || !password) {
    return NextResponse.json(
      { message: "Thiếu username hoặc password" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_ORIGIN}/api/account/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        userNameOrEmailAddress: userName,
        password,
        rememberMe: true,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      result?: number;
      description?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      return NextResponse.json(
        {
          message:
            json.error?.message ||
            json.description ||
            `Login thất bại (${res.status})`,
        },
        { status: res.status },
      );
    }

    // ABP: result 1 = Success
    if (json.result !== undefined && json.result !== 1) {
      return NextResponse.json(
        {
          message: json.description || `Login thất bại (result=${json.result})`,
        },
        { status: 401 },
      );
    }

    const loginCookies = parseSetCookieHeaders(collectSetCookieHeaders(res));
    if (!loginCookies.identity) {
      return NextResponse.json(
        {
          message:
            "Đăng nhập OK nhưng không nhận được cookie Identity. Kiểm tra API.",
        },
        { status: 502 },
      );
    }

    // Lấy antiforgery + XSRF (bắt buộc cho POST giỏ hàng / đặt hàng)
    const cfgRes = await fetch(
      `${API_ORIGIN}/api/abp/application-configuration`,
      {
        headers: {
          Accept: "application/json",
          Cookie: `.AspNetCore.Identity.Application=${loginCookies.identity}`,
        },
      },
    );
    const cfgCookies = parseSetCookieHeaders(collectSetCookieHeaders(cfgRes));

    const response = NextResponse.json({
      ok: true,
      userName,
      mode: "cookie",
      access_token: "cookie",
      token_type: "Cookie",
      expires_in: 60 * 60 * 24 * 14,
    });

    writeAuthCookiesToResponse(response, {
      identity: loginCookies.identity,
      antiforgeryName: cfgCookies.antiforgeryName,
      antiforgeryValue: cfgCookies.antiforgeryValue,
      xsrf: cfgCookies.xsrf,
    });

    if (!cfgCookies.xsrf || !cfgCookies.antiforgeryValue) {
      // Vẫn cho login; proxy có thể gọi /api/auth/csrf sau
      console.warn(
        "[auth/login] Thiếu antiforgery/XSRF sau application-configuration",
      );
    }

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không gọi được API login";
    return NextResponse.json(
      {
        message,
        hint: "API HTTP chưa chạy? cd backend/api && dotnet ShoeStore.HttpApi.Host.dll",
      },
      { status: 502 },
    );
  }
}
