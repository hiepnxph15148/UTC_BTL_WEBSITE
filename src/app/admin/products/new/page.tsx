"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";

const itemOptions = Array.from({ length: 15 }, (_, i) => i + 1);

export default function CreateProductPage() {
  const router = useRouter();
  const { categories, addProduct } = useAdmin();
  const [name, setName] = useState("");
  const [nameAccent, setNameAccent] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("lifestyle");
  const [accent, setAccent] = useState("#ed3b6b");
  const [stock, setStock] = useState("20");
  const [itemNo, setItemNo] = useState("1");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (categories[0] && !categories.some((c) => c.id === category)) {
      setCategory(categories[0].id);
      setAccent(categories[0].accent);
    }
  }, [categories, category]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    const n = Number(itemNo) || 1;
    const hero = encodeURI(`/item/image ${n}.png`);
    const cat = categories.find((c) => c.id === category);

    addProduct({
      name: name.trim(),
      nameAccent: nameAccent.trim() || "New",
      price: price.startsWith("$") ? price : `$${price}`,
      category: category || "lifestyle",
      accent: accent || cat?.accent || "#ed3b6b",
      hero,
      colors: ["#ffffff", "#1a1a1a", accent, "#3b82f6"],
      sizes: [6, 7, 8, 9],
      stock: Number(stock) || 0,
    });

    setDone(true);
    setTimeout(() => router.push("/admin/products"), 700);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Create Product</h1>
        <p className="mt-1 text-sm text-white/55">
          Tạm lưu localStorage — ảnh dùng từ thư mục /item
        </p>
      </div>

      <form onSubmit={onSubmit} className="admin-card space-y-4 p-6">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Tên sản phẩm
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nike Air Max"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Accent name
            </span>
            <input
              value={nameAccent}
              onChange={(e) => setNameAccent(e.target.value)}
              placeholder="Pro"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Giá
            </span>
            <input
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="199.00"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Danh mục
            </span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const cat = categories.find((c) => c.id === e.target.value);
                if (cat) setAccent(cat.accent);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Stock
            </span>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Ảnh /item (1–15)
            </span>
            <select
              value={itemNo}
              onChange={(e) => setItemNo(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
            >
              {itemOptions.map((n) => (
                <option key={n} value={n}>
                  image {n}.png
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Accent color
            </span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-1"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#ed3b6b] py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)] transition hover:brightness-110"
        >
          {done ? "Đã tạo — chuyển sang danh sách…" : "Tạo sản phẩm"}
        </button>
      </form>
    </div>
  );
}
