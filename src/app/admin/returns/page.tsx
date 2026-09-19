"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReturnState,
  formatVnd,
  storeApi,
  type ReturnDto,
} from "@/lib/api";
import {
  returnKindKey,
  returnStateKey,
  useAdmin,
} from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

const NEXT_ACTIONS: Partial<
  Record<ReturnState, { state: ReturnState; label: string }[]>
> = {
  [ReturnState.Requested]: [
    { state: ReturnState.Approved, label: "Duyệt" },
    { state: ReturnState.Rejected, label: "Từ chối" },
  ],
  [ReturnState.Approved]: [
    { state: ReturnState.Received, label: "Đã nhận hàng" },
    { state: ReturnState.Rejected, label: "Từ chối" },
  ],
  [ReturnState.Received]: [
    { state: ReturnState.Completed, label: "Hoàn tất" },
  ],
};

export default function AdminReturnsPage() {
  const { fromApi, error: adminError, refresh } = useAdmin();
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const [items, setItems] = useState<ReturnDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReturnDto | null>(null);
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.getAdminReturns({ take: 100 });
      setItems(data);
      setSelected((prev) =>
        prev ? data.find((r) => r.id === prev.id) || null : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được đổi trả");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const process = async (state: ReturnState) => {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await storeApi.processReturn(selected.id, {
        state,
        note:
          note.trim() ||
          (state === ReturnState.Rejected
            ? "Từ chối yêu cầu"
            : state === ReturnState.Completed
              ? "Hoàn tất đổi/trả"
              : "Cập nhật trạng thái"),
        restock: state === ReturnState.Completed ? restock : false,
      });
      setSelected(updated);
      setNote("");
      await load();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xử lý thất bại");
    } finally {
      setBusy(false);
    }
  };

  const actions = selected ? NEXT_ACTIONS[selected.state] || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("admin.returnsTitle")}
        </h1>
        <p className="mt-1 text-sm text-white/55">{t("admin.returnsSubtitle")}</p>
        {adminError || error ? (
          <p className="mt-1 text-xs text-amber-200/80">{error || adminError}</p>
        ) : null}
      </div>

      {!fromApi && !isAuthenticated ? (
        <div className="admin-card p-6 text-sm text-white/60">
          {t("admin.returnsNeedPerm")}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="admin-card p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Yêu cầu đổi/trả</h2>
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
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        selected?.id === item.id
                          ? "border-[#ed3b6b]/50 bg-[#ed3b6b]/10"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">
                          {t(returnKindKey(item.kind))} · x{item.quantity}
                        </span>
                        <span className="text-xs font-bold text-white/55">
                          {t(returnStateKey(item.state))}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/45">
                        {t("admin.returnsOrder")} {item.orderId.slice(0, 8)}… ·{" "}
                        {item.reason || "Không có lý do"} · hoàn{" "}
                        {formatVnd(item.refundAmount)}
                      </p>
                    </button>
                  </li>
                ))}
                {!items.length ? (
                  <li className="py-8 text-center text-sm text-white/45">
                    Chưa có yêu cầu đổi/trả
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="admin-card space-y-4 p-5">
            {!selected ? (
              <p className="text-sm text-white/50">Chọn một yêu cầu để xử lý.</p>
            ) : (
              <>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                    Chi tiết
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">
                    {t(returnKindKey(selected.kind))} ·{" "}
                    {t(returnStateKey(selected.state))}
                  </h2>
                  <dl className="mt-3 space-y-1 text-sm text-white/60">
                    <div>Số lượng: {selected.quantity}</div>
                    <div>Lý do: {selected.reason || "—"}</div>
                    <div>Hoàn dự kiến: {formatVnd(selected.refundAmount)}</div>
                    {selected.replacementSkuId ? (
                      <div>
                        SKU đổi: {selected.replacementSkuId.slice(0, 8)}…
                      </div>
                    ) : null}
                  </dl>
                </div>

                {actions.length ? (
                  <>
                    <label className="block text-xs text-white/50">
                      Ghi chú
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                      />
                    </label>
                    {selected.state === ReturnState.Received ? (
                      <label className="flex items-center gap-2 text-sm text-white/70">
                        <input
                          type="checkbox"
                          checked={restock}
                          onChange={(e) => setRestock(e.target.checked)}
                        />
                        Nhập lại tồn khi hoàn tất (restock)
                      </label>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.state}
                          type="button"
                          disabled={busy}
                          onClick={() => void process(action.state)}
                          className={`rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                            action.state === ReturnState.Rejected
                              ? "border border-orange-400/40 text-orange-200"
                              : action.state === ReturnState.Completed
                                ? "bg-[#c6e600] text-black"
                                : "bg-[#ed3b6b] text-white"
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/50">
                    {t("admin.returnStatusDone", {
                      status: t(returnStateKey(selected.state)),
                    })}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
