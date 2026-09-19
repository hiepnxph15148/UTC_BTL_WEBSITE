"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import {
  formatVnd,
  OrderState,
  storeApi,
  type OrderDto,
} from "@/lib/api";
import { displayOrderNumber, formatAddressRecipient } from "@/lib/format-display";
import { orderStateKey } from "@/lib/status-labels";

export default function MyOrdersPage() {
  const { isAuthenticated, hydrated } = useAuth();
  const { t } = useLocale();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setOrders(await storeApi.getMyOrders({ take: 50 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("orders.loadFail"));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  const cancel = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    setError(null);
    try {
      await storeApi.cancelMyOrder(id, { note: "Khách hủy đơn Pending" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("orders.cancelFail"));
    } finally {
      setBusyId(null);
    }
  };

  if (!hydrated) {
    return (
      <PageShell title={t("orders.title")} subtitle={t("common.loading")}>
        <p className="text-white/60">{t("common.loading")}</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title={t("orders.title")} subtitle={t("orders.needLogin")}>
        <div className="page-card rounded-2xl p-8 text-center">
          <Link
            href="/login?next=/orders"
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
      title={t("orders.mine")}
      accent="#ed3b6b"
      subtitle={t("orders.subtitle")}
    >
      {error ? (
        <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/5"
        >
          {t("common.refresh")}
        </button>
      </div>

      {loading ? (
        <p className="text-white/55">{t("orders.loadingList")}</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="page-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-lg font-extrabold">
                  {displayOrderNumber(order.number, order.id)}
                </p>
                <p className="mt-1 text-sm text-white/55">
                  {t(orderStateKey(order.state))} · COD · {formatVnd(order.total)}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {formatAddressRecipient(order.addressSnapshot)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="rounded-xl bg-nike-accent px-4 py-2 text-xs font-bold text-white"
                >
                  {t("orders.invoice")}
                </Link>
                {order.state === OrderState.Pending ? (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => void cancel(order.id)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white/75 disabled:opacity-50"
                  >
                    {busyId === order.id
                      ? t("orders.cancelling")
                      : t("orders.cancel")}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {!orders.length ? (
            <li className="page-card rounded-2xl p-8 text-center text-white/55">
              {t("orders.empty")}{" "}
              <Link href="/collections" className="text-nike-accent underline">
                {t("orders.shop")}
              </Link>
            </li>
          ) : null}
        </ul>
      )}
    </PageShell>
  );
}
