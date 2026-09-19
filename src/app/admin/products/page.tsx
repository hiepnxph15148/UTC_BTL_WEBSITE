"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { useLocale } from "@/context/LocaleContext";

function GridLoadingFallback() {
  const { t } = useLocale();
  return (
    <p className="py-16 text-center text-sm text-white/45">
      {t("admin.loadingGrid")}
    </p>
  );
}

const ProductsGrid = dynamic(
  () => import("@/components/admin/ProductsGrid"),
  {
    ssr: false,
    loading: () => <GridLoadingFallback />,
  },
);

export default function AdminProductsPage() {
  const { products, hydrated, fromApi, error } = useAdmin();
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t("admin.products")}</h1>
          <p className="mt-1 text-sm text-white/55">
            {fromApi
              ? t("admin.productsApiSub", { count: products.length })
              : t("admin.productsDemoSub")}
          </p>
          {error ? (
            <p className="mt-1 text-xs text-amber-300/90">{error}</p>
          ) : null}
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)]"
        >
          + {t("admin.createProduct")}
        </Link>
      </div>

      <div className="admin-card p-5">
        {hydrated ? (
          <ProductsGrid products={products} height={560} />
        ) : (
          <p className="py-16 text-center text-sm text-white/45">
            {t("common.loading")}
          </p>
        )}
      </div>
    </div>
  );
}
