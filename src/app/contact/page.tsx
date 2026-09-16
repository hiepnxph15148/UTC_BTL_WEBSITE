"use client";

import { useEffect, useState, type FormEvent } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import {
  getMyProfile,
  submitContact,
  type ContactTopic,
} from "@/lib/api";
import {
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  NAME_MIN_LENGTH,
  emailError,
  nameError,
} from "@/lib/validation";

export default function ContactPage() {
  const { isAuthenticated, hydrated, session } = useAuth();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("order");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;

    let cancelled = false;
    void (async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        const fullName = [profile.name, profile.surname]
          .filter(Boolean)
          .join(" ")
          .trim();
        setName(fullName || profile.userName || session?.userName || "");
        setEmail(profile.email || "");
      } catch {
        if (cancelled) return;
        if (session?.userName) setName(session.userName);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthenticated, session?.userName]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setSent(false);

    const nameErr = nameError(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    const mailErr = emailError(email);
    if (mailErr) {
      setError(mailErr);
      return;
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < MESSAGE_MIN_LENGTH) {
      setError(`Nội dung tối thiểu ${MESSAGE_MIN_LENGTH} ký tự.`);
      return;
    }
    if (trimmedMessage.length > MESSAGE_MAX_LENGTH) {
      setError(`Nội dung tối đa ${MESSAGE_MAX_LENGTH} ký tự.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        topic,
        message: trimmedMessage,
      });
      setSent(true);
      setMessage("");
      setTopic("order");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi liên hệ thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      title="Contact"
      accent="#ed3b6b"
      subtitle="Liên hệ hỗ trợ đơn hàng, đổi size hoặc hợp tác. Phản hồi trong giờ hành chính."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={onSubmit}
          className="page-card rounded-2xl p-5 sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-white/85">Họ tên</span>
              <input
                required
                name="name"
                minLength={NAME_MIN_LENGTH}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-white outline-none transition-colors focus:border-nike-accent"
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-white/85">Email</span>
              <input
                required
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-white outline-none transition-colors focus:border-nike-accent"
                placeholder="you@email.com"
              />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-semibold text-white/85">Chủ đề</span>
            <select
              name="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value as ContactTopic)}
              className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-white outline-none transition-colors focus:border-nike-accent"
            >
              <option value="order">Đơn hàng</option>
              <option value="size">Đổi size</option>
              <option value="partner">Hợp tác</option>
              <option value="other">Khác</option>
            </select>
          </label>

          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-semibold text-white/85">Nội dung</span>
            <textarea
              required
              name="message"
              rows={5}
              minLength={MESSAGE_MIN_LENGTH}
              maxLength={MESSAGE_MAX_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-white outline-none transition-colors focus:border-nike-accent"
              placeholder="Mô tả ngắn vấn đề của bạn..."
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 inline-flex h-11 cursor-pointer items-center rounded-xl bg-gradient-to-r from-nike-accent to-[#ff6b95] px-5 text-sm font-bold tracking-wide text-white shadow-[0_12px_30px_rgba(237,59,107,0.35)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {busy ? "Đang gửi…" : "Gửi liên hệ"}
          </button>

          {error ? (
            <p className="mt-3 text-sm font-medium text-rose-400">{error}</p>
          ) : null}
          {sent ? (
            <p className="mt-3 text-sm font-medium text-emerald-400">
              Đã gửi liên hệ — cảm ơn bạn. Chúng tôi sẽ phản hồi sớm.
            </p>
          ) : null}
        </form>

        <aside className="page-card relative overflow-hidden rounded-2xl p-5 sm:p-7">
          <div
            aria-hidden
            className="absolute -right-10 top-8 h-16 w-48 -rotate-[28deg] opacity-80"
            style={{
              background: "linear-gradient(90deg, #ed3b6b, #7c5cff, #3b82f6)",
            }}
          />
          <div className="relative z-10">
            <h2 className="font-display text-2xl font-bold">Thông tin store</h2>
            <p className="mt-2 text-sm text-white/65">
              Hỗ trợ nhanh cho đơn hàng và trải nghiệm mua sắm Nike.
            </p>
            <ul className="mt-6 space-y-5 text-sm text-white/75">
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">Địa chỉ</p>
                <p className="mt-1">123 Nike Street, Quận 1, TP.HCM</p>
              </li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">Hotline</p>
                <p className="mt-1">1900 1234</p>
              </li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">Email</p>
                <p className="mt-1">support@nike-utc.demo</p>
              </li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">Giờ làm việc</p>
                <p className="mt-1">T2–T7 · 9:00–18:00</p>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
