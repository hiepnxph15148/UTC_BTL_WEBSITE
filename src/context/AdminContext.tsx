"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { categorySections, shoes } from "@/data/shoes";
import {
  loadCustomCategories,
  loadCustomProducts,
  saveCustomCategories,
  saveCustomProducts,
  slugify,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/admin-store";
import {
  formatVnd,
  mediaUrl,
  splitName,
  storeApi,
  type OrderDetailDto,
  type OrderDto,
  type ReportDto,
} from "@/lib/api";
import { LookupKind, OrderState } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

export type AddProductInput = Omit<
  AdminProduct,
  "id" | "createdAt" | "source" | "sales"
> & {
  sales?: number;
  /** UUID danh mục API khi fromApi; không thì slug seed */
  categoryId?: string;
  description?: string | null;
  /** File ảnh JPEG/PNG/WebP — upload sau khi createProduct */
  imageFile?: File | null;
  /** Lookup màu / size để tạo SKU sau khi tạo sản phẩm (API) */
  colorIds?: string[];
  sizeIds?: string[];
  /** Giá SKU (đ / VND) khi tạo qua API */
  unitPrice?: number;
};

type AdminContextValue = {
  hydrated: boolean;
  fromApi: boolean;
  error: string | null;
  products: AdminProduct[];
  categories: AdminCategory[];
  orders: OrderDto[];
  /** Chi tiết đơn đã preload (id → detail) để dashboard/đơn gần đây. */
  orderDetails: Record<string, OrderDetailDto>;
  report: ReportDto | null;
  addProduct: (input: AddProductInput) => Promise<void>;
  addCategory: (input: Omit<AdminCategory, "id"> & { id?: string }) => void;
  removeProduct: (id: string) => void;
  refresh: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

function seedProducts(): AdminProduct[] {
  return shoes.map((shoe, index) => ({
    id: shoe.id,
    name: shoe.name,
    nameAccent: shoe.nameAccent,
    price: shoe.price,
    category: shoe.category,
    accent: shoe.accent,
    hero: shoe.hero,
    colors: shoe.colors,
    sizes: shoe.sizes,
    stock: 24 - index * 2,
    sales: 900 - index * 80,
    createdAt: "2026-01-10",
    source: "seed" as const,
  }));
}

function seedCategories(): AdminCategory[] {
  return categorySections.map((c) => ({
    id: c.id,
    label: c.label,
    blurb: c.blurb,
    accent: c.accent,
  }));
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated: authHydrated } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [fromApi, setFromApi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customProducts, setCustomProducts] = useState<AdminProduct[]>([]);
  const [customCategories, setCustomCategories] = useState<AdminCategory[]>([]);
  const [apiProducts, setApiProducts] = useState<AdminProduct[]>([]);
  const [apiCategories, setApiCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [orderDetails, setOrderDetails] = useState<
    Record<string, OrderDetailDto>
  >({});
  const [report, setReport] = useState<ReportDto | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFromApi(false);
      setApiProducts([]);
      setApiCategories([]);
      setOrders([]);
      setOrderDetails({});
      setReport(null);
      return;
    }

    setError(null);
    try {
      const now = new Date();
      const from = new Date(now);
      from.setMonth(from.getMonth() - 6);

      const [products, adminOrders, reportDto, categoriesLookup] =
        await Promise.all([
          storeApi.getAdminProducts({ take: 100 }),
          storeApi.getAdminOrders({ take: 100 }),
          storeApi.getReport(from.toISOString(), now.toISOString()),
          storeApi.getLookups(LookupKind.Category),
        ]);

      const accents = ["#ed3b6b", "#3b82f6", "#c6e600", "#8b5cff"];
      const categoryNameById = new Map(
        categoriesLookup.map((c) => [c.id, c.name || ""]),
      );

      setApiCategories(
        categoriesLookup
          .filter((c) => c.active !== false)
          .map((c, index) => ({
            id: c.id,
            label: c.name || "Category",
            blurb: "",
            accent: accents[index % accents.length],
          })),
      );

      // Chi tiết đơn (tối đa 50) → số lượng bán thật + hiển thị đơn gần đây
      const detailTargets = adminOrders.slice(0, 50);
      const detailsList = await Promise.all(
        detailTargets.map(async (order) => {
          try {
            const detail = await storeApi.getAdminOrder(order.id);
            return [order.id, detail] as const;
          } catch {
            return null;
          }
        }),
      );
      const detailsMap: Record<string, OrderDetailDto> = {};
      for (const row of detailsList) {
        if (row) detailsMap[row[0]] = row[1];
      }
      setOrderDetails(detailsMap);

      const qtyByName = new Map<string, number>();
      for (const order of adminOrders) {
        if (order.state === OrderState.Cancelled) continue;
        const detail = detailsMap[order.id];
        for (const line of detail?.items || []) {
          const key = (line.productName || "").trim().toLowerCase();
          if (!key) continue;
          qtyByName.set(key, (qtyByName.get(key) || 0) + (line.quantity || 0));
        }
      }

      const resolveSales = (fullName: string, baseName: string) => {
        const full = fullName.trim().toLowerCase();
        const base = baseName.trim().toLowerCase();
        if (qtyByName.has(full)) return qtyByName.get(full)!;
        if (qtyByName.has(base)) return qtyByName.get(base)!;
        for (const [key, qty] of qtyByName) {
          if (key.includes(base) || base.includes(key) || key.includes(full)) {
            return qty;
          }
        }
        return 0;
      };

      setApiProducts(
        await Promise.all(
          products.map(async (p, index) => {
            const { name, nameAccent } = splitName(p.name || "Product");
            let priceLabel = "—";
            let stock = 0;
            try {
              const skus = await storeApi.getAdminSkus(p.id);
              const prices = skus
                .map((s) => s.price)
                .filter((n) => Number.isFinite(n) && n > 0);
              if (prices.length) {
                priceLabel = formatVnd(Math.min(...prices));
              }
              stock = skus.reduce(
                (sum, s) =>
                  sum + (Number.isFinite(s.available) ? s.available : 0),
                0,
              );
            } catch {
              // giữ mặc định
            }
            const fullName = `${name} ${nameAccent}`.trim();
            return {
              id: p.id,
              name,
              nameAccent,
              price: priceLabel,
              category: categoryNameById.get(p.categoryId) || "—",
              accent: accents[index % accents.length],
              hero:
                mediaUrl(p.imageUrl) ||
                encodeURI(`/item/image ${(index % 15) + 1}.png`),
              colors: ["#ffffff", "#1a1a1a"],
              sizes: [38, 39, 40, 41, 42],
              stock,
              sales: resolveSales(fullName, name),
              createdAt: new Date().toISOString().slice(0, 10),
              source: "custom" as const,
            };
          }),
        ),
      );
      setOrders(adminOrders);
      setReport(reportDto);
      setFromApi(true);
    } catch (err) {
      setFromApi(false);
      setApiCategories([]);
      setOrderDetails({});
      setError(
        err instanceof Error
          ? `${err.message} — admin đang dùng dữ liệu local`
          : "Không tải được admin API",
      );
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setCustomProducts(loadCustomProducts());
    setCustomCategories(loadCustomCategories());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    void refresh();
  }, [authHydrated, refresh]);

  const products = useMemo(() => {
    // Khi đã nối API: chỉ hiện danh sách API (cùng nguồn với Create Product).
    if (fromApi) return apiProducts;
    const seed = seedProducts();
    const seedIds = new Set(seed.map((p) => p.id));
    return [...seed, ...customProducts.filter((p) => !seedIds.has(p.id))];
  }, [customProducts, apiProducts, fromApi]);

  const categories = useMemo(() => {
    if (fromApi && apiCategories.length) return apiCategories;
    const seed = seedCategories();
    const seedIds = new Set(seed.map((c) => c.id));
    return [...seed, ...customCategories.filter((c) => !seedIds.has(c.id))];
  }, [apiCategories, customCategories, fromApi]);

  const addProduct = useCallback(
    async (input: AddProductInput) => {
      if (isAuthenticated) {
        const [categories, brands, colorLookups, sizeLookups] =
          await Promise.all([
            storeApi.getLookups(LookupKind.Category),
            storeApi.getLookups(LookupKind.Brand),
            storeApi.getLookups(LookupKind.Color),
            storeApi.getLookups(LookupKind.Size),
          ]);

        const categoryId = input.categoryId || input.category;
        const category =
          categories.find(
            (l) =>
              l.id === categoryId ||
              (l.name || "").toLowerCase() ===
                (input.category || "").toLowerCase() ||
              (l.name || "")
                .toLowerCase()
                .includes((input.category || "").toLowerCase()),
          ) || categories.find((l) => l.active !== false);

        let brand =
          brands.find((l) => l.active !== false) || brands[0] || null;
        if (!brand) {
          brand = await storeApi.createLookup({
            kind: LookupKind.Brand,
            name: "Nike",
            active: true,
          });
        }

        if (!category) {
          throw new Error(
            "Thiếu danh mục trên API. Hãy tạo danh mục ở trang Danh mục trước.",
          );
        }

        const colorIds = (input.colorIds || []).filter(Boolean);
        const sizeIds = (input.sizeIds || []).filter(Boolean);
        if (!colorIds.length || !sizeIds.length) {
          throw new Error(
            "Chọn ít nhất một màu và một size để tạo SKU.",
          );
        }

        const created = await storeApi.createProduct({
          name: `${input.name} ${input.nameAccent}`.trim(),
          slug: slugify(`${input.name}-${input.nameAccent}-${Date.now()}`),
          description: input.description?.trim() || null,
          imageUrl:
            !input.imageFile && input.hero.startsWith("http")
              ? input.hero
              : null,
          categoryId: category.id,
          brandId: brand.id,
          published: true,
        });

        if (input.imageFile) {
          await storeApi.uploadProductImage(created.id, input.imageFile);
        }

        const allLookups = [
          ...categories,
          ...brands,
          ...colorLookups,
          ...sizeLookups,
        ];
        const colorName = (id: string) =>
          allLookups.find((l) => l.id === id)?.name || id.slice(0, 4);
        const sizeName = (id: string) =>
          allLookups.find((l) => l.id === id)?.name || id.slice(0, 4);
        const unitPrice =
          typeof input.unitPrice === "number" && input.unitPrice > 0
            ? Math.round(input.unitPrice)
            : 0;
        const stockEach = Math.max(0, Math.trunc(input.stock || 0));

        for (const colorId of colorIds) {
          for (const sizeId of sizeIds) {
            const code = slugify(
              `${input.name}-${colorName(colorId)}-${sizeName(sizeId)}`,
            )
              .toUpperCase()
              .slice(0, 40);
            const sku = await storeApi.createSku(created.id, {
              colorId,
              sizeId,
              code: code || `MAU-${Date.now().toString(36)}`,
              price: unitPrice,
              active: true,
            });
            if (stockEach > 0) {
              try {
                await storeApi.adjustStock({
                  skuId: sku.id,
                  delta: stockEach,
                  reason: "Nhập tồn khi tạo sản phẩm",
                });
              } catch {
                // Tạo SP vẫn thành công nếu kho từ chối
              }
            }
          }
        }

        await refresh();
        return;
      }

      const product: AdminProduct = {
        name: input.name,
        nameAccent: input.nameAccent,
        price: input.price,
        category: input.category,
        accent: input.accent,
        hero: input.hero,
        colors: input.colors,
        sizes: input.sizes,
        stock: input.stock,
        id: `${slugify(`${input.name}-${input.nameAccent}`)}-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString().slice(0, 10),
        source: "custom",
        sales: input.sales ?? 0,
      };
      setCustomProducts((prev) => {
        const next = [product, ...prev];
        saveCustomProducts(next);
        return next;
      });
    },
    [isAuthenticated, refresh],
  );

  const addCategory = useCallback(
    (input: Omit<AdminCategory, "id"> & { id?: string }) => {
      const category: AdminCategory = {
        id: input.id || slugify(input.label) || `cat-${Date.now().toString(36)}`,
        label: input.label,
        blurb: input.blurb,
        accent: input.accent,
      };
      setCustomCategories((prev) => {
        if (
          seedCategories().some((c) => c.id === category.id) ||
          prev.some((c) => c.id === category.id)
        ) {
          return prev;
        }
        const next = [...prev, category];
        saveCustomCategories(next);
        return next;
      });
    },
    [],
  );

  const removeProduct = useCallback((id: string) => {
    setCustomProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveCustomProducts(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      fromApi,
      error,
      products,
      categories,
      orders,
      orderDetails,
      report,
      addProduct,
      addCategory,
      removeProduct,
      refresh,
    }),
    [
      hydrated,
      fromApi,
      error,
      products,
      categories,
      orders,
      orderDetails,
      report,
      addProduct,
      addCategory,
      removeProduct,
      refresh,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export {
  orderStateKey,
  paymentStateKey,
  returnStateKey,
  returnKindKey,
  orderStatusCanonFromState,
  orderStatusCanonFromDemo,
  orderStatusKeyFromCanon,
  orderStatusTone,
} from "@/lib/status-labels";
export type { OrderStatusCanon } from "@/lib/status-labels";

export function formatOrderAmount(amount: number) {
  return formatVnd(amount);
}
