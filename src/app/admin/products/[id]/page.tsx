"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LookupKind,
  mediaUrl,
  storeApi,
  type LookupDto,
  type ProductDto,
  type SkuDto,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import {
  PRODUCT_IMAGE_ACCEPT,
  validateProductImageFile,
} from "@/lib/product-image";

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();

  const [product, setProduct] = useState<ProductDto | null>(null);
  const [skus, setSkus] = useState<SkuDto[]>([]);
  const [categories, setCategories] = useState<LookupDto[]>([]);
  const [brands, setBrands] = useState<LookupDto[]>([]);
  const [colors, setColors] = useState<LookupDto[]>([]);
  const [sizes, setSizes] = useState<LookupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [published, setPublished] = useState(true);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const [skuColorId, setSkuColorId] = useState("");
  const [skuSizeId, setSkuSizeId] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [skuPrice, setSkuPrice] = useState("");

  const load = useCallback(async () => {
    if (!isAuthenticated || !productId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [adminProducts, lookups, adminSkus] = await Promise.all([
        storeApi.getAdminProducts({ take: 200 }),
        storeApi.getLookups(),
        storeApi.getAdminSkus(productId),
      ]);
      const found =
        adminProducts.find((p) => p.id === productId) ||
        (await storeApi.getProduct(productId).catch(() => null));
      if (!found) throw new Error("Không tìm thấy sản phẩm");

      setProduct(found);
      setName(found.name || "");
      setSlug(found.slug || "");
      setDescription(found.description || "");
      setCategoryId(found.categoryId);
      setBrandId(found.brandId);
      setPublished(found.published);
      setImageUrlInput(found.imageUrl || "");

      setCategories(lookups.filter((l) => l.kind === LookupKind.Category));
      setBrands(lookups.filter((l) => l.kind === LookupKind.Brand));
      const colorList = lookups.filter(
        (l) => Number(l.kind) === LookupKind.Color && l.active,
      );
      const sizeList = lookups.filter(
        (l) => Number(l.kind) === LookupKind.Size && l.active,
      );
      setColors(colorList);
      setSizes(sizeList);
      setSkuColorId(colorList[0]?.id || "");
      setSkuSizeId(sizeList[0]?.id || "");
      setSkus(adminSkus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được sản phẩm");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await storeApi.updateProduct(product.id, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        imageUrl: product.imageUrl,
        categoryId,
        brandId,
        published,
      });
      setProduct(updated);
      setMessage("Đã cập nhật sản phẩm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (file: File | null) => {
    if (!product || !file || busy) return;
    const issue = validateProductImageFile(file);
    if (issue) {
      setError(issue);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await storeApi.uploadProductImage(product.id, file);
      setProduct(updated);
      setImageUrlInput(updated.imageUrl || "");
      setMessage("Đã upload ảnh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setBusy(false);
    }
  };

  const setUrl = async () => {
    if (!product || !imageUrlInput.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await storeApi.setProductImageUrl(
        product.id,
        imageUrlInput.trim(),
      );
      setProduct(updated);
      setMessage("Đã đặt URL ảnh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đặt URL thất bại");
    } finally {
      setBusy(false);
    }
  };

  const deleteImage = async () => {
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await storeApi.deleteProductImage(product.id);
      setProduct(updated);
      setImageUrlInput("");
      setMessage("Đã xóa ảnh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa ảnh thất bại");
    } finally {
      setBusy(false);
    }
  };

  const createSku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    try {
      await storeApi.createSku(product.id, {
        colorId: skuColorId,
        sizeId: skuSizeId,
        code: skuCode.trim(),
        price: Number(skuPrice),
        active: true,
      });
      setSkuCode("");
      setSkuPrice("");
      await load();
      setMessage("Đã tạo SKU");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo SKU thất bại");
    } finally {
      setBusy(false);
    }
  };

  const updateSkuField = async (
    sku: SkuDto,
    patch: { price?: number; active?: boolean },
  ) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await storeApi.updateSku(sku.id, {
        colorId: sku.colorId,
        sizeId: sku.sizeId,
        code: sku.code || "",
        price: patch.price ?? sku.price,
        active: patch.active ?? sku.active,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật SKU thất bại");
    } finally {
      setBusy(false);
    }
  };

  const lookupName = (list: LookupDto[], id: string) =>
    list.find((l) => l.id === id)?.name || "—";

  if (!isAuthenticated) {
    return (
      <div className="admin-card p-6 text-sm text-white/60">
        Đăng nhập admin để sửa sản phẩm.
      </div>
    );
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-white/45">Đang tải…</p>;
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-amber-200/80">{error || "Không tìm thấy sản phẩm"}</p>
        <Link href="/admin/products" className="text-sm text-[#ed3b6b]">
          ← Về danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-white/50 hover:text-white"
          >
            {t("admin.productsBack")}
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">{product.name}</h1>
          <p className="mt-1 text-sm text-white/55">Sửa sản phẩm · ảnh · SKU</p>
        </div>
      </div>

      {error ? <p className="text-xs text-amber-200/80">{error}</p> : null}
      {message ? <p className="text-xs text-[#c6e600]">{message}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <form onSubmit={saveProduct} className="admin-card space-y-3 p-5">
          <h2 className="text-lg font-bold">Thông tin sản phẩm</h2>
          <label className="block text-xs text-white/50">
            Tên
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block text-xs text-white/50">
            Slug
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block text-xs text-white/50">
            Mô tả
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-white/50">
              {t("admin.productCategory")}
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{" "}
                    {!c.active ? `(${t("admin.productOff")})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/50">
              {t("admin.productBrand")}
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}{" "}
                    {!b.active ? `(${t("admin.productOff")})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            {t("admin.productPublished")}
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Lưu sản phẩm
          </button>
        </form>

        <div className="admin-card space-y-3 p-5">
          <h2 className="text-lg font-bold">Ảnh sản phẩm</h2>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(product.imageUrl) || product.imageUrl}
              alt=""
              className="h-40 w-full rounded-xl object-contain bg-black/40"
            />
          ) : (
            <p className="text-sm text-white/45">Chưa có ảnh</p>
          )}
          <label className="block text-xs text-white/50">
            {t("admin.productUpload")}
            <input
              type="file"
              accept={PRODUCT_IMAGE_ACCEPT}
              onChange={(e) => void uploadImage(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-sm text-white/70"
            />
            <span className="mt-1 block text-[11px] text-white/40">
              JPEG / PNG / WebP · tối đa 5 MB
            </span>
          </label>
          <label className="block text-xs text-white/50">
            Hoặc URL
            <div className="mt-1 flex gap-2">
              <input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
                placeholder="https://..."
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void setUrl()}
                className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"
              >
                Đặt URL
              </button>
            </div>
          </label>
          <button
            type="button"
            disabled={busy || !product.imageUrl}
            onClick={() => void deleteImage()}
            className="rounded-xl border border-orange-400/40 px-3 py-2 text-xs font-semibold text-orange-200 disabled:opacity-50"
          >
            Xóa ảnh
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={createSku} className="admin-card space-y-3 p-5">
          <h2 className="text-lg font-bold">Tạo SKU</h2>
          <label className="block text-xs text-white/50">
            Màu
            <select
              value={skuColorId}
              onChange={(e) => setSkuColorId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              required
            >
              {!colors.length ? (
                <option value="">Chưa có màu — tạo ở Danh mục</option>
              ) : (
                colors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block text-xs text-white/50">
            Size
            <select
              value={skuSizeId}
              onChange={(e) => setSkuSizeId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              required
            >
              {!sizes.length ? (
                <option value="">Chưa có size — tạo ở Danh mục</option>
              ) : (
                sizes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block text-xs text-white/50">
            Mã SKU
            <input
              required
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
              placeholder="PROD-WHITE-40"
            />
          </label>
          <label className="block text-xs text-white/50">
            Giá (VND)
            <input
              required
              value={skuPrice}
              onChange={(e) => setSkuPrice(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !colors.length || !sizes.length}
            className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            Tạo SKU
          </button>
          {!colors.length || !sizes.length ? (
            <p className="text-xs text-amber-200/80">
              Cần có màu và size active trong{" "}
              <Link href="/admin/categories" className="underline">
                Danh mục
              </Link>
              .
            </p>
          ) : null}
        </form>

        <div className="admin-card p-5">
          <h2 className="mb-4 text-lg font-bold">Danh sách SKU</h2>
          <ul className="space-y-2">
            {skus.map((sku) => (
              <li
                key={sku.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{sku.code}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {lookupName(colors, sku.colorId)} /{" "}
                      {lookupName(sizes, sku.sizeId)} · tồn {sku.available} ·{" "}
                      {sku.active
                        ? t("admin.productActive")
                        : t("admin.productOff")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      defaultValue={sku.price}
                      key={`${sku.id}-${sku.price}`}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n !== sku.price) {
                          void updateSkuField(sku, { price: n });
                        }
                      }}
                      className="w-28 rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void updateSkuField(sku, { active: !sku.active })
                      }
                      className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold"
                    >
                      {sku.active ? "Tắt" : "Bật"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {!skus.length ? (
              <li className="py-8 text-center text-sm text-white/45">
                Chưa có SKU
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
