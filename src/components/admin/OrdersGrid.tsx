"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useState } from "react";
import { fakeOrders } from "@/lib/admin-store";
import { readOrdersFromStorage, type StoredOrder } from "@/lib/orders";

ModuleRegistry.registerModules([AllCommunityModule]);

type OrderRow = {
  id: string;
  product: string;
  date: string;
  payment: string;
  customer: string;
  status: string;
  amount: number;
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
        : status === "Processing"
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
    product: order.product,
    date: order.date,
    payment: order.payment,
    customer: order.customer,
    status: order.status,
    amount: order.amount,
  };
}

export default function OrdersGrid() {
  const [rows, setRows] = useState<OrderRow[]>(() => fakeOrders.map(toRow));

  useEffect(() => {
    const live = readOrdersFromStorage().map(toRow);
    const seed = fakeOrders.map(toRow);
    const ids = new Set(live.map((o) => o.id));
    setRows([...live, ...seed.filter((o) => !ids.has(o.id))]);
  }, []);

  const columnDefs = useMemo<ColDef<OrderRow>[]>(
    () => [
      {
        headerName: "Product",
        field: "product",
        flex: 1.4,
        minWidth: 180,
        filter: true,
      },
      { headerName: "Order ID", field: "id", flex: 0.9, minWidth: 110 },
      { headerName: "Date", field: "date", flex: 0.9, minWidth: 120 },
      {
        headerName: "Payment",
        field: "payment",
        flex: 0.9,
        minWidth: 110,
        filter: true,
      },
      {
        headerName: "Customer",
        field: "customer",
        flex: 1.2,
        minWidth: 150,
        filter: true,
      },
      {
        headerName: "Status",
        field: "status",
        flex: 1,
        minWidth: 130,
        cellRenderer: StatusCell,
        filter: true,
      },
      {
        headerName: "Amount",
        field: "amount",
        flex: 0.8,
        minWidth: 110,
        valueFormatter: (p) =>
          typeof p.value === "number" ? `$${p.value.toFixed(2)}` : "",
        sortable: true,
      },
    ],
    [],
  );

  return (
    <div style={{ height: 520, width: "100%" }}>
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
      />
    </div>
  );
}
