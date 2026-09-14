"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import {
  formatVnd,
  OrderState,
  storeApi,
  type OrderDto,
} from "@/lib/api";

function stateLabel(state: number) {
  switch (state) {
    case OrderState.Pending:
      return "Chờ xác nhận";
    case OrderState.Confirmed:
      return "Đã xác nhận";
    case OrderState.Shipped:
      return "Đang giao";
    case OrderState.Delivered:
      return "Đã giao";
    case OrderState.Cancelled:
      return "Đã hủy";
    default:
      return String(state);
  }
}

export default function MyOrdersPage() {
  const { isAuthenticated, hydrated } = useAuth();
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
      setError(err instanceof Error ? err.message : "Không tải được đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
      setError(err instanceof Error ? err.message : "Hủy đơn thất bại");
    } finally {
      setBusyId(null);
    }
  };

  if (!hydrated) {
    return (
      <PageShell title="Đơn hàng" subtitle="Đang tải…">
        <p className="text-white/60">Loading…</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title="Đơn hàng" subtitle="Cần đăng nhập để xem đơn của bạn.">
        <div className="page-card rounded-2xl p-8 text-center">
          <Link
            href="/login?next=/orders"
            className="inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            Đăng nhập
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Đơn hàng của tôi"
      accent="#ed3b6b"
      subtitle="Lịch sử đặt hàng · mở hóa đơn / hủy đơn Pending"
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
          Làm mới
        </button>
      </div>

      {loading ? (
        <p className="text-white/55">Đang tải đơn…</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="page-card flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-lg font-extrabold">
                  {order.number || order.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-sm text-white/55">
                  {stateLabel(order.state)} · COD · {formatVnd(order.total)}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {order.addressSnapshot?.split("|")[0] || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="rounded-xl bg-nike-accent px-4 py-2 text-xs font-bold text-white"
                >
                  Hóa đơn
                </Link>
                {order.state === OrderState.Pending ? (
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => void cancel(order.id)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white/75 disabled:opacity-50"
                  >
                    {busyId === order.id ? "Đang hủy…" : "Hủy đơn"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {!orders.length ? (
            <li className="page-card rounded-2xl p-8 text-center text-white/55">
              Chưa có đơn nào.{" "}
              <Link href="/collections" className="text-nike-accent underline">
                Mua sắm
              </Link>
            </li>
          ) : null}
        </ul>
      )}
    </PageShell>
  );
}
