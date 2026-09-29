"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import {
  orderStateKey,
  orderStatusCanonFromState,
  orderStatusTone,
  useAdmin,
} from "@/context/AdminContext";
import { useLocale } from "@/context/LocaleContext";
import { formatVnd, type OrderDetailDto } from "@/lib/api";
import { OrderState } from "@/lib/api/types";
import {
  displayOrderNumber,
  displayProductName,
  formatAddressRecipient,
} from "@/lib/format-display";

const RevenueChart = dynamic(
  () => import("@/components/admin/RevenueChart"),
  {
    ssr: false,
    loading: () => <ChartLoadingFallback />,
  },
);

const ProductsGrid = dynamic(
  () => import("@/components/admin/ProductsGrid"),
  {
    ssr: false,
    loading: () => <GridLoadingFallback />,
  },
);

function ChartLoadingFallback() {
  const { t } = useLocale();
  return (
    <div className="admin-card flex h-[340px] items-center justify-center text-sm text-white/45">
      {t("admin.loadingChart")}
    </div>
  );
}

function GridLoadingFallback() {
  const { t } = useLocale();
  return (
    <p className="py-10 text-center text-sm text-white/45">
      {t("admin.loadingGrid")}
    </p>
  );
}

function orderCreatedLabel(detail: OrderDetailDto | undefined) {
  const times = (detail?.history || [])
    .map((h) => h.at)
    .filter(Boolean)
    .sort();
  return times[0]?.slice(0, 10) || "—";
}

function orderProductsLabel(
  detail: OrderDetailDto | undefined,
  fallback: string,
) {
  const names = (detail?.items || [])
    .map((line) =>
      displayProductName(line.productName, line.skuCode),
    )
    .filter(Boolean);
  if (!names.length) return fallback;
  if (names.length === 1) return names[0]!;
  return `${names[0]} +${names.length - 1}`;
}

