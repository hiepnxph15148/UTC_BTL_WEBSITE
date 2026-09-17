"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { formatVnd, storeApi, type QuoteDto, humanizeStoreError } from "@/lib/api";
import { displayProductName } from "@/lib/format-display";
import {
  ADDRESS_MIN_LENGTH,
  addressError,
  formatIssue,
  nameError,
  phoneError,
} from "@/lib/validation";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated: authHydrated } = useAuth();
  const { items, count, total, hydrated, clearCart, error: cartError } =
    useCart();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [addressId, setAddressId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteDto | null>(null);

  const displayTotal = quote?.total ?? total;
  const grandLabel = useMemo(() => formatVnd(displayTotal), [displayTotal]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const list = await storeApi.getAddresses();
        const preferred = list.find((a) => a.isDefault) || list[0];
        if (!preferred) return;
        setAddressId(preferred.id);
        setName(preferred.recipient || "");
        setPhone(preferred.phone || "");
        setAddress(preferred.fullAddress || "");
      } catch {
        // ignore â€” user cÃ³ thá»ƒ nháº­p má»›i
      }
    })();
  }, [isAuthenticated]);

  const ensureAddress = useCallback(async () => {
    const nameMsg = formatIssue(t, nameError(name));
    if (nameMsg) throw new Error(nameMsg);
    const phoneMsg = formatIssue(t, phoneError(phone));
    if (phoneMsg) throw new Error(phoneMsg);
    const addressMsg = formatIssue(t, addressError(address));
    if (addressMsg) throw new Error(addressMsg);
    if (addressId) return addressId;

    const created = await storeApi.createAddress({
      recipient: name.trim(),
      phone: phone.trim(),
      fullAddress: address.trim(),
      isDefault: true,
    });
    setAddressId(created.id);
    return created.id;
  }, [name, phone, address, addressId, t]);

  const applyQuote = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    if (!items.length || quoting) return;

    setQuoting(true);
    setError(null);
    try {
      const id = await ensureAddress();
      const next = await storeApi.quote({
        addressId: id,
        coupon: coupon.trim() || null,
      });
      setQuote(next);
    } catch (err) {
      setQuote(null);
      setError(
        humanizeStoreError(
          err instanceof Error ? err.message : t("checkout.couponFail"),
        ),
      );
    } finally {
      setQuoting(false);
    }
  };

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length || paying) return;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    setPaying(true);
    setError(null);
    try {
      const id = addressId || (await ensureAddress());
      const latest = await storeApi.quote({
        addressId: id,
        coupon: coupon.trim() || null,
      });
      setQuote(latest);

      const idempotencyKey = `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const order = await storeApi.placeOrder({
        addressId: id,
        coupon: coupon.trim() || null,
        expectedTotal: latest.total,
        idempotencyKey,
      });

      await clearCart();
      router.push(`/orders/${order.order.id}?invoice=1`);
    } catch (err) {
      setError(
        humanizeStoreError(
          err instanceof Error ? err.message : t("checkout.orderFail"),
        ),
      );
    } finally {
      setPaying(false);
    }
  };

  if (!hydrated || !authHydrated) {
    return (
      <PageShell title={t("checkout.title")} subtitle={t("checkout.loadingSub")}>
        <p className="text-white/60">{t("common.loading")}</p>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell title={t("checkout.title")} subtitle={t("checkout.emptySub")}>
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-lg text-white/70">{t("checkout.empty")}</p>
          <Link
            href="/collections"
            className="mt-5 inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            {t("cart.viewCollections")}
          </Link>
          <Link
            href="/orders"
            className="mt-3 block text-sm text-white/55 underline hover:text-white"
          >
            {t("checkout.viewOrders")}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("checkout.title")}
      accent="#ed3b6b"
      subtitle={t("checkout.subtitle")}
    >
      {!isAuthenticated ? (
        <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {t("checkout.needLogin")}{" "}
          <Link href="/login?next=/checkout" className="font-semibold underline">
            {t("common.login")}
          </Link>
        </div>
      ) : null}

      {(error || cartError) && (
        <div className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
          {error || cartError}
        </div>
      )}

      <form
        onSubmit={onPay}
        className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
      >
        <div className="space-y-5">
          <section className="page-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-bold">{t("checkout.shipInfo")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {t("checkout.fullName")}
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setAddressId(null);
                    setQuote(null);
                  }}
                  placeholder="Nguyen Van A"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {t("checkout.phone")}
                </span>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setAddressId(null);
                    setQuote(null);
                  }}
                  placeholder={t("validation.phoneExample")}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {t("checkout.address")}
                </span>
                <input
                  required
                  minLength={ADDRESS_MIN_LENGTH}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setAddressId(null);
                    setQuote(null);
                  }}
                  placeholder={t("checkout.addressPh")}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                />
              </label>
              <div className="sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {t("checkout.coupon")}
                </span>
                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      setQuote(null);
                    }}
                    placeholder="WELCOME10"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                  />
                  <button
                    type="button"
                    disabled={quoting || !isAuthenticated}
                    onClick={() => void applyQuote()}
                    className="shrink-0 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/85 hover:bg-white/5 disabled:opacity-50"
                  >
                    {quoting ? t("checkout.quoting") : t("checkout.apply")}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/55">
              {t("checkout.codNote")}
            </p>
          </section>
        </div>

        <aside className="page-card h-fit rounded-2xl p-5 sm:p-6">
          <h2 className="text-xl font-bold">{t("checkout.order")}</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {quote?.items?.length
              ? quote.items.map((line) => {
                  const cartItem = items.find((i) => i.skuId === line.skuId);
                  const cartTitle = cartItem
                    ? `${cartItem.name} ${cartItem.nameAccent}`.trim()
                    : null;
                  return (
                  <div
                    key={line.skuId}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {displayProductName(line.productName, cartTitle)}
                      </p>
                      <p className="text-xs text-white/50">
                        x{line.quantity}
                        {line.discount > 0
                          ? ` · −${formatVnd(line.discount)}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatVnd(
                        line.unitPrice * line.quantity - line.discount,
                      )}
                    </p>
                  </div>
                  );
                })
              : items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-black/30">
                      <Image
                        src={item.hero}
                        alt=""
                        width={64}
                        height={48}
                        className="h-auto w-[80%] object-contain mix-blend-lighten"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {item.name} {item.nameAccent}
                      </p>
                      <p className="text-xs text-white/50">
                        {item.size ? `Size ${item.size} · ` : ""}x{item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatVnd(item.priceValue * item.qty)}
                    </p>
                  </div>
                ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-white/65">
            <div className="flex justify-between">
              <span>{t("checkout.subtotal", { count })}</span>
              <span className="font-semibold text-white">
                {formatVnd(quote?.subtotal ?? total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("checkout.discount")}</span>
              <span className="font-semibold text-[#c6e600]">
                {quote
                  ? quote.discount > 0
                    ? `−${formatVnd(quote.discount)}`
                    : formatVnd(0)
                  : t("checkout.applyToSee")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("checkout.ship")}</span>
              <span className="font-semibold text-white">
                {quote ? formatVnd(quote.shippingFee) : t("checkout.shipPreview")}
              </span>
            </div>
            <div className="flex justify-between text-base text-white">
              <span className="font-bold">{t("checkout.total")}</span>
              <span className="font-extrabold text-nike-accent">{grandLabel}</span>
            </div>
            {quote && coupon.trim() && quote.discountId ? (
              <p className="text-xs text-[#c6e600]">
                {t("checkout.applied", { code: coupon.trim().toUpperCase() })}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={paying}
            className="mt-6 w-full cursor-pointer rounded-xl bg-gradient-to-r from-nike-accent to-[#ff6b95] py-3.5 text-sm font-bold tracking-wide text-white disabled:cursor-wait disabled:opacity-70"
          >
            {paying
              ? t("common.processing")
              : isAuthenticated
                ? t("checkout.place")
                : t("checkout.loginToOrder")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="mt-3 w-full cursor-pointer rounded-xl border border-white/15 py-3 text-sm text-white/70 hover:text-white"
          >
            {t("checkout.backCart")}
          </button>
        </aside>
      </form>
    </PageShell>
  );
}
