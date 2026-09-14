"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LookupKind, storeApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function CreateCategoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    if (!isAuthenticated) {
      setError("Cần đăng nhập admin để tạo Category qua API.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await storeApi.createLookup({
        kind: LookupKind.Category,
        name: name.trim(),
        active: true,
      });
      setDone(true);
      setTimeout(() => router.push("/admin/categories"), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo danh mục thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Create Category</h1>
        <p className="mt-1 text-sm text-white/55">
          Tạo lookup kind=Category qua API
        </p>
        {error ? <p className="mt-1 text-xs text-amber-200/80">{error}</p> : null}
      </div>

      <form onSubmit={onSubmit} className="admin-card space-y-4 p-6">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Tên danh mục
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Soccer"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-[#ed3b6b] focus:ring-2"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#ed3b6b] py-3 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)] disabled:opacity-50"
        >
          {done ? "Đã tạo — chuyển danh sách…" : busy ? "Đang tạo…" : "Tạo danh mục"}
        </button>
      </form>
    </div>
  );
}
