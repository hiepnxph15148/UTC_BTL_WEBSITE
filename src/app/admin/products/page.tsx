"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";

const ProductsGrid = dynamic(
  () => import("@/components/admin/ProductsGrid"),
  {
    ssr: false,
    loading: () => (
      <p className="py-16 text-center text-sm text-white/45">Loading grid…</p>
    ),
  },
);

export default function AdminProductsPage() {
  const { products, hydrated } = useAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">All Products</h1>
          <p className="mt-1 text-sm text-white/55">
            Danh sách sản phẩm seed + sản phẩm tạo mới (localStorage)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)]"
        >
          + Create Product
        </Link>
      </div>

      <div className="admin-card p-5">
        {hydrated ? (
          <ProductsGrid products={products} height={560} />
        ) : (
          <p className="py-16 text-center text-sm text-white/45">Loading…</p>
        )}
      </div>
    </div>
  );
}
