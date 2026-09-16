"use client";

import { useState, type FormEvent } from "react";
import PageShell from "@/components/PageShell";
import { useLocale } from "@/context/LocaleContext";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { t } = useLocale();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <PageShell
      title={t("contact.title")}
      accent="#ed3b6b"
      subtitle={t("contact.subtitle")}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={onSubmit}
          className="page-card rounded-2xl p-5 sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-white/85">{t("contact.name")}</span>
              <input
                required
                name="name"
                className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-white outline-none transition-colors focus:border-nike-accent"
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-white/85">{t("common.email")}</span>
              <input
                required
                type="email"
                name="email"
                className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-white outline-none transition-colors focus:border-nike-accent"
                placeholder="you@email.com"
              />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-semibold text-white/85">{t("contact.topic")}</span>
            <select
              name="topic"
              className="h-11 rounded-xl border border-white/15 bg-black/40 px-3 text-white outline-none transition-colors focus:border-nike-accent"
              defaultValue="order"
            >
              <option value="order">{t("contact.topicOrder")}</option>
              <option value="size">{t("contact.topicSize")}</option>
              <option value="partner">{t("contact.topicPartner")}</option>
              <option value="other">{t("contact.topicOther")}</option>
            </select>
          </label>

          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-semibold text-white/85">{t("contact.message")}</span>
            <textarea
              required
              name="message"
              rows={5}
              className="rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-white outline-none transition-colors focus:border-nike-accent"
              placeholder={t("contact.messagePh")}
            />
          </label>

          <button
            type="submit"
            className="mt-5 inline-flex h-11 cursor-pointer items-center rounded-xl bg-gradient-to-r from-nike-accent to-[#ff6b95] px-5 text-sm font-bold tracking-wide text-white shadow-[0_12px_30px_rgba(237,59,107,0.35)] transition-transform hover:scale-105"
          >
            {t("contact.send")}
          </button>

          {sent ? (
            <p className="mt-3 text-sm font-medium text-emerald-400">
              {t("contact.sent")}
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
            <h2 className="font-display text-2xl font-bold">{t("contact.info")}</h2>
            <p className="mt-2 text-sm text-white/65">
              {t("contact.infoDesc")}
            </p>
            <ul className="mt-6 space-y-5 text-sm text-white/75">
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">{t("contact.address")}</p>
                <p className="mt-1">{t("contact.addressVal")}</p>
              </li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">{t("contact.hotline")}</p>
                <p className="mt-1">1900 1234</p>
              </li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">{t("common.email")}</p>
                <p className="mt-1">support@nike-utc.demo</p>
              </li>
              <li className="rounded-xl border border-white/10 bg-black/25 p-4">
                <p className="font-semibold text-white">{t("contact.hours")}</p>
                <p className="mt-1">{t("contact.hoursVal")}</p>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
