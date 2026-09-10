"use client";

import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";

export default function AdminCategoriesPage() {
  const { categories, hydrated } = useAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Categories</h1>
          <p className="mt-1 text-sm text-white/55">
            Danh mục seed + danh mục tạo thêm
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)]"
        >
          + Create Category
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(hydrated ? categories : []).map((cat) => (
          <div key={cat.id} className="admin-card p-5">
            <div
              className="mb-3 h-2 w-12 -skew-x-[20deg]"
              style={{ background: cat.accent }}
            />
            <h2 className="text-xl font-bold">{cat.label}</h2>
            <p className="mt-2 text-sm text-white/55">{cat.blurb}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/35">
              id: {cat.id}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
