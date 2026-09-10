"use client";

import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, count, total, hydrated, updateQty, removeItem, clearCart } =
    useCart();

  return (
    <PageShell
      title="Cart"
      accent="#ed3b6b"
      subtitle="Giỏ hàng được lưu trên trình duyệt (localStorage)."
    >
      {!hydrated ? (
        <p className="text-white/60">Đang tải giỏ hàng...</p>
      ) : items.length === 0 ? (
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-lg text-white/70">Giỏ hàng đang trống.</p>
          <Link
            href="/collections"
            className="mt-5 inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            Xem Collections
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="page-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-28 w-full items-center justify-center rounded-xl bg-black/30 sm:w-36">
                  <Image
                    src={item.hero}
                    alt={`${item.name} ${item.nameAccent}`}
                    width={160}
                    height={110}
                    className="h-auto w-[80%] object-contain mix-blend-lighten"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">
                    {item.name}{" "}
                    <span style={{ color: item.accent }}>{item.nameAccent}</span>
                  </h2>
                  <p className="mt-1 text-sm text-white/65">
                    Size {item.size} ·{" "}
                    <span
                      className="ml-1 inline-block h-3 w-3 rounded-full align-middle"
                      style={{ backgroundColor: item.color }}
                    />
                  </p>
                  <p className="mt-2 font-semibold">{item.price}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-full border border-white/15">
                      <button
                        type="button"
                        className="h-9 w-9 cursor-pointer text-lg"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        className="h-9 w-9 cursor-pointer text-lg"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="cursor-pointer text-sm text-white/55 underline hover:text-white"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="page-card h-fit rounded-2xl p-6">
            <h3 className="text-xl font-bold">Tóm tắt</h3>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <span>Số lượng</span>
                <span className="font-semibold text-white">{count}</span>
              </div>
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold text-white">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-nike-accent to-[#ff6b95] py-3 text-sm font-bold tracking-wide text-white"
            >
              Checkout
            </Link>
            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full cursor-pointer rounded-xl border border-white/15 py-3 text-sm text-white/70 hover:text-white"
            >
              Xóa giỏ hàng
            </button>
            <Link
              href="/collections"
              className="mt-4 block text-center text-sm text-white/60 underline hover:text-white"
            >
              Tiếp tục mua sắm
            </Link>
          </aside>
        </div>
      )}
    </PageShell>
  );
}
