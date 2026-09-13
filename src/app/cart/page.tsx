"use client";

import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatVnd } from "@/lib/api";

export default function CartPage() {
  const {
    items,
    count,
    total,
    hydrated,
    syncing,
    updateQty,
    removeItem,
    clearCart,
    error,
  } = useCart();
  const { isAuthenticated, session } = useAuth();

  return (
    <PageShell
      title="Cart"
      accent="#ed3b6b"
      subtitle={
        isAuthenticated
          ? `Giỏ của ${session?.userName || "tài khoản"} · đồng bộ API`
          : "Chưa đăng nhập · giỏ tạm trên máy (sẽ gộp vào account khi login)"
      }
    >
      {!hydrated ? (
        <p className="text-white/60">Đang tải giỏ hàng...</p>
      ) : (
        <>
          {error ? (
            <p className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}
          {syncing ? (
            <p className="mb-3 text-xs text-white/45">Đang đồng bộ giỏ…</p>
          ) : null}
          {!isAuthenticated && items.length > 0 ? (
            <p className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
              <Link href="/login?next=/cart" className="font-semibold text-nike-accent underline">
                Đăng nhập
              </Link>{" "}
              để lưu giỏ theo tài khoản và thanh toán.
            </p>
          ) : null}
          {items.length === 0 ? (
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
                    {item.size ? `Size ${item.size} · ` : null}
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
                        onClick={() => void updateQty(item.id, item.qty - 1)}
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
                        onClick={() => void updateQty(item.id, item.qty + 1)}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeItem(item.id)}
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
                  {formatVnd(total)}
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
              onClick={() => void clearCart()}
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
        </>
      )}
    </PageShell>
  );
}
