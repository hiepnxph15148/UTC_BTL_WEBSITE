"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { ApiError } from "@/lib/api";
import {
  PASSWORD_MIN_LENGTH,
  confirmPasswordError,
  emailError,
  formatIssue,
  passwordError,
  usernameError,
} from "@/lib/validation";

function resolveAfterLogin(userName: string, nextParam: string | null) {
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
  const { t } = useLocale();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    setError(null);

    const userMsg = formatIssue(t, usernameError(userName));
    if (userMsg) {
      setError(userMsg);
      return;
    }

    if (mode === "login") {
      if (!password) {
        setError(t("validation.passwordRequired"));
        return;
      }
    } else {
      const pwdMsg = formatIssue(t, passwordError(password));
      if (pwdMsg) {
        setError(pwdMsg);
        return;
      }
      const mailMsg = formatIssue(t, emailError(email));
      if (mailMsg) {
        setError(mailMsg);
        return;
      }
      const confirmMsg = formatIssue(
        t,
        confirmPasswordError(password, confirmPassword),
      );
      if (confirmMsg) {
        setError(confirmMsg);
        return;
      }
    }

    setBusy(true);
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
            : t("login.fail");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      title={mode === "login" ? t("common.login") : t("common.register")}
      accent="#ed3b6b"
      subtitle={t("login.subtitle")}
    >
      <form
        onSubmit={onSubmit}
        className="page-card mx-auto max-w-md space-y-4 rounded-2xl p-6"
        noValidate
      >
        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("common.username")}
          </span>
          <input
            required
            autoComplete="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
          />
        </label>

        {mode === "register" ? (
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("common.email")}
            </span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
            />
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {t("common.password")}
          </span>
          <input
            required
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
          />
          {mode === "register" ? (
            <span className="text-[11px] text-white/40">
              {t("validation.passwordHint", { min: PASSWORD_MIN_LENGTH })}
            </span>
          ) : null}
        </label>

        {mode === "register" ? (
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              {t("validation.confirmPassword")}
            </span>
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={PASSWORD_MIN_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
            />
          </label>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-nike-accent py-3 text-sm font-bold text-white disabled:opacity-70"
        >
          {busy
            ? t("common.processing")
            : mode === "login"
              ? t("common.login")
              : t("login.create")}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "login" ? "register" : "login"));
            setError(null);
            setConfirmPassword("");
          }}
          className="w-full text-sm text-white/60 hover:text-white"
        >
          {mode === "login" ? t("login.needAccount") : t("login.hasAccount")}
        </button>

        <p className="text-center text-xs text-white/40">
          <Link href="/" className="underline">
            {t("login.home")}
          </Link>
        </p>
      </form>
    </PageShell>
  );
}

function LoginFallback() {
  const { t } = useLocale();
  return (
    <PageShell title={t("common.login")} subtitle={t("common.loading")}>
      <p className="text-white/60">{t("common.loading")}</p>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
