"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { fetchCatalogProduct } from "@/lib/api";
import { getShoeById, shoes, type ShoeProduct } from "@/data/shoes";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();
  const [shoe, setShoe] = useState<ShoeProduct | null>(
    () => getShoeById(params.id) ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(0);
  const [added, setAdded] = useState(false);
  const [activeView, setActiveView] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCatalogProduct(params.id)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setShoe(result.shoe);
        } else if (!getShoeById(params.id)) {
          setShoe(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = getShoeById(params.id);
        if (fallback) setShoe(fallback);
        else setShoe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const gallery = useMemo(() => (shoe ? [...shoe.angles] : []), [shoe]);

  const related = useMemo(
    () => shoes.filter((item) => item.id !== params.id).slice(0, 3),
    [params.id],
  );

  useEffect(() => {
    setActiveView(0);
    setColor(0);
    setSize(0);
    setAdded(false);
  }, [params.id]);

  if (!loading && !shoe) notFound();
  if (!shoe) {
    return (
      <PageShell title="Product" subtitle="Đang tải…">
        <p className="text-white/60">Loading…</p>
      </PageShell>
    );
  }

  const onBuy = async () => {
    if (!isAuthenticated) {
      openLoginModal(
        "Đăng nhập để thêm sản phẩm vào giỏ hàng và đồng bộ với API.",
      );
      return;
    }

    setBusy(true);
    try {
      const fail = await addItem({
        shoe,
        color: shoe.colors[color],
        size: shoe.sizes[size],
        colorIndex: color,
        sizeIndex: size,
      });
      if (fail) {
        if (fail === "__NEED_LOGIN__" || /đăng nhập|SKU|login/i.test(fail)) {
          openLoginModal(
            "Đăng nhập để thêm sản phẩm vào giỏ hàng và đồng bộ với API.",
          );
        } else {
          window.alert(fail);
        }
        return;
      }
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      title={`${shoe.name} ${shoe.nameAccent}`}
      accent={shoe.accent}
      subtitle="Chi tiết sản phẩm — chọn màu, size rồi thêm vào giỏ hàng."
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="page-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[58%] z-0 h-16 w-[70%] -translate-x-1/2 -rotate-[28deg] opacity-80"
            style={{
              background: `linear-gradient(90deg, ${shoe.accent}, #7c5cff, #3b82f6)`,
            }}
          />
          <div className="relative z-10 mx-auto h-[280px] w-full max-w-[520px] sm:h-[360px]">
            {gallery.map((src, index) => (
              <div
                key={`${shoe.id}-main-${index}`}
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-out ${
                  index === activeView
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <Image
                  src={src}
                  alt={`${shoe.name} ${shoe.nameAccent}`}
                  width={640}
                  height={440}
                  priority
                  className="h-auto w-[88%] max-w-[520px] object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
                />
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-3 gap-3">
            {gallery.map((src, index) => {
              const isActive = index === activeView;
              return (
                <button
                  key={`${shoe.id}-thumb-${index}`}
                  type="button"
                  aria-label={`Xem ảnh ${index + 1}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveView(index)}
                  className={`flex h-24 cursor-pointer items-center justify-center rounded-xl border bg-black/30 transition-all ${
                    isActive
                      ? "border-white ring-2 ring-white/80"
                      : "border-white/10 hover:border-white/35"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    width={140}
                    height={100}
                    loading="eager"
                    className="h-auto w-[80%] object-contain mix-blend-lighten"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="page-card rounded-2xl p-6 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            {shoe.category}
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">
            {shoe.name}{" "}
            <span style={{ color: shoe.accent }}>{shoe.nameAccent}</span>
          </h2>
          <p className="mt-3 text-2xl font-semibold">{shoe.price}</p>
          {shoe.description ? (
            <p className="mt-3 text-sm text-white/60">{shoe.description}</p>
          ) : null}

          <div className="mt-8">
            <p className="text-sm font-semibold">Colors</p>
            <div className="mt-3 flex gap-3">
              {shoe.colors.map((value, index) => (
                <button
                  key={`${value}-${index}`}
                  type="button"
                  aria-pressed={color === index}
                  onClick={() => setColor(index)}
                  className={`h-5 w-5 cursor-pointer rounded-full ${
                    color === index
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#181820]"
                      : "ring-1 ring-white/20"
                  }`}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold">Size</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {shoe.sizes.map((value, index) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={size === index}
                  onClick={() => setSize(index)}
                  className={`h-10 min-w-10 cursor-pointer rounded-full border px-2 text-sm font-semibold ${
                    size === index
                      ? "border-white bg-white text-[#181820]"
                      : "border-white/35 text-white/75"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBuy}
              disabled={busy}
              className="cursor-pointer rounded-xl px-6 py-3 text-sm font-bold tracking-wide text-white transition-transform hover:scale-105 disabled:opacity-70"
              style={{
                background: added
                  ? "linear-gradient(90deg, #16a34a, #4ade80)"
                  : `linear-gradient(90deg, ${shoe.accent}, #ff6b95)`,
              }}
            >
              {added ? "ADDED TO CART" : busy ? "ADDING…" : "BUY"}
            </button>
            <Link
              href="/cart"
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition-colors hover:border-white/40 hover:text-white"
            >
              View cart
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="font-display text-2xl font-bold">Related</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.id}
              href={`/product/${item.id}`}
              className="page-card rounded-2xl p-4"
            >
              <div className="flex h-36 items-center justify-center">
                <Image
                  src={item.hero}
                  alt={`${item.name} ${item.nameAccent}`}
                  width={200}
                  height={140}
                  className="h-auto w-[75%] object-contain mix-blend-lighten"
                />
              </div>
              <p className="mt-2 font-semibold">
                {item.name}{" "}
                <span style={{ color: item.accent }}>{item.nameAccent}</span>
              </p>
              <p className="text-sm text-white/65">{item.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
