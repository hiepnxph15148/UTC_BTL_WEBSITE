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
  storeApi,
  type OrderDto,
  type ReportDto,
} from "@/lib/api";
import { LookupKind } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";

type AdminContextValue = {
  hydrated: boolean;
  fromApi: boolean;
  error: string | null;
  products: AdminProduct[];
  categories: AdminCategory[];
  orders: OrderDto[];
  report: ReportDto | null;
  addProduct: (
    input: Omit<AdminProduct, "id" | "createdAt" | "source" | "sales"> & {
      sales?: number;
    },
  ) => Promise<void>;
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
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [report, setReport] = useState<ReportDto | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFromApi(false);
      setApiProducts([]);
      setOrders([]);
      setReport(null);
      return;
    }

    setError(null);
    try {
      const now = new Date();
      const from = new Date(now);
      from.setMonth(from.getMonth() - 6);

      const [products, adminOrders, reportDto] = await Promise.all([
        storeApi.getAdminProducts({ take: 100 }),
        storeApi.getAdminOrders({ take: 100 }),
        storeApi.getReport(from.toISOString(), now.toISOString()),
      ]);

      setApiProducts(
        products.map((p, index) => ({
          id: p.id,
          name: p.name || "Product",
          nameAccent: p.slug || "",
          price: "—",
          category: p.categoryId,
          accent: ["#ed3b6b", "#3b82f6", "#c6e600", "#8b5cff"][index % 4],
          hero: mediaUrl(p.imageUrl) || encodeURI(`/item/image ${(index % 15) + 1}.png`),
          colors: ["#ffffff", "#1a1a1a"],
          sizes: [38, 39, 40, 41, 42],
          stock: p.published ? 10 : 0,
          sales: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          source: "custom" as const,
        })),
      );
      setOrders(adminOrders);
      setReport(reportDto);
      setFromApi(true);
    } catch (err) {
      setFromApi(false);
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
    if (fromApi && apiProducts.length) return apiProducts;
    const seed = seedProducts();
    const seedIds = new Set(seed.map((p) => p.id));
    return [...seed, ...customProducts.filter((p) => !seedIds.has(p.id))];
  }, [customProducts, apiProducts, fromApi]);

  const categories = useMemo(() => {
    const seed = seedCategories();
    const seedIds = new Set(seed.map((c) => c.id));
    return [...seed, ...customCategories.filter((c) => !seedIds.has(c.id))];
  }, [customCategories]);

  const addProduct = useCallback(
    async (
      input: Omit<AdminProduct, "id" | "createdAt" | "source" | "sales"> & {
        sales?: number;
      },
    ) => {
      if (isAuthenticated) {
        // Cần brandId/categoryId UUID thật từ lookups — lưu local nếu chưa đủ.
        try {
          const lookups = await storeApi.getLookups();
          const category =
            lookups.find(
              (l) =>
                l.kind === LookupKind.Category &&
                (l.id === input.category ||
                  (l.name || "")
                    .toLowerCase()
                    .includes(input.category.toLowerCase())),
            ) || lookups.find((l) => l.kind === LookupKind.Category);
          const brand = lookups.find((l) => l.kind === LookupKind.Brand);
          if (category && brand) {
            const created = await storeApi.createProduct({
              name: `${input.name} ${input.nameAccent}`.trim(),
              slug: slugify(`${input.name}-${input.nameAccent}-${Date.now()}`),
              description: null,
              imageUrl: input.hero.startsWith("http") ? input.hero : null,
              categoryId: category.id,
              brandId: brand.id,
              published: true,
            });
            await refresh();
            if (created) return;
          }
        } catch {
          // fall through to local
        }
      }

      const product: AdminProduct = {
        ...input,
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

export function orderStateLabel(state: number) {
  switch (state) {
    case 0:
      return "Processing";
    case 1:
      return "Confirmed";
    case 2:
      return "Shipped";
    case 3:
      return "Delivered";
    case 4:
      return "Canceled";
    default:
      return String(state);
  }
}

export function paymentStateLabel(state: number) {
  switch (state) {
    case 0:
      return "Unpaid";
    case 1:
      return "Collected";
    case 2:
      return "Partial refund";
    case 3:
      return "Refunded";
    default:
      return String(state);
  }
}

export function returnStateLabel(state: number) {
  switch (state) {
    case 0:
      return "Requested";
    case 1:
      return "Approved";
    case 2:
      return "Rejected";
    case 3:
      return "Received";
    case 4:
      return "Completed";
    default:
      return String(state);
  }
}

export function returnKindLabel(kind: number) {
  return kind === 1 ? "Exchange" : "Refund";
}

export function formatOrderAmount(amount: number) {
  return formatVnd(amount);
}
