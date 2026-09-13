import { writeAuthSession, type AuthSession } from "./client";

export async function loginWithPassword(
  userNameOrEmailAddress: string,
  password: string,
): Promise<AuthSession> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      userName: userNameOrEmailAddress,
      password,
    }),
  });

  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    message?: string;
    hint?: string;
    userName?: string;
    mode?: string;
  };

  if (!res.ok) {
    const msg = [json.message, json.hint].filter(Boolean).join(". ");
    throw new Error(msg || "Login thất bại");
  }

  const session: AuthSession = {
    accessToken: json.access_token || "cookie",
    expiresAt: Date.now() + (json.expires_in || 60 * 60 * 24 * 14) * 1000,
    userName: json.userName || userNameOrEmailAddress,
    mode: "cookie",
  };
  writeAuthSession(session);
  return session;
}

export async function refreshAccessToken(): Promise<AuthSession> {
  // Cookie mode: không refresh bearer — giữ session local nếu cookie còn
  const { readAuthSession } = await import("./client");
  const existing = readAuthSession();
  if (!existing) throw new Error("Chưa đăng nhập");
  return existing;
}

export async function registerAccount(input: {
  userName: string;
  emailAddress: string;
  password: string;
}) {
  const { apiFetch } = await import("./client");
  return apiFetch("/api/account/register", {
    method: "POST",
    json: {
      ...input,
      appName: "MVC",
    },
  });
}

export async function logoutLocal() {
  writeAuthSession(null);
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
}

/** Đảm bảo cookie antiforgery/XSRF sẵn sàng cho POST giỏ hàng. */
export async function ensureCsrf(): Promise<void> {
  try {
    const check = await fetch("/api/auth/csrf", { method: "GET" });
    const json = (await check.json().catch(() => ({}))) as { ready?: boolean };
    if (json.ready) return;
    await fetch("/api/auth/csrf", { method: "POST" });
  } catch {
    // ignore — request sau sẽ báo lỗi rõ hơn
  }
}