export default function AdminDashboardPage() {
  const {
    products,
    categories,
    hydrated,
    fromApi,
    error,
    report,
    orders,
    orderDetails,
  } = useAdmin();
  const { t } = useLocale();

  const totalRevenue = fromApi
    ? report?.deliveredSales ?? 0
    : 0;
  const activeStock = products.reduce((sum, p) => sum + p.stock, 0);

  const bestSellers = useMemo(() => {
    const ranked = [...products]
      .filter((p) => (fromApi ? p.sales > 0 : true))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);
    if (ranked.length) return ranked;
    // Chưa có đơn bán: hiện 3 sản phẩm mới nhất theo list API (không bịa số bán)
    return products.slice(0, 3).map((p) => ({ ...p, sales: p.sales || 0 }));
  }, [products, fromApi]);

  const recentOrders = useMemo(() => {
    if (!fromApi) return [];
    return orders.slice(0, 5).map((order) => {
      const detail = orderDetails[order.id];
      const statusCanon = orderStatusCanonFromState(order.state);
      return {
        id: displayOrderNumber(order.number, order.id),
        product: orderProductsLabel(detail, t("admin.codOrder")),
        date: orderCreatedLabel(detail),
        payment: "COD",
        customer: formatAddressRecipient(
          order.addressSnapshot,
          t("admin.customerFallback"),
        ),
        status: t(orderStateKey(order.state)),
        statusCanon,
        amountLabel: formatVnd(order.total),
        cancelled: order.state === OrderState.Cancelled,
      };
    });
  }, [fromApi, orders, orderDetails, t]);

  const stats = fromApi
    ? [
        {
          label: t("admin.statRevenue"),
          value: formatVnd(totalRevenue),
          hint: t("admin.statRevenueHint", {
            cod: formatVnd(report?.codCollected ?? 0),
            net: formatVnd(report?.netCollected ?? 0),
          }),
        },
        {
          label: t("admin.statProducts"),
          value: String(products.length),
          hint: t("admin.statCatsDelta", { count: categories.length }),
        },
        {
          label: t("admin.statOrdersPeriod"),
          value: String(report?.orders ?? orders.length),
          hint: t("admin.statOrdersHint", {
            cancelled: report?.cancelled ?? 0,
            returns: report?.openReturns ?? 0,
            lowStock: report?.lowStockSkus ?? 0,
          }),
        },
      ]
    : [
        {
          label: t("admin.statProducts"),
          value: String(products.length),
          hint: t("admin.statCatsDelta", { count: categories.length }),
        },
        {
          label: t("admin.statStockUnits"),
          value: String(activeStock),
          hint: t("admin.dashOfflineHint"),
        },
        {
          label: t("admin.statOrdersPeriod"),
          value: "—",
          hint: t("admin.dashOfflineHint"),
        },
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {t("admin.dashTitle")}
          </h1>
          <p className="mt-1 text-sm text-white/55">
            {fromApi ? t("admin.apiConnected") : t("admin.dashSubtitle")}
          </p>
          {error ? (
            <p className="mt-1 text-xs text-amber-200/80">{error}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)] transition hover:brightness-110"
          >
            + {t("admin.createProduct")}
          </Link>
          <Link
            href="/admin/categories/new"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            + {t("admin.createCategory")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-white/55">{stat.label}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ed3b6b]/20 text-[#ed3b6b]">
                ◆
              </span>
            </div>
            <p className="text-3xl font-extrabold">{stat.value}</p>
            <p className="mt-2 text-xs text-white/45">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="min-w-0">
          <RevenueChart />
        </div>

        <div className="admin-card flex min-w-0 flex-col overflow-hidden p-5">
          <h2 className="mb-4 shrink-0 text-lg font-bold">
            {t("admin.bestSellers")}
          </h2>
          <div className="min-w-0 flex-[1_1_0%] space-y-3">
            {(hydrated ? bestSellers : []).map((item) => (
              <div
                key={item.id}
                className="flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-white/8 bg-black/20 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.hero}
                  alt=""
                  className="h-12 w-14 shrink-0 rounded-lg bg-[#0a0a12] object-contain"
                />
                <div className="min-w-0 flex-[1_1_0%] overflow-hidden">
                  <p className="truncate font-semibold">
                    {item.name}{" "}
                    <span style={{ color: item.accent }}>{item.nameAccent}</span>
                  </p>
                  <p className="truncate text-sm text-white/55">{item.price}</p>
                </div>
                <p className="shrink-0 whitespace-nowrap text-xs font-semibold text-white/45">
                  {t("admin.salesCount", { count: item.sales })}
                </p>
              </div>
            ))}
            {hydrated && !bestSellers.length ? (
              <p className="py-8 text-center text-sm text-white/45">
                {t("home.empty")}
              </p>
            ) : null}
          </div>
          <Link
            href="/admin/products"
            className="mt-4 rounded-xl border border-white/12 py-2.5 text-center text-xs font-bold uppercase tracking-[0.18em] text-white/70 transition hover:border-[#ed3b6b]/50 hover:text-white"
          >
            {t("admin.reportAllProducts")}
          </Link>
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{t("admin.products")}</h2>
          <p className="text-xs text-white/45">
            {t("admin.gridRows", { count: products.length })}
          </p>
        </div>
        {hydrated ? (
          <ProductsGrid products={products} height={380} />
        ) : (
          <p className="py-10 text-center text-sm text-white/45">
            {t("common.loading")}
          </p>
        )}
      </div>

      <div className="admin-card overflow-hidden p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{t("admin.ordersRecent")}</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-bold uppercase tracking-wide text-[#ed3b6b] hover:underline"
          >
            {t("admin.ordersViewAll")}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/45">
              <tr className="border-b border-white/10">
                <th className="pb-3 font-semibold">{t("admin.colProduct")}</th>
                <th className="pb-3 font-semibold">{t("admin.colOrderId")}</th>
                <th className="pb-3 font-semibold">{t("admin.colDate")}</th>
                <th className="pb-3 font-semibold">{t("admin.colPayment")}</th>
                <th className="pb-3 font-semibold">{t("admin.colCustomer")}</th>
                <th className="pb-3 font-semibold">{t("admin.colStatus")}</th>
                <th className="pb-3 font-semibold">{t("admin.colAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/5">
                  <td className="py-3 font-medium">{order.product}</td>
                  <td className="py-3 text-white/60">{order.id}</td>
                  <td className="py-3 text-white/60">{order.date}</td>
                  <td className="py-3 text-white/60">{order.payment}</td>
                  <td className="py-3">{order.customer}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-2 ${orderStatusTone(order.statusCanon)}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 font-semibold">{order.amountLabel}</td>
                </tr>
              ))}
              {!recentOrders.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-white/45"
                  >
                    {fromApi
                      ? t("orders.empty")
                      : t("admin.dashOfflineHint")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
