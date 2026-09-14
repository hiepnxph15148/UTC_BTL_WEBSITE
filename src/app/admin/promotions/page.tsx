"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DiscountKind,
  formatVnd,
  storeApi,
  type DiscountDto,
} from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";

function defaultForm() {
  const starts = new Date();
  const ends = new Date();
  ends.setMonth(ends.getMonth() + 3);
  return {
    name: "",
    code: "",
    kind: DiscountKind.Percentage,
    value: "10",
    maxDiscount: "100000",
    minimumSubtotal: "0",
    usageLimit: "100",
    perCustomerLimit: "1",
    startsAt: starts.toISOString().slice(0, 16),
    endsAt: ends.toISOString().slice(0, 16),
    active: true,
  };
}

function formFromDiscount(d: DiscountDto) {
  return {
    name: d.name || "",
    code: d.code || "",
    kind: d.kind,
    value: String(d.value),
    maxDiscount: String(d.maxDiscount),
    minimumSubtotal: String(d.minimumSubtotal),
    usageLimit: String(d.usageLimit),
    perCustomerLimit: String(d.perCustomerLimit),
    startsAt: d.startsAt.slice(0, 16),
    endsAt: d.endsAt.slice(0, 16),
    active: d.active,
  };
}

export default function AdminDiscountsPage() {
  const { error: adminError } = useAdmin();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<DiscountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setItems(await storeApi.getDiscounts({ take: 100 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được ưu đãi");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const toInput = () => ({
    name: form.name.trim(),
    code: form.code.trim() || null,
    productId: null as string | null,
    kind: form.kind,
    value: Number(form.value),
    maxDiscount: Number(form.maxDiscount),
    minimumSubtotal: Number(form.minimumSubtotal),
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
    usageLimit: Number(form.usageLimit),
    perCustomerLimit: Number(form.perCustomerLimit),
    active: form.active,
  });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        await storeApi.updateDiscount(editingId, toInput());
        setEditingId(null);
      } else {
        await storeApi.createDiscount({ ...toInput(), active: true });
      }
      setForm(defaultForm());
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingId
            ? "Cập nhật ưu đãi thất bại"
            : "Tạo ưu đãi thất bại",
      );
    } finally {
      setBusy(false);
    }
  };

  const disable = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await storeApi.disableDiscount(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(defaultForm());
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tắt ưu đãi thất bại");
    } finally {
      setBusy(false);
    }
  };

  const selectEdit = (d: DiscountDto) => {
    setEditingId(d.id);
    setForm(formFromDiscount(d));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Promotions</h1>
        <p className="mt-1 text-sm text-white/55">
          Voucher / khuyến mãi dùng ở checkout · sửa chương trình chưa dùng
        </p>
        {adminError || error ? (
          <p className="mt-1 text-xs text-amber-200/80">{error || adminError}</p>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <div className="admin-card p-6 text-sm text-white/60">
          Đăng nhập tài khoản có quyền Promotions.Manage để quản lý ưu đãi.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={create} className="admin-card space-y-3 p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">
                {editingId ? "Sửa ưu đãi" : "Tạo ưu đãi"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(defaultForm());
                  }}
                  className="text-xs text-white/50 hover:text-white"
                >
                  Hủy sửa
                </button>
              ) : null}
            </div>
            <label className="block text-xs text-white/50">
              Tên
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              />
            </label>
            <label className="block text-xs text-white/50">
              Mã voucher (để trống = khuyến mãi tự động)
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                placeholder="WELCOME10"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs text-white/50">
                Loại
                <select
                  value={form.kind}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      kind: Number(e.target.value) as DiscountKind,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value={DiscountKind.Percentage}>Phần trăm</option>
                  <option value={DiscountKind.Fixed}>Số tiền cố định</option>
                </select>
              </label>
              <label className="block text-xs text-white/50">
                Giá trị
                <input
                  required
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-xs text-white/50">
                Giảm tối đa (VND)
                <input
                  required
                  value={form.maxDiscount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxDiscount: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-xs text-white/50">
                Đơn tối thiểu
                <input
                  required
                  value={form.minimumSubtotal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minimumSubtotal: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-xs text-white/50">
                Giới hạn tổng
                <input
                  required
                  value={form.usageLimit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, usageLimit: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-xs text-white/50">
                / khách
                <input
                  required
                  value={form.perCustomerLimit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, perCustomerLimit: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-xs text-white/50">
                Bắt đầu
                <input
                  type="datetime-local"
                  required
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startsAt: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-xs text-white/50">
                Kết thúc
                <input
                  type="datetime-local"
                  required
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endsAt: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>
            {editingId ? (
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, active: e.target.checked }))
                  }
                />
                Active
              </label>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy
                ? "Đang lưu…"
                : editingId
                  ? "Cập nhật ưu đãi"
                  : "Tạo ưu đãi"}
            </button>
          </form>

          <div className="admin-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Danh sách</h2>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
              >
                Làm mới
              </button>
            </div>
            {loading ? (
              <p className="py-10 text-center text-sm text-white/45">Đang tải…</p>
            ) : (
              <ul className="space-y-2">
                {items.map((d) => (
                  <li
                    key={d.id}
                    className={`rounded-xl border px-4 py-3 ${
                      editingId === d.id
                        ? "border-[#ed3b6b]/50 bg-[#ed3b6b]/10"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => selectEdit(d)}
                      >
                        <p className="font-semibold">
                          {d.name}{" "}
                          {d.code ? (
                            <span className="text-[#c6e600]">({d.code})</span>
                          ) : (
                            <span className="text-white/40">auto</span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {d.kind === DiscountKind.Percentage
                            ? `${d.value}%`
                            : formatVnd(d.value)}{" "}
                          · max {formatVnd(d.maxDiscount)} · min{" "}
                          {formatVnd(d.minimumSubtotal)} ·{" "}
                          {d.active ? "active" : "disabled"}
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => selectEdit(d)}
                          className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold"
                        >
                          Sửa
                        </button>
                        {d.active ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void disable(d.id)}
                            className="rounded-lg border border-orange-400/40 px-2.5 py-1 text-xs font-semibold text-orange-200 disabled:opacity-50"
                          >
                            Tắt
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
                {!items.length ? (
                  <li className="py-8 text-center text-sm text-white/45">
                    Chưa có chương trình ưu đãi
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
