import { NextRequest, NextResponse } from "next/server";
import {
  AF_NAME_COOKIE,
  AF_VALUE_COOKIE,
  API_ORIGIN,
  AUTH_COOKIE_NAME,
  XSRF_COOKIE_NAME,
} from "@/lib/api/config";
import {
  buildBackendCookieHeader,
  collectSetCookieHeaders,
  parseSetCookieHeaders,
  writeAuthCookiesToResponse,
} from "@/lib/api/auth-cookies";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path: string[] }> };

function mapRedirectError(statusFromLocation: string | null, fallbackStatus: number) {
  const code = Number(statusFromLocation);
  if (code === 401) {
    return {
      status: 401,
      message: "Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Hãy đăng nhập lại.",
    };
  }
  if (code === 400) {
    return {
      status: 400,
      message:
        "Yêu cầu bị từ chối (thiếu CSRF hoặc dữ liệu không hợp lệ). Thử đăng nhập lại.",
    };
  }
  if (code === 403) {
    return {
      status: 403,
      message: "Bạn không có quyền thực hiện thao tác này.",
    };
  }
  if (code === 404) {
    return {
      status: 404,
      message: "Không tìm thấy tài nguyên trên API.",
    };
  }
  return {
    status: fallbackStatus >= 400 ? fallbackStatus : 502,
    message: `API trả lỗi (${statusFromLocation || fallbackStatus}).`,
  };
}

async function proxy(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const targetPath = path.join("/");
  const url = new URL(request.url);
  const target = `${API_ORIGIN}/${targetPath}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("Content-Type", contentType);
  if (accept) headers.set("Accept", accept);
  else headers.set("Accept", "application/json");

  const identity = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const afName = request.cookies.get(AF_NAME_COOKIE)?.value;
  const afValue = request.cookies.get(AF_VALUE_COOKIE)?.value;
  const xsrf = request.cookies.get(XSRF_COOKIE_NAME)?.value;

  const cookieHeader = buildBackendCookieHeader({
    identity,
    antiforgeryName: afName,
    antiforgeryValue: afValue,
    xsrf,
  });
  if (cookieHeader) headers.set("Cookie", cookieHeader);

  // ABP cookie auth bắt buộc token này cho POST/PUT/DELETE
  if (xsrf && request.method !== "GET" && request.method !== "HEAD") {
    headers.set("RequestVerificationToken", xsrf);
    headers.set("X-XSRF-TOKEN", xsrf);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength) init.body = body;
  }

  try {
    const res = await fetch(target, init);

    // ABP hay redirect 302 → /Error?httpStatusCode=400|401 khi CSRF/auth fail
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location") || "";
      const match = location.match(/httpStatusCode=(\d+)/);
      const mapped = mapRedirectError(match?.[1] ?? null, res.status);
      return NextResponse.json(
        { error: { message: mapped.message } },
        { status: mapped.status },
      );
    }

    const outHeaders = new Headers();
    const resType = res.headers.get("content-type");
    if (resType) outHeaders.set("content-type", resType);

    const response =
      res.status === 204
        ? new NextResponse(null, { status: 204, headers: outHeaders })
        : new NextResponse(await res.arrayBuffer(), {
            status: res.status,
            headers: outHeaders,
          });

    // Làm mới CSRF nếu API set lại cookie
    const refreshed = parseSetCookieHeaders(collectSetCookieHeaders(res));
    if (refreshed.antiforgeryValue || refreshed.xsrf) {
      writeAuthCookiesToResponse(response, {
        identity: identity ?? null,
        antiforgeryName: refreshed.antiforgeryName ?? afName ?? null,
        antiforgeryValue: refreshed.antiforgeryValue ?? afValue ?? null,
        xsrf: refreshed.xsrf ?? xsrf ?? null,
      });
    }

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Proxy API thất bại";
    return NextResponse.json(
      {
        error: {
          message: `${message}. Kiểm tra API tại ${API_ORIGIN}`,
        },
      },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
