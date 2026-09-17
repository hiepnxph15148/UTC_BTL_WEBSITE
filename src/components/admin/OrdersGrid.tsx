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
  orderStateLabel,
  paymentStateLabel,
  useAdmin,
} from "@/context/AdminContext";
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
  const status = props.value as string;
  const color =
    status === "Canceled"
      ? "text-orange-400"
      : status === "Shipped"
        ? "text-sky-400"
        : status === "Delivered"
          ? "text-emerald-400"
          : status === "Processing" || status === "Confirmed"
            ? "text-amber-300"
            : "text-[#ed3b6b]";

  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function toRow(order: StoredOrder | (typeof fakeOrders)[number]): OrderRow {
  return {
    id: order.id,
    orderId: order.id,
    product: order.product,
    date: order.date,
    payment: order.payment,
    customer: order.customer,
    status: order.status,
    amount: order.amount,
  };
}

function apiToRow(order: OrderDto): OrderRow {
  return {
    id: order.id,
    orderId: displayOrderNumber(order.number, order.id),
    product: order.trackingCode || order.carrier || "Đơn COD",
    date: order.reservationExpiresAt?.slice(0, 10) || "",
    payment: paymentStateLabel(order.paymentState),
    customer: formatAddressRecipient(order.addressSnapshot, "Khách"),
    status: orderStateLabel(order.state),
    amount: order.total,
    raw: order,
  };
}

export default function OrdersGrid() {
  const { orders, fromApi, refresh } = useAdmin();
  const [rows, setRows] = useState<OrderRow[]>(() => fakeOrders.map(toRow));
  const [selected, setSelected] = useState<OrderDto | null>(null);
  const [stateFilter, setStateFilter] = useState<"" | OrderState>("");
  const [search, setSearch] = useState("");
  const [expiring, setExpiring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
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
  }, [orders, fromApi, stateFilter, search]);

  const columnDefs = useMemo<ColDef<OrderRow>[]>(
    () => [
      {
        headerName: "Mã đơn",
        field: "orderId",
        flex: 0.9,
        minWidth: 110,
      },
      {
        headerName: "Vận đơn / ghi chú",
        field: "product",
        flex: 1.2,
        minWidth: 140,
        filter: true,
      },
      { headerName: "Hạn giữ", field: "date", flex: 0.8, minWidth: 110 },
      {
        headerName: "COD",
        field: "payment",
        flex: 0.9,
        minWidth: 110,
        filter: true,
      },
      {
        headerName: "Khách",
        field: "customer",
        flex: 1.2,
        minWidth: 140,
        filter: true,
      },
      {
        headerName: "Trạng thái",
        field: "status",
        flex: 1,
        minWidth: 130,
        cellRenderer: StatusCell,
        filter: true,
      },
      {
        headerName: "Tổng",
        field: "amount",
        flex: 0.8,
        minWidth: 110,
        valueFormatter: (p) =>
          typeof p.value === "number" ? formatVnd(p.value) : "",
        sortable: true,
      },
    ],
    [],
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
      setMessage("Đã giải phóng các đơn Pending hết hạn giữ hàng.");
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
          Lọc trạng thái
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
            <option value="">Tất cả</option>
            <option value={OrderState.Pending}>Pending</option>
            <option value={OrderState.Confirmed}>Confirmed</option>
            <option value={OrderState.Shipped}>Shipped</option>
            <option value={OrderState.Delivered}>Delivered</option>
            <option value={OrderState.Cancelled}>Cancelled</option>
          </select>
        </label>
        <label className="min-w-[180px] flex-1 text-xs text-white/50">
          Tìm số đơn
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
            {expiring ? "Đang xử lý…" : "Hết hạn giữ hàng"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
        >
          Làm mới
        </button>
      </div>

      {message ? (
        <p className="text-xs text-white/55">{message}</p>
      ) : null}

      <div
        className={`grid gap-4 ${selected ? "xl:grid-cols-[1.15fr_0.85fr]" : ""}`}
      >
        <div style={{ height: selected ? 560 : 520, width: "100%" }}>
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
          <OrderDetailPanel
            order={selected}
            onClose={() => setSelected(null)}
            onChanged={async () => {
              await refresh();
              const updated = (await storeApi.getAdminOrder(selected.id)).order;
              setSelected(updated);
            }}
          />
        ) : null}
      </div>

      {fromApi ? (
        <p className="text-xs text-white/40">
          Bấm một dòng để mở chi tiết và xử lý: xác nhận → giao → thu COD.
        </p>
      ) : null}
    </div>
  );
}
