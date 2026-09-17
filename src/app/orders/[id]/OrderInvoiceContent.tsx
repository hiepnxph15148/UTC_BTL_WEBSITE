"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import {
  CodState,
  formatVnd,
  OrderState,
  ReturnKind,
  storeApi,
  type OrderDetailDto,
  type OrderLineDto,
} from "@/lib/api";
import type { MessageKey } from "@/i18n/messages";
import {
  displayOrderNumber,
  displayProductName,
  formatAddressLines,
  looksLikeUuid,
} from "@/lib/format-display";
import { REASON_MIN_LENGTH, isNonEmpty } from "@/lib/validation";

function orderStateKey(state: number): MessageKey {
  switch (state) {
    case OrderState.Pending:
      return "orders.pending";
    case OrderState.Confirmed:
      return "orders.confirmed";
    case OrderState.Shipped:
      return "orders.shipped";
    case OrderState.Delivered:
      return "orders.delivered";
    case OrderState.Cancelled:
      return "orders.cancelled";
    default:
      return "orders.title";
  }
}

function paymentKey(state: number): MessageKey {
  switch (state) {
    case CodState.Unpaid:
      return "pay.unpaid";
    case CodState.Collected:
      return "pay.collected";
    case CodState.PartiallyRefunded:
      return "pay.partial";
    case CodState.Refunded:
      return "pay.refunded";
    default:
      return "invoice.title";
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
  const { t, dateLocale } = useLocale();
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
      setError(err instanceof Error ? err.message : t("invoice.loadFail"));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, params.id, t]);

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
      setError(t("validation.returnQtyMin"));
      return;
    }
    if (qty > line.quantity) {
      setError(t("validation.returnQtyMax", { max: line.quantity }));
      return;
    }
    if (!isNonEmpty(form.reason, REASON_MIN_LENGTH)) {
      setError(t("validation.returnReasonMin", { min: REASON_MIN_LENGTH }));
      return;
    }
    if (
      form.kind === ReturnKind.Exchange &&
      !isNonEmpty(form.replacementSkuId)
    ) {
      setError(t("validation.exchangeSkuRequired"));
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
        t("invoice.sentReturn", {
          code: displayProductName(line.productName, line.skuCode),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("invoice.sendFail"));
    } finally {
      setReturnBusy(null);
    }
  };

  if (!hydrated || loading) {
    return (
      <PageShell title={t("invoice.title")} subtitle={t("common.loading")}>
        <p className="text-white/60">{t("common.loading")}</p>
      </PageShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell title={t("invoice.title")} subtitle={t("invoice.needLogin")}>
        <div className="page-card rounded-2xl p-8 text-center">
          <Link
            href={`/login?next=/orders/${params.id}`}
            className="inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            {t("common.login")}
          </Link>
        </div>
      </PageShell>
    );
  }

  if (error && !detail) {
    return (
      <PageShell title={t("invoice.title")} subtitle={t("invoice.notFound")}>
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-white/65">{error || t("invoice.missing")}</p>
          <Link
            href="/orders"
            className="mt-5 inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold"
          >
            {t("invoice.backList")}
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!detail) {
    return (
      <PageShell title={t("invoice.title")} subtitle={t("invoice.notFound")}>
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-white/65">{t("invoice.missing")}</p>
          <Link
            href="/orders"
            className="mt-5 inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold"
          >
            {t("invoice.backList")}
          </Link>
        </div>
      </PageShell>
    );
  }

  const { order, items, history } = detail;
  const addressLines = formatAddressLines(order.addressSnapshot);

  return (
    <PageShell
      title={justPlaced ? t("invoice.success") : t("invoice.title")}
      accent="#c6e600"
      subtitle={
        justPlaced
          ? t("invoice.successSub")
          : t("invoice.orderSub", {
              number: displayOrderNumber(order.number, order.id),
            })
      }
    >
      {justPlaced ? (
        <div className="mb-5 rounded-xl border border-[#c6e600]/30 bg-[#c6e600]/10 px-4 py-3 text-sm text-[#e8f7a0] print:hidden">
          {t("invoice.thanks")}
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
          {t("invoice.print")}
        </button>
        <Link
          href="/orders"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
        >
          {t("invoice.myOrders")}
        </Link>
        <Link
          href="/returns"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
        >
          {t("returns.title")}
        </Link>
        <Link
          href="/collections"
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/75 hover:text-white"
        >
          {t("invoice.continue")}
        </Link>
      </div>

      <article
        id="invoice"
        className="invoice-sheet page-card mx-auto max-w-3xl rounded-2xl p-6 sm:p-8"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
              {t("invoice.heading")}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold">
              {displayOrderNumber(order.number, order.id)}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {t(orderStateKey(order.state))} · {t(paymentKey(order.paymentState))}
            </p>
          </div>
          <div className="text-right text-sm text-white/55">
            <p>{t("invoice.payCod")}</p>
            {order.carrier ? (
              <p className="mt-1">
                {t("invoice.carrier", {
                  carrier: order.carrier,
                  tracking: order.trackingCode || "—",
                })}
              </p>
            ) : null}
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
              {t("invoice.recipient")}
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
              {t("invoice.overview")}
            </h3>
            <dl className="mt-2 space-y-1 text-sm text-white/75">
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-10">
                <dt>{t("invoice.subtotal")}</dt>
                <dd>{formatVnd(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-10">
                <dt>{t("invoice.discount")}</dt>
                <dd>−{formatVnd(order.discount)}</dd>
              </div>
              <div className="flex justify-between gap-6 sm:justify-end sm:gap-10">
                <dt>{t("invoice.ship")}</dt>
                <dd>{formatVnd(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between gap-6 text-base font-extrabold text-white sm:justify-end sm:gap-10">
                <dt>{t("invoice.grand")}</dt>
                <dd className="text-nike-accent">{formatVnd(order.total)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
            {t("invoice.items")}
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase text-white/40">
                <tr>
                  <th className="pb-2 pr-3 font-semibold">{t("invoice.colProduct")}</th>
                  <th className="pb-2 pr-3 font-semibold">{t("invoice.colSku")}</th>
                  <th className="pb-2 pr-3 font-semibold">{t("invoice.colQty")}</th>
                  <th className="pb-2 pr-3 font-semibold">{t("invoice.colPrice")}</th>
                  <th className="pb-2 font-semibold">{t("invoice.colLine")}</th>
                </tr>
              </thead>
              <tbody>
                {(items || []).map((line) => (
                  <tr key={line.id} className="border-t border-white/10">
                    <td className="py-3 pr-3 font-semibold">
                      {displayProductName(line.productName)}
                    </td>
                    <td className="py-3 pr-3 text-white/55">
                      {line.skuCode && !looksLikeUuid(line.skuCode)
                        ? line.skuCode
                        : "—"}
                    </td>
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
              {t("invoice.returnTitle")}
            </h3>
            <p className="mt-1 text-xs text-white/45">
              {t("invoice.returnHint")}
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
                      {displayProductName(line.productName)}
                      {line.skuCode && !looksLikeUuid(line.skuCode)
                        ? ` · ${line.skuCode}`
                        : ""}{" "}
                      (x{line.quantity})
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="block text-xs text-white/50">
                        {t("invoice.kind")}
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
                          <option value={ReturnKind.Refund}>{t("returns.refund")}</option>
                          <option value={ReturnKind.Exchange}>{t("returns.exchange")}</option>
                        </select>
                      </label>
                      <label className="block text-xs text-white/50">
                        {t("invoice.qty")}
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
                        {t("invoice.reason")}
                        <input
                          required
                          minLength={REASON_MIN_LENGTH}
                          value={form.reason}
                          onChange={(e) =>
                            setReturnForms((prev) => ({
                              ...prev,
                              [line.id]: { ...form, reason: e.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
                          placeholder={t("invoice.reasonPh")}
                        />
                      </label>
                      {form.kind === ReturnKind.Exchange ? (
                        <label className="block text-xs text-white/50 sm:col-span-2">
                          {t("invoice.replaceSku")}
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
                            placeholder={t("invoice.replacePh")}
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
                      {returnBusy === line.id
                        ? t("invoice.sending")
                        : t("invoice.sendReq")}
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
              {t("invoice.history")}
            </h3>
            <ul className="mt-2 space-y-2 text-xs text-white/50">
              {history.map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <span className="text-white/75">{h.action}</span>
                  {h.note ? ` — ${h.note}` : ""}
                  <div>
                    {h.at ? new Date(h.at).toLocaleString(dateLocale) : ""}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-8 text-center text-xs text-white/35">
          {t("invoice.footer")}
        </p>
      </article>
    </PageShell>
  );
}
