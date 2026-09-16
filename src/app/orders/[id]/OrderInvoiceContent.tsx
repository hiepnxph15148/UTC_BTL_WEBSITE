"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import {
  CodState,
  formatVnd,
  OrderState,
  ReturnKind,
  storeApi,
  type OrderDetailDto,
  type OrderLineDto,
} from "@/lib/api";
import { isNonEmpty } from "@/lib/validation";

function orderStateLabel(state: number) {
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

function paymentLabel(state: number) {
  switch (state) {
    case CodState.Unpaid:
      return "Chưa thu COD";
    case CodState.Collected:
      return "Đã thu COD";
    case CodState.PartiallyRefunded:
      return "Hoàn một phần";
    case CodState.Refunded:
      return "Đã hoàn";
    default:
      return String(state);
  }
}

type ReturnFormState = {
  kind: ReturnKind;
  quantity: string;
  reason: string;
  replacementSkuId: string;
};

export default function OrderInvoiceContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("invoice") === "1";
  const { isAuthenticated, hydrated } = useAuth();
  const [detail, setDetail] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returnForms, setReturnForms] = useState<
    Record<string, ReturnFormState>
  >({});
  const [returnBusy, setReturnBusy] = useState<string | null>(null);
  const [returnMsg, setReturnMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated || !params.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDetail(await storeApi.getMyOrder(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được hóa đơn");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, params.id]);

  useEffect(() => {
    if (!hydrated) return;
    void load();
  }, [hydrated, load]);

  useEffect(() => {
    if (!detail || detail.order.state !== OrderState.Delivered) return;
    const forms: Record<string, ReturnFormState> = {};
    for (const line of detail.items || []) {
      forms[line.id] = {
        kind: ReturnKind.Refund,
        quantity: "1",
        reason: "",
        replacementSkuId: "",
      };
    }
    setReturnForms(forms);
  }, [detail]);

  const submitReturn = async (line: OrderLineDto) => {
    if (!detail || returnBusy) return;
    const form = returnForms[line.id];
    if (!form) return;
    setReturnMsg(null);
    setError(null);

    const qty = Math.trunc(Number(form.quantity));
    if (!Number.isFinite(qty) || qty < 1) {
      setError("Số lượng đổi/trả tối thiểu là 1.");
      return;
    }
    if (qty > line.quantity) {
      setError(`Số lượng không được vượt quá ${line.quantity}.`);
      return;
    }
    if (!isNonEmpty(form.reason, 3)) {
      setError("Vui lòng nhập lý do (tối thiểu 3 ký tự).");
      return;
    }
    if (
      form.kind === ReturnKind.Exchange &&
      !isNonEmpty(form.replacementSkuId)
    ) {
      setError("Đổi hàng cần nhập UUID SKU thay thế.");
      return;
    }

    setReturnBusy(line.id);
    try {
      await storeApi.requestReturn(detail.order.id, {
        orderLineId: line.id,
        quantity: qty,
        kind: form.kind,
        replacementSkuId:
          form.kind === ReturnKind.Exchange
            ? form.replacementSkuId.trim()
            : null,
        reason: form.reason.trim(),
      });
      setReturnMsg(
        `Đã gửi yêu cầu đổi/trả cho ${line.skuCode || line.id.slice(0, 8)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gửi yêu cầu thất bại");
    } finally {
      setReturnBusy(null);
    }
  };

  if (!hydrated || loading) {
    return (
      <PageShell title="Hóa đơn" subtitle="Đang tải…">
        <p className="text-white/60">Loading…</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title="Hóa đơn" subtitle="Cần đăng nhập.">
        <div className="page-card rounded-2xl p-8 text-center">
          <Link
            href={`/login?next=/orders/${params.id}`}
            className="inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            Đăng nhập
          </Link>
        </div>
      </PageShell>
    );
  }

  if (error && !detail) {
    return (
      <PageShell title="Hóa đơn" subtitle="Không tìm thấy đơn.">
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-white/65">{error || "Đơn không tồn tại."}</p>
          <Link
            href="/orders"
            className="mt-5 inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold"
          >
            Về danh sách đơn
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell title="Hóa đơn" subtitle="Không tìm thấy đơn.">
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-white/65">Đơn không tồn tại.</p>
          <Link
            href="/orders"
            className="mt-5 inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold"
          >
            Về danh sách đơn
          </Link>
        </div>
      </PageShell>
    );
  }

  const { order, items, history } = detail;
  const addressLines = (order.addressSnapshot || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <PageShell
      title={justPlaced ? "Đặt hàng thành công" : "Hóa đơn"}
      accent="#c6e600"
      subtitle={
        justPlaced
          ? "Đơn COD đã tạo · đây là hóa đơn từ API"
          : `Đơn ${order.number || order.id.slice(0, 8)}`
      }
    >
      {justPlaced ? (
        <div className="mb-5 rounded-xl border border-[#c6e600]/30 bg-[#c6e600]/10 px-4 py-3 text-sm text-[#e8f7a0] print:hidden">
          Cảm ơn bạn đã mua hàng. Admin sẽ thấy đơn này trong Order List.
        </div>
      ) : null}

      {returnMsg ? (
        <p className="mb-3 text-sm text-[#c6e600] print:hidden">{returnMsg}</p>
      ) : null}
      {error ? (
        <p className="mb-3 text-sm text-amber-200/90 print:hidden">{error}</p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-nike-accent px-4 py-2.5 text-sm font-bold text-white"
        >
          In / lưu PDF
        </button>
        <Link
          href="/orders"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
        >
          Đơn của tôi
        </Link>
        <Link
          href="/returns"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
        >
          Returns
        </Link>
        <Link
          href="/collections"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
        >
          Tiếp tục mua
        </Link>
      </div>

      <article
        id="invoice"
        className="invoice-sheet page-card mx-auto max-w-3xl rounded-2xl p-6 sm:p-8"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
              Nike UTC · Hóa đơn bán hàng
            </p>
            <h2 className="mt-2 text-3xl font-extrabold">
              {order.number || order.id.slice(0, 8)}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {orderStateLabel(order.state)} · {paymentLabel(order.paymentState)}
            </p>
          </div>
          <div className="text-right text-sm text-white/55">
            <p>Thanh toán: COD</p>
            {order.carrier ? (
              <p className="mt-1">
                VC: {order.carrier} / {order.trackingCode || "—"}
              </p>
            ) : null}
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
              Người nhận
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-white/75">
              {addressLines.length ? (
                addressLines.map((line) => <li key={line}>{line}</li>)
              ) : (
                <li>—</li>
              )}
            </ul>
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
              Tổng quan
            </h3>
            <dl className="mt-2 space-y-1 text-sm text-white/75">
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-10">
                <dt>Tạm tính</dt>
                <dd>{formatVnd(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-10">
                <dt>Giảm giá</dt>
                <dd>−{formatVnd(order.discount)}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-10">
                <dt>Ship</dt>
                <dd>{formatVnd(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between gap-6 text-base font-extrabold text-white sm:justify-end sm:gap-10">
                <dt>Tổng thanh toán</dt>
                <dd className="text-nike-accent">{formatVnd(order.total)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
            Chi tiết sản phẩm
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase text-white/40">
                <tr>
                  <th className="pb-2 pr-3 font-semibold">Sản phẩm</th>
                  <th className="pb-2 pr-3 font-semibold">SKU</th>
                  <th className="pb-2 pr-3 font-semibold">SL</th>
                  <th className="pb-2 pr-3 font-semibold">Đơn giá</th>
                  <th className="pb-2 font-semibold">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(items || []).map((line) => (
                  <tr key={line.id} className="border-t border-white/10">
                    <td className="py-3 pr-3 font-semibold">
                      {line.productName || "—"}
                    </td>
                    <td className="py-3 pr-3 text-white/55">{line.skuCode}</td>
                    <td className="py-3 pr-3">{line.quantity}</td>
                    <td className="py-3 pr-3">{formatVnd(line.unitPrice)}</td>
                    <td className="py-3 font-semibold">
                      {formatVnd(
                        line.unitPrice * line.quantity - line.discount,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {order.state === OrderState.Delivered ? (
          <section className="mt-6 border-t border-white/10 pt-4 print:hidden">
            <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
              Yêu cầu đổi / trả
            </h3>
            <p className="mt-1 text-xs text-white/45">
              Trong 7 ngày sau giao · Exchange cần SKU thay thế cùng sản phẩm,
              cùng giá
            </p>
            <ul className="mt-4 space-y-4">
              {(items || []).map((line) => {
                const form = returnForms[line.id];
                if (!form) return null;
                return (
                  <li
                    key={`ret-${line.id}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="text-sm font-semibold">
                      {line.productName} · {line.skuCode} (x{line.quantity})
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="block text-xs text-white/50">
                        Loại
                        <select
                          value={form.kind}
                          onChange={(e) =>
                            setReturnForms((prev) => ({
                              ...prev,
                              [line.id]: {
                                ...form,
                                kind: Number(e.target.value) as ReturnKind,
                              },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
                        >
                          <option value={ReturnKind.Refund}>Hoàn tiền</option>
                          <option value={ReturnKind.Exchange}>Đổi hàng</option>
                        </select>
                      </label>
                      <label className="block text-xs text-white/50">
                        Số lượng
                        <input
                          type="number"
                          min={1}
                          max={line.quantity}
                          value={form.quantity}
                          onChange={(e) =>
                            setReturnForms((prev) => ({
                              ...prev,
                              [line.id]: { ...form, quantity: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
                        />
                      </label>
                      <label className="block text-xs text-white/50 sm:col-span-2">
                        Lý do
                        <input
                          required
                          minLength={3}
                          value={form.reason}
                          onChange={(e) =>
                            setReturnForms((prev) => ({
                              ...prev,
                              [line.id]: { ...form, reason: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
                          placeholder="Size không vừa…"
                        />
                      </label>
                      {form.kind === ReturnKind.Exchange ? (
                        <label className="block text-xs text-white/50 sm:col-span-2">
                          SKU thay thế (uuid)
                          <input
                            required
                            value={form.replacementSkuId}
                            onChange={(e) =>
                              setReturnForms((prev) => ({
                                ...prev,
                                [line.id]: {
                                  ...form,
                                  replacementSkuId: e.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
                            placeholder="UUID SKU cùng sản phẩm, cùng giá"
                          />
                        </label>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={returnBusy === line.id}
                      onClick={() => void submitReturn(line)}
                      className="mt-3 rounded-xl bg-nike-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {returnBusy === line.id ? "Đang gửi…" : "Gửi yêu cầu"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {history?.length ? (
          <section className="mt-6 border-t border-white/10 pt-4 print:hidden">
            <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
              Lịch sử đơn
            </h3>
            <ul className="mt-2 space-y-2 text-xs text-white/50">
              {history.map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <span className="text-white/75">{h.action}</span>
                  {h.note ? ` — ${h.note}` : ""}
                  <div>
                    {h.at ? new Date(h.at).toLocaleString("vi-VN") : ""}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-8 text-center text-xs text-white/35">
          Hóa đơn điện tử nội bộ · dữ liệu từ ShoeStore API · không thay thế hóa
          đơn GTGT
        </p>
      </article>
    </PageShell>
  );
}
