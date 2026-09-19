"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useLocale } from "@/context/LocaleContext";
import { LookupKind, storeApi, type LookupDto } from "@/lib/api";
import {
  PRODUCT_IMAGE_ACCEPT,
  validateProductImageFile,
} from "@/lib/product-image";

const LOCAL_COLORS = [
  { id: "#ffffff", name: "Trắng", hex: "#ffffff" },
  { id: "#1a1a1a", name: "Đen", hex: "#1a1a1a" },
  { id: "#ed3b6b", name: "Hồng", hex: "#ed3b6b" },
  { id: "#3b82f6", name: "Xanh", hex: "#3b82f6" },
];

const LOCAL_SIZES = [38, 39, 40, 41, 42, 43];

function parsePriceNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function CreateProductPage() {
  const router = useRouter();
  const { categories, addProduct, fromApi } = useAdmin();
  const { t } = useLocale();
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

  const [colorLookups, setColorLookups] = useState<LookupDto[]>([]);
  const [sizeLookups, setSizeLookups] = useState<LookupDto[]>([]);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [quickColor, setQuickColor] = useState("");
  const [quickSize, setQuickSize] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);

  const loadLookups = useCallback(async () => {
    if (!fromApi) return;
    try {
      const [colors, sizes] = await Promise.all([
        storeApi.getLookups(LookupKind.Color),
        storeApi.getLookups(LookupKind.Size),
      ]);
      const activeColors = colors.filter(
        (c) => Number(c.kind) === LookupKind.Color && c.active !== false,
      );
      const activeSizes = sizes.filter(
        (s) => Number(s.kind) === LookupKind.Size && s.active !== false,
      );
      setColorLookups(activeColors);
      setSizeLookups(activeSizes);
      setSelectedColorIds((prev) =>
        prev.length ? prev.filter((id) => activeColors.some((c) => c.id === id)) : [],
      );
      setSelectedSizeIds((prev) =>
        prev.length ? prev.filter((id) => activeSizes.some((s) => s.id === id)) : [],
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được màu/size");
    }
  }, [fromApi]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

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

  // Demo local: mặc định chọn sẵn
  useEffect(() => {
    if (fromApi) return;
    setSelectedColorIds(LOCAL_COLORS.map((c) => c.id));
    setSelectedSizeIds(LOCAL_SIZES.map(String));
  }, [fromApi]);

  const skuPreviewCount = useMemo(
    () => selectedColorIds.length * selectedSizeIds.length,
    [selectedColorIds.length, selectedSizeIds.length],
  );

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

  const createQuickLookup = async (kind: LookupKind, raw: string) => {
    const value = raw.trim();
    if (!value || lookupBusy) return;
    if (!fromApi) {
      setError("Cần kết nối API để tạo màu/size lookup.");
      return;
    }
    setLookupBusy(true);
    setError(null);
    try {
      const created = await storeApi.createLookup({
        kind,
        name: value,
        active: true,
      });
      if (kind === LookupKind.Color) {
        setColorLookups((prev) =>
          prev.some((p) => p.id === created.id) ? prev : [...prev, created],
        );
        setSelectedColorIds((prev) =>
          prev.includes(created.id) ? prev : [...prev, created.id],
        );
        setQuickColor("");
      } else {
        setSizeLookups((prev) =>
          prev.some((p) => p.id === created.id) ? prev : [...prev, created],
        );
        setSelectedSizeIds((prev) =>
          prev.includes(created.id) ? prev : [...prev, created.id],
        );
        setQuickSize("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo lookup thất bại");
    } finally {
      setLookupBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    if (!selectedColorIds.length || !selectedSizeIds.length) {
      setError("Chọn ít nhất một màu và một size.");
      return;
    }
    if (imageFile) {
      const issue = validateProductImageFile(imageFile);
      if (issue) {
        setError(issue);
        return;
      }
    }

    const cat = categories.find((c) => c.id === category);
    const priceNum = parsePriceNumber(price);
    setBusy(true);
    setError(null);
    try {
      if (fromApi) {
        await addProduct({
          name: name.trim(),
          nameAccent: nameAccent.trim() || "New",
          price:
            price.trim() === ""
              ? "—"
              : price.includes("₫")
                ? price
                : `${priceNum.toLocaleString("vi-VN")}₫`,
          category: cat?.label || category || "lifestyle",
          categoryId: category || undefined,
          accent: accent || cat?.accent || "#ed3b6b",
          hero: previewUrl || encodeURI("/item/image 1.png"),
          colors: selectedColorIds.map(
            (id) => colorLookups.find((c) => c.id === id)?.name || id,
          ),
          sizes: selectedSizeIds
            .map((id) =>
              Number(sizeLookups.find((s) => s.id === id)?.name || id),
            )
            .filter((n) => Number.isFinite(n)),
          stock: Number(stock) || 0,
          description: description.trim() || null,
          imageFile,
          colorIds: selectedColorIds,
          sizeIds: selectedSizeIds,
          unitPrice: priceNum,
        });
      } else {
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
          colors: selectedColorIds,
          sizes: selectedSizeIds.map(Number).filter((n) => Number.isFinite(n)),
          stock: Number(stock) || 0,
          description: description.trim() || null,
          imageFile,
        });
      }

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
        <h1 className="text-3xl font-extrabold">{t("admin.createProduct")}</h1>
        <p className="mt-1 text-sm text-white/55">
          {fromApi
            ? t("admin.createProductApiSub")
            : t("admin.createProductDemoSub")}
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
              {t("admin.productAccentName")}
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
              {fromApi ? "Giá SKU (VND)" : "Giá (hiển thị)"}
            </span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={fromApi ? "2500000" : "199.00"}
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
              {t("admin.productStock")} / SKU
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

        <section className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white/85">Màu sắc</h2>
            <Link
              href="/admin/categories"
              className="text-[11px] font-semibold text-[#ed3b6b] hover:underline"
            >
              Quản lý màu / size →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {fromApi
              ? colorLookups.map((c) => {
                  const on = selectedColorIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedColorIds((prev) => toggleId(prev, c.id))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? "border-[#ed3b6b] bg-[#ed3b6b]/20 text-white"
                          : "border-white/15 text-white/60 hover:border-white/30"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })
              : LOCAL_COLORS.map((c) => {
                  const on = selectedColorIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedColorIds((prev) => toggleId(prev, c.id))
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        on
                          ? "border-[#ed3b6b] bg-[#ed3b6b]/20 text-white"
                          : "border-white/15 text-white/60 hover:border-white/30"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-white/30"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  );
                })}
            {fromApi && !colorLookups.length ? (
              <p className="text-xs text-white/45">
                Chưa có màu — tạo nhanh bên dưới hoặc vào Danh mục.
              </p>
            ) : null}
          </div>
          {fromApi ? (
            <div className="flex flex-wrap gap-2">
              <input
                value={quickColor}
                onChange={(e) => setQuickColor(e.target.value)}
                placeholder="Tên màu mới (vd: White)"
                className="min-w-[160px] flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                disabled={lookupBusy || !quickColor.trim()}
                onClick={() =>
                  void createQuickLookup(LookupKind.Color, quickColor)
                }
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
              >
                + Thêm màu
              </button>
            </div>
          ) : null}
        </section>

        <section className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <h2 className="text-sm font-bold text-white/85">Size</h2>
          <div className="flex flex-wrap gap-2">
            {fromApi
              ? sizeLookups.map((s) => {
                  const on = selectedSizeIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        setSelectedSizeIds((prev) => toggleId(prev, s.id))
                      }
                      className={`min-w-11 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        on
                          ? "border-[#ed3b6b] bg-[#ed3b6b]/20 text-white"
                          : "border-white/15 text-white/60 hover:border-white/30"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })
              : LOCAL_SIZES.map((size) => {
                  const id = String(size);
                  const on = selectedSizeIds.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setSelectedSizeIds((prev) => toggleId(prev, id))
                      }
                      className={`min-w-11 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        on
                          ? "border-[#ed3b6b] bg-[#ed3b6b]/20 text-white"
                          : "border-white/15 text-white/60 hover:border-white/30"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
            {fromApi && !sizeLookups.length ? (
              <p className="text-xs text-white/45">
                Chưa có size — tạo nhanh bên dưới hoặc vào Danh mục.
              </p>
            ) : null}
          </div>
          {fromApi ? (
            <div className="flex flex-wrap gap-2">
              <input
                value={quickSize}
                onChange={(e) => setQuickSize(e.target.value)}
                placeholder="Size mới (vd: 40)"
                className="min-w-[120px] flex-1 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                disabled={lookupBusy || !quickSize.trim()}
                onClick={() =>
                  void createQuickLookup(LookupKind.Size, quickSize)
                }
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/5 disabled:opacity-50"
              >
                + Thêm size
              </button>
            </div>
          ) : null}
          <p className="text-[11px] text-white/40">
            Sẽ tạo {skuPreviewCount} SKU (màu × size)
            {fromApi ? " · tồn kho áp dụng cho mỗi SKU" : ""}.
          </p>
        </section>

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
              {t("admin.productAccentColor")}
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
            alt={t("admin.productPreview")}
            className="mx-auto h-40 w-40 rounded-2xl border border-white/10 bg-black/40 object-contain p-2"
          />
        ) : null}

        <button
          type="submit"
          disabled={
            busy ||
            done ||
            !categories.length ||
            !selectedColorIds.length ||
            !selectedSizeIds.length
          }
          className="w-full rounded-xl bg-[#ed3b6b] py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)] transition hover:brightness-110 disabled:opacity-50"
        >
          {done
            ? "Đã tạo — chuyển sang danh sách…"
            : busy
              ? "Đang tạo…"
              : `Tạo sản phẩm${skuPreviewCount ? ` · ${skuPreviewCount} SKU` : ""}`}
        </button>
      </form>
    </div>
  );
}
