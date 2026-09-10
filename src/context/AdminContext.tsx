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

type AdminContextValue = {
  hydrated: boolean;
  products: AdminProduct[];
  categories: AdminCategory[];
  addProduct: (input: Omit<AdminProduct, "id" | "createdAt" | "source" | "sales"> & { sales?: number }) => void;
  addCategory: (input: Omit<AdminCategory, "id"> & { id?: string }) => void;
  removeProduct: (id: string) => void;
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
  const [hydrated, setHydrated] = useState(false);
  const [customProducts, setCustomProducts] = useState<AdminProduct[]>([]);
  const [customCategories, setCustomCategories] = useState<AdminCategory[]>([]);

  useEffect(() => {
    setCustomProducts(loadCustomProducts());
    setCustomCategories(loadCustomCategories());
    setHydrated(true);
  }, []);

  const products = useMemo(() => {
    const seed = seedProducts();
    const seedIds = new Set(seed.map((p) => p.id));
    return [...seed, ...customProducts.filter((p) => !seedIds.has(p.id))];
  }, [customProducts]);

  const categories = useMemo(() => {
    const seed = seedCategories();
    const seedIds = new Set(seed.map((c) => c.id));
    return [...seed, ...customCategories.filter((c) => !seedIds.has(c.id))];
  }, [customCategories]);

  const addProduct = useCallback(
    (
      input: Omit<AdminProduct, "id" | "createdAt" | "source" | "sales"> & {
        sales?: number;
      },
    ) => {
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
    [],
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
      products,
      categories,
      addProduct,
      addCategory,
      removeProduct,
    }),
    [
      hydrated,
      products,
      categories,
      addProduct,
      addCategory,
      removeProduct,
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
