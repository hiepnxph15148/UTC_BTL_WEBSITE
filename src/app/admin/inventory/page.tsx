"use client";

import { useCallback, useEffect, useState } from "react";
import { storeApi, type InventoryDto, type MovementDto } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";

export default function AdminInventoryPage() {
  const { fromApi, error: adminError } = useAdmin();
  const { isAuthenticated } = useAuth();
  const { t, dateLocale } = useLocale();
  const [items, setItems] = useState<InventoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [movements, setMovements] = useState<MovementDto[]>([]);
  const [delta, setDelta] = useState("10");
  const [reason, setReason] = useState("Nhập hàng");
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
      const data = await storeApi.getInventory({
        take: 100,
        search: search.trim() || undefined,
      });
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được tồn kho");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const openMovements = async (skuId: string) => {
    setSelectedSku(skuId);
    try {
      const data = await storeApi.getStockMovements(skuId, { take: 50 });
      setMovements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải sổ kho");
      setMovements([]);
    }
  };

  const adjust = async () => {
    if (!selectedSku || busy) return;
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0) {
      setError("Delta phải khác 0");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await storeApi.adjustStock({
        skuId: selectedSku,
        delta: Math.trunc(n),
        reason: reason.trim() || "Điều chỉnh tồn",
      });
      await load();
      await openMovements(selectedSku);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Điều chỉnh thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("admin.invTitle")}
        </h1>
        <p className="mt-1 text-sm text-white/55">{t("admin.invSubtitle")}</p>
        {adminError || error ? (
          <p className="mt-1 text-xs text-amber-200/80">{error || adminError}</p>
        ) : null}
      </div>

      {!fromApi && !isAuthenticated ? (
        <div className="admin-card p-6 text-sm text-white/60">
          {t("admin.invNeedPerm")}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="admin-card p-5">
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <label className="min-w-[200px] flex-1 text-xs text-white/50">
                Tìm mã SKU
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  placeholder="CLASSIC-WHITE…"
                />
              </label>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
              >
                Làm mới
              </button>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-white/45">
                {t("common.loading")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-white/40">
                    <tr>
                      <th className="pb-3 pr-3 font-semibold">SKU</th>
                      <th className="pb-3 pr-3 font-semibold">
                        {t("admin.invOnHand")}
                      </th>
                      <th className="pb-3 pr-3 font-semibold">
                        {t("admin.invReserved")}
                      </th>
                      <th className="pb-3 pr-3 font-semibold">
                        {t("admin.invAvailable")}
                      </th>
                      <th className="pb-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr
                        key={row.skuId}
                        className={`border-t border-white/8 ${
                          selectedSku === row.skuId ? "bg-[#ed3b6b]/10" : ""
                        }`}
                      >
                        <td className="py-3 pr-3 font-semibold">
                          {row.code || row.skuId.slice(0, 8)}
                        </td>
                        <td className="py-3 pr-3 text-white/70">{row.onHand}</td>
                        <td className="py-3 pr-3 text-white/70">{row.reserved}</td>
                        <td
                          className={`py-3 pr-3 font-bold ${
                            row.available <= 5 ? "text-amber-300" : "text-white"
                          }`}
                        >
                          {row.available}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void openMovements(row.skuId)}
                            className="rounded-lg border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/70 hover:bg-white/5"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!items.length ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/45">
                          Không có SKU trong kho
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-card space-y-4 p-5">
            <h2 className="text-lg font-bold">
              {selectedSku ? "Điều chỉnh & sổ kho" : "Chọn một SKU"}
            </h2>
            {selectedSku ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-white/50">
                    Delta (+ nhập / − giảm)
                    <input
                      value={delta}
                      onChange={(e) => setDelta(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="text-xs text-white/50">
                    Lý do
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void adjust()}
                  className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {busy ? t("admin.saving") : t("admin.invAdjust")}
                </button>

                <div>
                  <h3 className="text-sm font-bold text-white/80">
                    {t("admin.invMovements")}
                  </h3>
                  <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto">
                    {movements.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs"
                      >
                        <div className="font-semibold text-white/85">
                          {t("admin.invDeltaLine", {
                            delta: `${m.delta > 0 ? "+" : ""}${m.delta}`,
                            balance: m.balance,
                          })}
                        </div>
                        <div className="mt-0.5 text-white/45">
                          {m.reason || "—"} ·{" "}
                          {m.at
                            ? new Date(m.at).toLocaleString(dateLocale)
                            : ""}
                        </div>
                      </li>
                    ))}
                    {!movements.length ? (
                      <li className="text-white/45">Chưa có giao dịch</li>
                    ) : null}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/50">
                Chọn SKU bên trái để nhập hàng hoặc xem lịch sử tồn.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
