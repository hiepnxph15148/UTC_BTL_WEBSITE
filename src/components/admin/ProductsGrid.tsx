"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import type { AdminProduct } from "@/lib/admin-store";
import { parsePrice } from "@/data/shoes";

ModuleRegistry.registerModules([AllCommunityModule]);

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

function ProductCell(props: ICellRendererParams<AdminProduct>) {
  const p = props.data;
  if (!p) return null;
  return (
    <div className="flex h-full items-center gap-3 py-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.hero}
        alt=""
        className="h-9 w-12 rounded object-contain bg-black/30"
      />
      <p className="truncate font-semibold text-white">
        {p.name} {p.nameAccent}
      </p>
    </div>
  );
}

type Props = {
  products: AdminProduct[];
  height?: number;
};

export default function ProductsGrid({ products, height = 420 }: Props) {
  const columnDefs = useMemo<ColDef<AdminProduct>[]>(
    () => [
      {
        headerName: "Product",
        field: "name",
        flex: 2,
        minWidth: 220,
        cellRenderer: ProductCell,
        filter: true,
      },
      {
        headerName: "Category",
        field: "category",
        flex: 1,
        minWidth: 120,
        filter: true,
      },
      {
        headerName: "Price",
        field: "price",
        flex: 1,
        minWidth: 100,
        valueGetter: (p) => parsePrice(p.data?.price ?? "0"),
        valueFormatter: (p) =>
          typeof p.value === "number" ? `$${p.value.toFixed(2)}` : "",
        sortable: true,
      },
      {
        headerName: "Stock",
        field: "stock",
        flex: 0.7,
        minWidth: 90,
        sortable: true,
      },
      {
        headerName: "Sales",
        field: "sales",
        flex: 0.7,
        minWidth: 90,
        sortable: true,
      },
      {
        headerName: "Source",
        field: "source",
        flex: 0.8,
        minWidth: 100,
        cellRenderer: (p: ICellRendererParams<AdminProduct>) => (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
              p.value === "custom"
                ? "bg-[#ed3b6b]/20 text-[#ed3b6b]"
                : "bg-white/10 text-white/70"
            }`}
          >
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Created",
        field: "createdAt",
        flex: 1,
        minWidth: 120,
      },
    ],
    [],
  );

  return (
    <div style={{ height, width: "100%" }}>
      <AgGridReact<AdminProduct>
        theme={adminTheme}
        rowData={products}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          resizable: true,
          filter: false,
        }}
        rowHeight={56}
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
