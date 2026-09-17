"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import {
  PRODUCT_IMAGE_ACCEPT,
  validateProductImageFile,
} from "@/lib/product-image";

export default function CreateProductPage() {
  const router = useRouter();
  const { categories, addProduct, fromApi } = useAdmin();
  const [name, setName] = useState("");
  const [nameAccent, setNameAccent] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [accent, setAccent] = useState("#ed3b6b");
  const [stock, setStock] = useState("20");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!categories.length) return;
    if (!category || !categories.some((c) => c.id === category)) {
      setCategory(categories[0].id);
      setAccent(categories[0].accent);
    }
  }, [categories, category]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const onPickImage = (file: File | null) => {
    setError(null);
    if (!file) {
      setImageFile(null);
      return;
    }
    const issue = validateProductImageFile(file);
    if (issue) {
      setImageFile(null);
      setError(issue);
      return;
    }
    setImageFile(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    if (imageFile) {
      const issue = validateProductImageFile(imageFile);
      if (issue) {
        setError(issue);
        return;
      }
    }

    const cat = categories.find((c) => c.id === category);
    setBusy(true);
    setError(null);
    try {
      await addProduct({
        name: name.trim(),
        nameAccent: nameAccent.trim() || "New",
        price:
          price.trim() === ""
            ? "—"
            : price.startsWith("$") || price.includes("₫")
              ? price
              : `$${price}`,
        category: cat?.label || category || "lifestyle",
        categoryId: category || undefined,
        accent: accent || cat?.accent || "#ed3b6b",
        hero: previewUrl || encodeURI("/item/image 1.png"),
        colors: ["#ffffff", "#1a1a1a", accent, "#3b82f6"],
        sizes: [38, 39, 40, 41],
        stock: Number(stock) || 0,
        description: description.trim() || null,
        imageFile,
      });

      setDone(true);
      setTimeout(() => router.push("/admin/products"), 700);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tạo được sản phẩm",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Create Product</h1>
        <p className="mt-1 text-sm text-white/55">
          {fromApi
            ? "Tạo trên API — sản phẩm mới hiện ngay trong All Products"
            : "Chưa kết nối API — lưu localStorage (seed demo)"}
        </p>
      </div>

      <form onSubmit={onSubmit} className="admin-card space-y-4 p-6">
        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

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
              Giá (hiển thị)
            </span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="199.00"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Mô tả
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Mô tả ngắn…"
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Danh mục
            </span>
            <select
              required
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const cat = categories.find((c) => c.id === e.target.value);
                if (cat) setAccent(cat.accent);
              }}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
            >
              {categories.length === 0 ? (
                <option value="">Chưa có danh mục</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))
              )}
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
              Ảnh sản phẩm
            </span>
            <input
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <span className="text-[11px] text-white/40">
              JPEG / PNG / WebP · tối đa 5 MB
            </span>
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

        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Preview"
            className="mx-auto h-40 w-40 rounded-2xl border border-white/10 bg-black/40 object-contain p-2"
          />
        ) : null}

        <button
          type="submit"
          disabled={busy || done || !categories.length}
          className="w-full rounded-xl bg-[#ed3b6b] py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)] transition hover:brightness-110 disabled:opacity-50"
        >
          {done
            ? "Đã tạo — chuyển sang danh sách…"
            : busy
              ? "Đang tạo…"
              : "Tạo sản phẩm"}
        </button>
      </form>
    </div>
  );
}
