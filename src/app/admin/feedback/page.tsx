"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { listContactMessages, type ContactMessage } from "@/lib/api";
import type { MessageKey } from "@/i18n/messages";

const statusStyle: Record<string, string> = {
  Open: "bg-orange-400/15 text-orange-300",
  Reviewed: "bg-sky-400/15 text-sky-300",
  Closed: "bg-white/10 text-white/60",
};

const statusKey: Record<string, MessageKey> = {
  Open: "admin.feedbackOpen",
  Reviewed: "admin.feedbackReviewed",
  Closed: "admin.feedbackClosed",
};

const topicStyle: Record<string, string> = {
  order: "bg-amber-400/15 text-amber-300",
  size: "bg-[#ed3b6b]/15 text-[#ed3b6b]",
  partner: "bg-sky-400/15 text-sky-300",
  other: "bg-white/10 text-white/70",
};

export default function AdminFeedbackPage() {
  const { isAuthenticated, hydrated } = useAuth();
  const { t, dateLocale } = useLocale();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listContactMessages();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được góp ý");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const openCount = items.filter((f) => f.status === "Open").length;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(dateLocale, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t("admin.feedback")}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {t("admin.feedbackSubtitle")}
          </p>
        </div>
        <p className="rounded-full border border-[#ed3b6b]/35 bg-[#ed3b6b]/10 px-3 py-1.5 text-xs font-bold text-[#ed3b6b]">
          {t("admin.feedbackOpenCount", { count: openCount })}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">{t("common.loading")}</p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-rose-400">{error}</p>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-white/50">Chưa có liên hệ nào.</p>
      ) : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${topicStyle[item.topic] || topicStyle.other}`}
                  >
                    {item.subject}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusStyle[item.status] || statusStyle.Closed}`}
                  >
                    {t(statusKey[item.status] || "admin.feedbackClosed")}
                  </span>
                  <span className="text-xs text-white/40">{item.id}</span>
                </div>
                <h2 className="text-lg font-bold">{item.subject}</h2>
                <p className="mt-1 text-sm text-white/55">
                  {item.name} · {item.email} · {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/75">{item.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
