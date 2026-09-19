"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
  type RowClickedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useState } from "react";
import { fakeOrders } from "@/lib/admin-store";
import { readOrdersFromStorage, type StoredOrder } from "@/lib/orders";
import { formatVnd, OrderState, storeApi, type OrderDto } from "@/lib/api";
import {
  displayOrderNumber,
  formatAddressRecipient,
} from "@/lib/format-display";
import {
  orderStateKey,
  orderStatusCanonFromDemo,
  orderStatusCanonFromState,
  orderStatusKeyFromCanon,
  orderStatusTone,
  paymentStateKey,
  useAdmin,
  type OrderStatusCanon,
} from "@/context/AdminContext";
import { useLocale } from "@/context/LocaleContext";
import OrderDetailPanel from "@/components/admin/OrderDetailPanel";

ModuleRegistry.registerModules([AllCommunityModule]);

type OrderRow = {
  id: string;
  orderId: string;
  product: string;
  date: string;
  payment: string;
  customer: string;
  status: string;
  statusCanon: OrderStatusCanon;
  amount: number;
  raw?: OrderDto;
};

const adminTheme = themeQuartz.withParams({
  backgroundColor: "#1a1a22",
  foregroundColor: "#f5f5f7",
  borderColor: "rgba(255,255,255,0.08)",
  headerBackgroundColor: "#14141c",
  headerTextColor: "rgba(255,255,255,0.72)",
  oddRowBackgroundColor: "#17171f",
  rowHoverColor: "rgba(237,59,107,0.12)",
  selectedRowBackgroundColor: "rgba(237,59,107,0.18)",
  fontFamily: "var(--font-manrope), sans-serif",
  fontSize: 13,
  borderRadius: 10,
  spacing: 8,
  accentColor: "#ed3b6b",
});

