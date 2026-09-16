"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import {
  formatVnd,
  ReturnKind,
  ReturnState,
  storeApi,
  type ReturnDto,
} from "@/lib/api";
import type { MessageKey } from "@/i18n/messages";

function kindKey(kind: number): MessageKey {
  return kind === ReturnKind.Exchange ? "returns.exchange" : "returns.refund";
}

function stateKey(state: number): MessageKey {
  switch (state) {
    case ReturnState.Requested:
      return "returns.requested";
    case ReturnState.Approved:
      return "returns.approved";
    case ReturnState.Rejected:
      return "returns.rejected";
    case ReturnState.Received:
      return "returns.received";
    case ReturnState.Completed:
      return "returns.completed";
    default:
      return "returns.title";
  }
}

export default function MyReturnsPage() {
  const { isAuthenticated, hydrated } = useAuth();
  const { t } = useLocale();
  const [items, setItems] = useState<ReturnDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setItems(await storeApi.getMyReturns({ take: 50 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("returns.loadFail"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  if (!hydrated || loading) {
    return (
      <PageShell title={t("returns.title")} subtitle={t("common.loading")}>
        <p className="text-white/60">{t("common.loading")}</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title={t("returns.title")} subtitle={t("returns.needLogin")}>
        <div className="page-card rounded-2xl p-8 text-center">
          <Link
            href="/login?next=/returns"
            className="inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            {t("common.login")}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("returns.title")}
      subtitle={t("returns.subtitle")}
    >
      {error ? <p className="mb-4 text-sm text-amber-200/90">{error}</p> : null}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold"
        >
          {t("common.refresh")}
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="page-card rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">
                  {t(kindKey(item.kind))} · {t(stateKey(item.state))}
                </p>
                <p className="mt-1 text-sm text-white/55">
                  {t("returns.qtyRefund", {
                    qty: item.quantity,
                    amount: formatVnd(item.refundAmount),
                  })}
                </p>
                {item.reason ? (
                  <p className="mt-2 text-sm text-white/70">{item.reason}</p>
                ) : null}
              </div>
              <Link
                href={`/orders/${item.orderId}`}
                className="text-sm font-semibold text-nike-accent hover:brightness-110"
              >
                {t("returns.viewOrder")}
              </Link>
            </div>
          </li>
        ))}
        {!items.length ? (
          <li className="page-card rounded-2xl p-8 text-center text-white/55">
            {t("returns.empty")}
          </li>
        ) : null}
      </ul>
    </PageShell>
  );
}
