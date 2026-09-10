"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { slugify } from "@/lib/admin-store";

export default function CreateCategoryPage() {
  const router = useRouter();
  const { addCategory } = useAdmin();
  const [label, setLabel] = useState("");
  const [blurb, setBlurb] = useState("");
  const [accent, setAccent] = useState("#ed3b6b");
  const [done, setDone] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    addCategory({
      id: slugify(label),
      label: label.trim(),
      blurb: blurb.trim() || "Custom category",
      accent,
    });

    setDone(true);
    setTimeout(() => router.push("/admin/categories"), 700);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Create Category</h1>
        <p className="mt-1 text-sm text-white/55">
          Thêm danh mục mới cho Collections / Admin
        </p>
      </div>

      <form onSubmit={onSubmit} className="admin-card space-y-4 p-6">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Tên danh mục
          </span>
          <input
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Soccer"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Mô tả ngắn
          </span>
          <input
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="Cleats & turf shoes"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Accent
          </span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-1"
          />
        </label>

        <p className="text-xs text-white/40">
          ID sẽ là:{" "}
          <span className="text-white/70">
            {slugify(label) || "—"}
          </span>
        </p>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#ed3b6b] py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)]"
        >
          {done ? "Đã tạo — chuyển danh sách…" : "Tạo danh mục"}
        </button>
      </form>
    </div>
  );
}
