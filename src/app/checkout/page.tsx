"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { useCart } from "@/context/CartContext";
import { appendOrder } from "@/lib/orders";

const methods = [
  {
    id: "visa",
    label: "Visa / Mastercard",
    desc: "Thanh toán thẻ quốc tế",
  },
  {
    id: "momo",
    label: "MoMo",
    desc: "Ví điện tử MoMo",
  },
  {
    id: "paypal",
    label: "PayPal",
    desc: "Thanh toán PayPal",
  },
  {
    id: "cash",
    label: "Cash on Delivery",
    desc: "Thanh toán khi nhận hàng",
  },
] as const;

type MethodId = (typeof methods)[number]["id"];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, total, hydrated, clearCart } = useCart();
  const [method, setMethod] = useState<MethodId>("visa");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState<{ orderId: string } | null>(null);

  const shipping = total > 200 ? 0 : 8;
  const grandTotal = useMemo(() => total + shipping, [total, shipping]);

  const paymentLabel =
    methods.find((m) => m.id === method)?.label.split(" / ")[0] ?? "Visa";

  const onPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length || paying) return;
    if (!name.trim() || !phone.trim() || !address.trim()) return;
    if (method === "visa" && (!card.trim() || !expiry.trim() || !cvv.trim())) {
      return;
    }

    setPaying(true);
    const orderId = `#${25400 + Math.floor(Math.random() * 900)}`;

    window.setTimeout(() => {
      appendOrder({
        id: orderId,
        product:
          items.length === 1
            ? `${items[0].name} ${items[0].nameAccent}`
            : `${items[0].name} ${items[0].nameAccent} +${items.length - 1}`,
        date: new Date().toISOString().slice(0, 10),
        payment: paymentLabel,
        customer: name.trim(),
        status: "Processing",
        amount: Number(grandTotal.toFixed(2)),
        items: items.map((item) => ({
          name: `${item.name} ${item.nameAccent}`,
          qty: item.qty,
          size: item.size,
          price: item.priceValue,
        })),
      });

      clearCart();
      setPaying(false);
      setDone({ orderId });
    }, 900);
  };

  if (!hydrated) {
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
        subtitle="Đơn hàng đã được ghi nhận."
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
            <span className="font-semibold text-white">{done.orderId}</span>
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
      subtitle="Checkout · chọn phương thức thanh toán và xác nhận đơn."
    >
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
            </div>
          </section>

          <section className="page-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-bold">
              Phương thức thanh toán
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {methods.map((item) => {
                const active = method === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-nike-accent bg-nike-accent/15 shadow-[0_0_24px_rgba(237,59,107,0.2)]"
                        : "border-white/10 bg-black/20 hover:border-white/25"
                    }`}
                  >
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-white/55">{item.desc}</p>
                  </button>
                );
              })}
            </div>

            {method === "visa" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <label className="block space-y-1.5 sm:col-span-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Số thẻ
                  </span>
                  <input
                    required
                    value={card}
                    onChange={(e) => setCard(e.target.value)}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                  />
                </label>
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Hết hạn
                  </span>
                  <input
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    CVV
                  </span>
                  <input
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-nike-accent focus:ring-2"
                  />
                </label>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60">
                Bạn sẽ xác nhận thanh toán bằng{" "}
                <span className="font-semibold text-white">{paymentLabel}</span>{" "}
                sau khi đặt đơn (demo).
              </p>
            )}
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
                    Size {item.size} · x{item.qty}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  ${(item.priceValue * item.qty).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-white/65">
            <div className="flex justify-between">
              <span>Sản phẩm ({count})</span>
              <span className="font-semibold text-white">
                ${total.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ship</span>
              <span className="font-semibold text-white">
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-base text-white">
              <span className="font-bold">Tổng</span>
              <span className="font-extrabold text-nike-accent">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={paying}
            className="mt-6 w-full cursor-pointer rounded-xl bg-gradient-to-r from-nike-accent to-[#ff6b95] py-3.5 text-sm font-bold tracking-wide text-white disabled:cursor-wait disabled:opacity-70"
          >
            {paying ? "Đang xử lý…" : `Pay $${grandTotal.toFixed(2)}`}
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
