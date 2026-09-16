"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  PASSWORD_MIN_LENGTH,
  confirmPasswordError,
  emailError,
  isNonEmpty,
  passwordError,
} from "@/lib/validation";

export default function LoginModal() {
  const {
    loginModalOpen,
    loginModalMessage,
    closeLoginModal,
    login,
    register,
    isAuthenticated,
  } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loginModalOpen) return;
    setError(null);
    setMode("login");
    setPassword("");
    setConfirmPassword("");
  }, [loginModalOpen]);

  useEffect(() => {
    if (loginModalOpen && isAuthenticated) {
      closeLoginModal();
    }
  }, [loginModalOpen, isAuthenticated, closeLoginModal]);

  useEffect(() => {
    if (!loginModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLoginModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loginModalOpen, closeLoginModal]);

  if (!loginModalOpen) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isNonEmpty(userName)) {
      setError("Vui lòng nhập username.");
      return;
    }

    if (mode === "login") {
      if (!password) {
        setError("Vui lòng nhập mật khẩu.");
        return;
      }
    } else {
      const pwdErr = passwordError(password);
      if (pwdErr) {
        setError(pwdErr);
        return;
      }
      const mailErr = emailError(email);
      if (mailErr) {
        setError(mailErr);
        return;
      }
      const confirmErr = confirmPasswordError(password, confirmPassword);
      if (confirmErr) {
        setError(confirmErr);
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
      closeLoginModal();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Đăng nhập thất bại",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginModal();
      }}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/15 bg-[#1a1a22] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
              Bắt buộc
            </p>
            <h2 id="login-modal-title" className="mt-1 text-2xl font-extrabold">
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {loginModalMessage ||
                "Đăng nhập để thêm sản phẩm vào giỏ và đồng bộ với API."}
            </p>
          </div>
          <button
            type="button"
            onClick={closeLoginModal}
            className="rounded-lg border border-white/15 px-2.5 py-1 text-sm text-white/60 hover:text-white"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

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
            autoFocus
            autoComplete="username"
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
              autoComplete="email"
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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
          />
          {mode === "register" ? (
            <span className="text-[11px] text-white/40">
              Tối thiểu {PASSWORD_MIN_LENGTH} ký tự
            </span>
          ) : null}
        </label>

        {mode === "register" ? (
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Nhập lại password
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
            ? "Đang xử lý…"
            : mode === "login"
              ? "Đăng nhập"
              : "Tạo tài khoản"}
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
          {mode === "login"
            ? "Chưa có tài khoản? Đăng ký"
            : "Đã có tài khoản? Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
