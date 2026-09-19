"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LookupKind,
  storeApi,
  type LookupDto,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import type { MessageKey } from "@/i18n/messages";

const TABS: { kind: LookupKind; labelKey: MessageKey; placeholder: string }[] =
  [
    {
      kind: LookupKind.Category,
      labelKey: "admin.lookupCategory",
      placeholder: "Ví dụ: Lifestyle",
    },
    {
      kind: LookupKind.Brand,
      labelKey: "admin.lookupBrand",
      placeholder: "Ví dụ: Nike",
    },
    {
      kind: LookupKind.Color,
      labelKey: "admin.lookupColor",
      placeholder: "Ví dụ: White / Đen / #ffffff",
    },
    {
      kind: LookupKind.Size,
      labelKey: "admin.lookupSize",
      placeholder: "Ví dụ: 40",
    },
  ];

function sameKind(a: number | string, b: LookupKind) {
  return Number(a) === Number(b);
}

export default function AdminLookupsPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [kind, setKind] = useState(LookupKind.Category);
  const [items, setItems] = useState<LookupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const activeTab = TABS.find((tab) => tab.kind === kind) || TABS[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi theo kind trước; nếu API bỏ qua kind thì lọc thêm phía client.
      const byKind = await storeApi.getLookups(kind);
      const filtered = byKind.filter((l) => sameKind(l.kind, kind));
      if (filtered.length || byKind.length === 0) {
        setItems(filtered);
      } else {
        const all = await storeApi.getLookups();
        setItems(all.filter((l) => sameKind(l.kind, kind)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được lookups");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await storeApi.createLookup({
        kind: Number(kind) as LookupKind,
        name: name.trim(),
        active: true,
      });
      setName("");
      // Optimistic: hiện ngay nếu API chưa trả về trong list
      setItems((prev) => {
        if (prev.some((p) => p.id === created.id)) return prev;
        return [created, ...prev];
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (item: LookupDto) => {
    if (!editName.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await storeApi.updateLookup(item.id, {
        kind: Number(item.kind) as LookupKind,
        name: editName.trim(),
        active: item.active,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (item: LookupDto) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await storeApi.updateLookup(item.id, {
        kind: Number(item.kind) as LookupKind,
        name: item.name || "",
        active: !item.active,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("admin.lookupTitle")}</h1>
        <p className="mt-1 text-sm text-white/55">{t("admin.lookupSubtitle")}</p>
        {error ? (
          <p className="mt-1 text-xs text-amber-200/80">{error}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            onClick={() => {
              setKind(tab.kind);
              setEditingId(null);
              setName("");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              kind === tab.kind
                ? "bg-[#ed3b6b] text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)]"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {!isAuthenticated ? (
        <div className="admin-card p-6 text-sm text-white/60">
          Đăng nhập tài khoản có quyền Catalog.Manage để quản lý lookups.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={create} className="admin-card space-y-3 p-5">
            <h2 className="text-lg font-bold">
              Tạo {t(activeTab.labelKey)}
            </h2>
            <label className="block text-xs text-white/50">
              Tên
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-[#ed3b6b] focus:ring-2"
                placeholder={activeTab.placeholder}
              />
            </label>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "Đang lưu…" : `Tạo ${t(activeTab.labelKey).toLowerCase()}`}
            </button>
          </form>

          <div className="admin-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Danh sách {t(activeTab.labelKey).toLowerCase()}
              </h2>
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
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {editingId === item.id ? (
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm outline-none"
                          />
                        ) : (
                          <p className="font-semibold">
                            {item.name || "—"}{" "}
                            <span
                              className={`text-xs ${
                                item.active
                                  ? "text-[#c6e600]"
                                  : "text-white/40"
                              }`}
                            >
                              {item.active
                                ? t("admin.lookupActive")
                                : t("admin.lookupInactive")}
                            </span>
                          </p>
                        )}
                        <p className="mt-1 truncate text-[11px] text-white/35">
                          {item.id}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editingId === item.id ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void saveEdit(item)}
                              className="rounded-lg bg-[#ed3b6b] px-2.5 py-1 text-xs font-semibold"
                            >
                              Lưu
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-white/15 px-2.5 py-1 text-xs"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditName(item.name || "");
                            }}
                            className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold"
                          >
                            Sửa
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleActive(item)}
                          className="rounded-lg border border-orange-400/40 px-2.5 py-1 text-xs font-semibold text-orange-200 disabled:opacity-50"
                        >
                          {item.active ? "Tắt" : "Bật"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {!items.length ? (
                  <li className="py-8 text-center text-sm text-white/45">
                    Chưa có bản ghi — hãy tạo {t(activeTab.labelKey).toLowerCase()}{" "}
                    bên trái.
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
