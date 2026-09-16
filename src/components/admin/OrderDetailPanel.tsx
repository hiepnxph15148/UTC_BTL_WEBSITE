"use client";

import { useEffect, useState } from "react";
import {
  CodState,
  OrderState,
  formatVnd,
  storeApi,
  type OrderDetailDto,
  type OrderDto,
} from "@/lib/api";
import {
  displayOrderNumber,
  displayProductName,
  formatAddressLines,
} from "@/lib/format-display";
import {
  formatOrderAmount,
  orderStateLabel,
  paymentStateLabel,
  useAdmin,
} from "@/context/AdminContext";

type Props = {
  order: OrderDto;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
};

export default function OrderDetailPanel({ order, onClose, onChanged }: Props) {
  const { fromApi } = useAdmin();
  const [detail, setDetail] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [carrier, setCarrier] = useState("Giao hàng thủ công");
  const [trackingCode, setTrackingCode] = useState("");

  const current = detail?.order ?? order;

  const load = async () => {
    if (!fromApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.getAdminOrder(order.id);
      setDetail(data);
      if (data.order.carrier) setCarrier(data.order.carrier);
      if (data.order.trackingCode) setTrackingCode(data.order.trackingCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được chi tiết đơn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when order id changes
  }, [order.id, fromApi]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
      await load();
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setBusy(false);
    }
  };

  const addressLines = formatAddressLines(current.addressSnapshot);

  return (
    <div className="admin-card flex max-h-[min(82vh,820px)] flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Chi tiết đơn
          </p>
          <h3 className="mt-1 text-xl font-extrabold">
            {displayOrderNumber(current.number, current.id)}
          </h3>
          <p className="mt-1 text-sm text-white/55">
            {orderStateLabel(current.state)} · {paymentStateLabel(current.paymentState)} ·{" "}
            {formatOrderAmount(current.total)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5"
        >
          Đóng
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-white/45">Đang tải chi tiết…</p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
            {error}
          </p>
        ) : null}

        <section>
          <h4 className="text-sm font-bold text-white/80">Khách / địa chỉ</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/60">
            {addressLines.length ? (
              addressLines.map((line) => <li key={line}>{line}</li>)
            ) : (
              <li>Không có snapshot địa chỉ</li>
            )}
          </ul>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/50">
            <div>
              <dt>Subtotal</dt>
              <dd className="text-white/80">{formatVnd(current.subtotal)}</dd>
            </div>
            <div>
              <dt>Giảm giá</dt>
              <dd className="text-white/80">{formatVnd(current.discount)}</dd>
            </div>
            <div>
              <dt>Ship</dt>
              <dd className="text-white/80">{formatVnd(current.shippingFee)}</dd>
            </div>
            <div>
              <dt>Hoàn</dt>
              <dd className="text-white/80">{formatVnd(current.refunded)}</dd>
            </div>
            {current.carrier ? (
              <div className="col-span-2">
                <dt>Vận chuyển</dt>
                <dd className="text-white/80">
                  {current.carrier} · {current.trackingCode || "—"}
                </dd>
              </div>
            ) : null}
            {current.state === OrderState.Pending ? (
              <div className="col-span-2">
                <dt>Hết hạn giữ hàng</dt>
                <dd className="text-white/80">
                  {current.reservationExpiresAt
                    ? new Date(current.reservationExpiresAt).toLocaleString("vi-VN")
                    : "—"}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section>
          <h4 className="text-sm font-bold text-white/80">Sản phẩm</h4>
          <ul className="mt-2 space-y-2">
            {(detail?.items || []).map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
              >
                <div className="font-semibold">
                  {displayProductName(item.productName)}
                </div>
                <div className="mt-0.5 text-xs text-white/45">
                  {item.skuCode && !item.skuCode.match(/^[0-9a-f-]{36}$/i)
                    ? `${item.skuCode} · `
                    : ""}
                  x{item.quantity} · {formatVnd(item.unitPrice)}
                  {item.discount > 0 ? ` · −${formatVnd(item.discount)}` : ""}
                </div>
              </li>
            ))}
            {!detail?.items?.length && !loading ? (
              <li className="text-sm text-white/45">Chưa có dòng hàng</li>
            ) : null}
          </ul>
        </section>

        <section>
          <h4 className="text-sm font-bold text-white/80">Lịch sử</h4>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
            {(detail?.history || []).map((h, i) => (
              <li key={`${h.at}-${i}`} className="text-xs text-white/50">
                <span className="text-white/75">{h.action || "event"}</span>
                {h.note ? ` — ${h.note}` : ""}
                <div className="text-white/35">
                  {h.at ? new Date(h.at).toLocaleString("vi-VN") : ""}
                </div>
              </li>
            ))}
            {!detail?.history?.length && !loading ? (
              <li className="text-sm text-white/45">Chưa có lịch sử</li>
            ) : null}
          </ul>
        </section>

        {fromApi ? (
          <section className="space-y-3 border-t border-white/10 pt-4">
            <h4 className="text-sm font-bold text-white/80">Thao tác</h4>

            {(current.state === OrderState.Confirmed ||
              current.state === OrderState.Pending ||
              current.state === OrderState.Shipped ||
              current.state === OrderState.Delivered) && (
              <label className="block text-xs text-white/50">
                Ghi chú
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#ed3b6b]/50"
                  placeholder="Lý do hủy / thu COD / ghi chú nội bộ…"
                />
              </label>
            )}

            {current.state === OrderState.Confirmed ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs text-white/50">
                  Đơn vị vận chuyển
                  <input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#ed3b6b]/50"
                  />
                </label>
                <label className="block text-xs text-white/50">
                  Mã vận đơn
                  <input
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#ed3b6b]/50"
                    placeholder="SHIP-001"
                  />
                </label>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {current.state === OrderState.Pending ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => storeApi.confirmOrder(current.id))}
                  className="rounded-xl bg-[#ed3b6b] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Xác nhận đơn
                </button>
              ) : null}

              {current.state === OrderState.Confirmed ? (
                <button
                  type="button"
                  disabled={busy || !carrier.trim() || !trackingCode.trim()}
                  onClick={() =>
                    run(() =>
                      storeApi.shipOrder(current.id, {
                        carrier: carrier.trim(),
                        trackingCode: trackingCode.trim(),
                      }),
                    )
                  }
                  className="rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Bàn giao vận chuyển
                </button>
              ) : null}

              {current.state === OrderState.Shipped ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => storeApi.deliverOrder(current.id))}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Đã giao khách
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        storeApi.receiveFailedDelivery(current.id, {
                          note: note.trim() || "Nhận hàng hoàn — giao thất bại",
                        }),
                      )
                    }
                    className="rounded-xl border border-orange-400/40 px-3 py-2 text-xs font-bold text-orange-200 disabled:opacity-50"
                  >
                    Nhận hàng hoàn
                  </button>
                </>
              ) : null}

              {current.state === OrderState.Delivered &&
              current.paymentState === CodState.Unpaid ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      storeApi.collectCod(current.id, {
                        note: note.trim() || "Đã thu đủ COD",
                      }),
                    )
                  }
                  className="rounded-xl bg-[#c6e600] px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                >
                  Thu COD
                </button>
              ) : null}

              {(current.state === OrderState.Pending ||
                current.state === OrderState.Confirmed) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      storeApi.cancelOrder(current.id, {
                        note: note.trim() || "Hủy bởi admin",
                      }),
                    )
                  }
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold text-white/80 disabled:opacity-50"
                >
                  Hủy đơn
                </button>
              )}

              <button
                type="button"
                disabled={busy || !note.trim()}
                onClick={() =>
                  run(() =>
                    storeApi.addOrderNote(current.id, { note: note.trim() }),
                  )
                }
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/70 disabled:opacity-50"
              >
                Thêm ghi chú nội bộ
              </button>
            </div>
          </section>
        ) : (
          <p className="text-sm text-amber-200/80">
            Đăng nhập tài khoản có quyền Orders.Manage để xử lý đơn qua API.
          </p>
        )}
      </div>
    </div>
  );
}
