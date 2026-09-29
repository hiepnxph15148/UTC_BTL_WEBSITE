"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AdminProduct } from "@/lib/admin-store";
import { parsePrice } from "@/data/shoes";
import { formatVnd } from "@/lib/api";
import { useLocale } from "@/context/LocaleContext";

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
      <span className="truncate font-semibold text-white">
        {p.name} {p.nameAccent}
      </span>
    </div>
  );
}

function ActionsCell(props: ICellRendererParams<AdminProduct>) {
  const p = props.data;
  const { t } = useLocale();
  if (!p) return null;
  return (
    <Link
      href={`/admin/products/${p.id}`}
      className="inline-flex rounded-lg border border-white/15 px-2.5 py-1 text-xs font-bold text-white/80 hover:bg-white/5 hover:text-white"
      onClick={(e) => e.stopPropagation()}
    >
      {t("common.view")}
    </Link>
  );
}

type Props = {
  products: AdminProduct[];
  height?: number;
};

export default function ProductsGrid({ products, height = 420 }: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const columnDefs = useMemo<ColDef<AdminProduct>[]>(
    () => [
      {
        headerName: t("admin.gridProduct"),
        field: "name",
        flex: 2,
        minWidth: 220,
        cellRenderer: ProductCell,
        filter: true,
      },
      {
        headerName: t("admin.gridCategory"),
        field: "category",
        flex: 1,
        minWidth: 120,
        filter: true,
      },
      {
        headerName: t("admin.gridPrice"),
        field: "price",
        flex: 1,
        minWidth: 100,
        valueGetter: (p) => {
          const raw = p.data?.price?.trim() || "";
          if (!raw || raw === "—" || raw === "-") return null;
          const n = parsePrice(raw);
          return n > 0 ? n : null;
        },
        valueFormatter: (p) =>
          typeof p.value === "number" && p.value > 0
            ? formatVnd(p.value)
            : "—",
        sortable: true,
      },
      {
        headerName: t("admin.gridStock"),
        field: "stock",
        flex: 0.7,
        minWidth: 90,
        sortable: true,
      },
      {
        headerName: t("admin.gridSales"),
        field: "sales",
        flex: 0.7,
        minWidth: 90,
        sortable: true,
      },
      {
        headerName: t("admin.gridSource"),
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
            {p.value === "custom"
              ? t("admin.sourceCustom")
              : t("admin.sourceSeed")}
          </span>
        ),
      },
      {
        headerName: t("admin.gridCreated"),
        field: "createdAt",
        flex: 1,
        minWidth: 120,
      },
      {
        headerName: "",
        colId: "actions",
        width: 100,
        maxWidth: 110,
        sortable: false,
        filter: false,
        cellRenderer: ActionsCell,
      },
    ],
    [t],
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
        onRowClicked={(e) => {
          if (e.data?.id) router.push(`/admin/products/${e.data.id}`);
        }}
      />
    </div>
  );
}
