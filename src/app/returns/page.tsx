"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import {
  formatVnd,
  ReturnKind,
  ReturnState,
  storeApi,
  type ReturnDto,
} from "@/lib/api";

function kindLabel(kind: number) {
  return kind === ReturnKind.Exchange ? "Đổi hàng" : "Hoàn tiền";
}

function stateLabel(state: number) {
  switch (state) {
    case ReturnState.Requested:
      return "Đã gửi";
    case ReturnState.Approved:
      return "Đã duyệt";
    case ReturnState.Rejected:
      return "Từ chối";
    case ReturnState.Received:
      return "Đã nhận hàng";
    case ReturnState.Completed:
      return "Hoàn tất";
    default:
      return String(state);
  }
}

export default function MyReturnsPage() {
  const { isAuthenticated, hydrated } = useAuth();
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
      setError(err instanceof Error ? err.message : "Không tải được đổi/trả");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  if (!hydrated || loading) {
    return (
      <PageShell title="Returns" subtitle="Đang tải…">
        <p className="text-white/60">Loading…</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title="Returns" subtitle="Cần đăng nhập.">
        <div className="page-card rounded-2xl p-8 text-center">
          <Link
            href="/login?next=/returns"
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
      title="Returns"
      subtitle="Yêu cầu đổi/trả của bạn"
    >
      {error ? <p className="mb-4 text-sm text-amber-200/90">{error}</p> : null}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold"
        >
          Làm mới
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="page-card rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">
                  {kindLabel(item.kind)} · {stateLabel(item.state)}
                </p>
                <p className="mt-1 text-sm text-white/55">
                  SL {item.quantity} · hoàn dự kiến {formatVnd(item.refundAmount)}
                </p>
                {item.reason ? (
                  <p className="mt-2 text-sm text-white/70">{item.reason}</p>
                ) : null}
              </div>
              <Link
                href={`/orders/${item.orderId}`}
                className="text-sm font-semibold text-nike-accent hover:brightness-110"
              >
                Xem đơn
              </Link>
            </div>
          </li>
        ))}
        {!items.length ? (
          <li className="page-card rounded-2xl p-8 text-center text-white/55">
            Chưa có yêu cầu đổi/trả. Gửi từ hóa đơn đơn đã giao.
          </li>
        ) : null}
      </ul>
    </PageShell>
  );
}