function StatusCell(props: ICellRendererParams<OrderRow>) {
  const status = (props.value as string) || "";
  const color = orderStatusTone(props.data?.statusCanon ?? "pending");

  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function OrdersGrid() {
  const { orders, fromApi, refresh } = useAdmin();
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderDto | null>(null);
  const [stateFilter, setStateFilter] = useState<"" | OrderState>("");
  const [search, setSearch] = useState("");
  const [expiring, setExpiring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const toRow = (
      order: StoredOrder | (typeof fakeOrders)[number],
    ): OrderRow => {
      const statusCanon = orderStatusCanonFromDemo(order.status);
      return {
        id: order.id,
        orderId: order.id,
        product: order.product,
        date: order.date,
        payment: order.payment,
        customer: order.customer,
        status: t(orderStatusKeyFromCanon(statusCanon)),
        statusCanon,
        amount: order.amount,
      };
    };

    const apiToRow = (order: OrderDto): OrderRow => {
      const statusCanon = orderStatusCanonFromState(order.state);
      return {
        id: order.id,
        orderId: displayOrderNumber(order.number, order.id),
        product: order.trackingCode || order.carrier || t("admin.codOrder"),
        date: order.reservationExpiresAt?.slice(0, 10) || "",
        payment: t(paymentStateKey(order.paymentState)),
        customer: formatAddressRecipient(
          order.addressSnapshot,
          t("admin.customerFallback"),
        ),
        status: t(orderStateKey(order.state)),
        statusCanon,
        amount: order.total,
        raw: order,
      };
    };

    if (fromApi) {
      const filtered = orders.filter((order) => {
        if (stateFilter !== "" && order.state !== stateFilter) return false;
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          (order.number || "").toLowerCase().includes(q) ||
          (order.addressSnapshot || "").toLowerCase().includes(q) ||
          (order.trackingCode || "").toLowerCase().includes(q)
        );
      });
      setRows(filtered.map(apiToRow));
      return;
    }

    const live = readOrdersFromStorage().map(toRow);
    const seed = fakeOrders.map(toRow);
    const ids = new Set(live.map((o) => o.id));
    setRows([...live, ...seed.filter((o) => !ids.has(o.id))]);
  }, [orders, fromApi, stateFilter, search, t, locale]);

  const columnDefs = useMemo<ColDef<OrderRow>[]>(
    () => [
      {
        headerName: t("admin.colOrderId"),
        field: "orderId",
        flex: 0.9,
        minWidth: 110,
      },
      {
        headerName: t("admin.colProduct"),
        field: "product",
        flex: 1.2,
        minWidth: 140,
        filter: true,
      },
      { headerName: t("admin.colDate"), field: "date", flex: 0.8, minWidth: 110 },
      {
        headerName: "COD",
        field: "payment",
        flex: 0.9,
        minWidth: 110,
        filter: true,
      },
      {
        headerName: t("admin.colCustomer"),
        field: "customer",
        flex: 1.2,
        minWidth: 140,
        filter: true,
      },
      {
        headerName: t("admin.colStatus"),
        field: "status",
        flex: 1,
        minWidth: 130,
        cellRenderer: StatusCell,
        filter: true,
      },
      {
        headerName: t("admin.colAmount"),
        field: "amount",
        flex: 0.8,
        minWidth: 110,
        valueFormatter: (p) =>
          typeof p.value === "number" ? formatVnd(p.value) : "",
        sortable: true,
      },
    ],
    [t],
  );

  const onRowClicked = (e: RowClickedEvent<OrderRow>) => {
    if (e.data?.raw) setSelected(e.data.raw);
  };

  const expirePending = async () => {
    setExpiring(true);
    setMessage(null);
    try {
      await storeApi.expireReservations();
      await refresh();
      setMessage(t("admin.expireDone"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không hết hạn được");
    } finally {
      setExpiring(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-white/50">
          {t("admin.filterStatus")}
          <select
            value={stateFilter === "" ? "" : String(stateFilter)}
            onChange={(e) =>
              setStateFilter(
                e.target.value === ""
                  ? ""
                  : (Number(e.target.value) as OrderState),
              )
            }
            className="mt-1 block rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="">{t("admin.filterAll")}</option>
            <option value={OrderState.Pending}>
              {t(orderStateKey(OrderState.Pending))}
            </option>
            <option value={OrderState.Confirmed}>
              {t(orderStateKey(OrderState.Confirmed))}
            </option>
            <option value={OrderState.Shipped}>
              {t(orderStateKey(OrderState.Shipped))}
            </option>
            <option value={OrderState.Delivered}>
              {t(orderStateKey(OrderState.Delivered))}
            </option>
            <option value={OrderState.Cancelled}>
              {t(orderStateKey(OrderState.Cancelled))}
            </option>
          </select>
        </label>
        <label className="min-w-[180px] flex-1 text-xs text-white/50">
          {t("admin.searchOrder")}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SO-…"
            className="mt-1 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
          />
        </label>
        {fromApi ? (
          <button
            type="button"
            disabled={expiring}
            onClick={() => void expirePending()}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/75 hover:bg-white/5 disabled:opacity-50"
          >
            {expiring ? t("admin.saving") : t("admin.expireReservations")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
        >
          {t("common.refresh")}
        </button>
      </div>

      {message ? (
        <p className="text-xs text-white/55">{message}</p>
      ) : null}

      <div
        className={`grid gap-4 ${selected ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]" : ""}`}
      >
        <div
          className="relative z-0 min-w-0 overflow-hidden"
          style={{ height: selected ? 560 : 520, width: "100%" }}
        >
          <AgGridReact<OrderRow>
            theme={adminTheme}
            rowData={rows}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, resizable: true }}
            rowHeight={48}
            headerHeight={44}
            animateRows
            pagination
            paginationPageSize={8}
            paginationPageSizeSelector={[8, 16, 32]}
            getRowId={(p) => p.data.id}
            onRowClicked={onRowClicked}
          />
        </div>
        {selected ? (
          <div className="relative z-10 min-w-0">
            <OrderDetailPanel
              order={selected}
              onClose={() => setSelected(null)}
              onChanged={async () => {
                await refresh();
                const updated = (await storeApi.getAdminOrder(selected.id)).order;
                setSelected(updated);
              }}
            />
          </div>
        ) : null}
      </div>

      {fromApi ? (
        <p className="text-xs text-white/40">
          {t("admin.ordersClickHint")}
        </p>
      ) : null}
    </div>
  );
}
