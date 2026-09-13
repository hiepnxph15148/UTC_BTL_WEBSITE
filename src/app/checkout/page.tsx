"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatVnd, storeApi } from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated: authHydrated } = useAuth();
  const { items, count, total, hydrated, clearCart, error: cartError } =
    useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderId: string; number: string } | null>(
    null,
  );
  const [quoteTotal, setQuoteTotal] = useState<number | null>(null);
  const [shippingFee, setShippingFee] = useState<number | null>(null);

  const displayTotal = quoteTotal ?? total;
  const displayShipping = shippingFee ?? 0;

  const grandLabel = useMemo(() => formatVnd(displayTotal), [displayTotal]);

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length || paying) return;
    if (!name.trim() || !phone.trim() || !address.trim()) return;

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    setPaying(true);
    setError(null);
    try {
      const created = await storeApi.createAddress({
        recipient: name.trim(),
        phone: phone.trim(),
        fullAddress: address.trim(),
        isDefault: true,
      });

      const quote = await storeApi.quote({
        addressId: created.id,
        coupon: coupon.trim() || null,
      });
      setQuoteTotal(quote.total);
      setShippingFee(quote.shippingFee);

      const idempotencyKey = `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const order = await storeApi.placeOrder({
        addressId: created.id,
        coupon: coupon.trim() || null,
        expectedTotal: quote.total,
        idempotencyKey,
      });

      await clearCart();
      setDone({
        orderId: order.order.id,
        number: order.order.number || order.order.id.slice(0, 8),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt hàng thất bại");
    } finally {
      setPaying(false);
    }
  };

  if (!hydrated || !authHydrated) {
    return (
      <PageShell title="Payment" subtitle="Đang tải thông tin thanh toán...">
        <p className="text-white/60">Loading…</p>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell
        title="Payment success"
        accent="#c6e600"
        subtitle="Đơn COD đã được tạo trên ShoeStore API."
      >
        <div className="page-card mx-auto max-w-lg rounded-2xl p-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c6e600]">
            Success
          </p>
          <h2 className="mt-3 text-3xl font-extrabold">
            Cảm ơn bạn đã mua hàng
          </h2>
          <p className="mt-3 text-white/65">
            Mã đơn:{" "}
            <span className="font-semibold text-white">{done.number}</span>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/collections"
              className="rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
            >
              Tiếp tục mua
            </Link>
            <Link
              href="/cart"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 hover:text-white"
            >
              Về giỏ hàng
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell title="Payment" subtitle="Chưa có sản phẩm để thanh toán.">
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-lg text-white/70">Giỏ hàng đang trống.</p>
          <Link
            href="/collections"
            className="mt-5 inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            Xem Collections
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Payment"
      accent="#ed3b6b"
      subtitle="Checkout COD · quote + place-order qua ShoeStore API."
    >
      {!isAuthenticated ? (
        <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Bạn chưa đăng nhập. Đặt hàng cần tài khoản API —{" "}
          <Link href="/login?next=/checkout" className="font-semibold underline">
            Đăng nhập
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
            <h2 className="text-xl font-bold">Thông tin giao hàng</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Họ tên
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyen Van A"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Số điện thoại
                </span>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Địa chỉ
                </span>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, quận/huyện, thành phố"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  Mã giảm giá (tuỳ chọn)
                </span>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="WELCOME"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                />
              </label>
            </div>
            <p className="mt-4 text-sm text-white/55">
              Backend giai đoạn 1 chỉ hỗ trợ COD. Phí ship do API tính (30.000đ,
              miễn ship từ 1.000.000đ).
            </p>
          </section>
        </div>

        <aside className="page-card h-fit rounded-2xl p-5 sm:p-6">
          <h2 className="text-xl font-bold">Đơn hàng</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
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
              <span>Sản phẩm ({count})</span>
              <span className="font-semibold text-white">
                {formatVnd(total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ship (API)</span>
              <span className="font-semibold text-white">
                {shippingFee === null ? "Khi đặt đơn" : formatVnd(displayShipping)}
              </span>
            </div>
            <div className="flex justify-between text-base text-white">
              <span className="font-bold">Tổng</span>
              <span className="font-extrabold text-nike-accent">{grandLabel}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={paying}
            className="mt-6 w-full cursor-pointer rounded-xl bg-gradient-to-r from-nike-accent to-[#ff6b95] py-3.5 text-sm font-bold tracking-wide text-white disabled:cursor-wait disabled:opacity-70"
          >
            {paying
              ? "Đang xử lý…"
              : isAuthenticated
                ? "Đặt hàng COD"
                : "Đăng nhập để đặt hàng"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="mt-3 w-full cursor-pointer rounded-xl border border-white/15 py-3 text-sm text-white/70 hover:text-white"
          >
            ← Quay lại giỏ hàng
          </button>
        </aside>
      </form>
    </PageShell>
  );
}
