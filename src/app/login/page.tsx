"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

function resolveAfterLogin(userName: string, nextParam: string | null) {
  // Nếu đang checkout/cart… thì giữ next
  if (nextParam && nextParam !== "/") return nextParam;
  const name = userName.trim().toLowerCase();
  if (name === "admin" || name === "store-manager") return "/admin";
  return nextParam || "/";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next");
  const { login, register, isAuthenticated, session } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    router.replace(
      resolveAfterLogin(session?.userName || userName, nextParam),
    );
  }, [isAuthenticated, session?.userName, userName, nextParam, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(userName.trim(), password);
      } else {
        await register({
          userName: userName.trim(),
          emailAddress: email.trim(),
          password,
        });
      }
      router.replace(resolveAfterLogin(userName, nextParam));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Đăng nhập thất bại";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      title={mode === "login" ? "Đăng nhập" : "Đăng ký"}
      accent="#ed3b6b"
      subtitle="Admin vào /admin · khách vào store. Giỏ/checkout cần đăng nhập."
    >
      <form
        onSubmit={onSubmit}
        className="page-card mx-auto max-w-md space-y-4 rounded-2xl p-6"
      >
        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Username
          </span>
          <input
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
          />
        </label>

        {mode === "register" ? (
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
            />
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Password
          </span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-nike-accent py-3 text-sm font-bold text-white disabled:opacity-70"
        >
          {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>

        <button
          type="button"
          onClick={() =>
            setMode((m) => (m === "login" ? "register" : "login"))
          }
          className="w-full text-sm text-white/60 hover:text-white"
        >
          {mode === "login"
            ? "Chưa có tài khoản? Đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </button>

        <p className="text-center text-xs text-white/40">
          <Link href="/" className="underline">
            Về trang chủ
          </Link>
        </p>
      </form>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <PageShell title="Đăng nhập" subtitle="Đang tải…">
          <p className="text-white/60">Loading…</p>
        </PageShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
