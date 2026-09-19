"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  orderStateKey,
  orderStatusCanonFromDemo,
  orderStatusCanonFromState,
  orderStatusKeyFromCanon,
  orderStatusTone,
  useAdmin,
} from "@/context/AdminContext";
import { useLocale } from "@/context/LocaleContext";
import { fakeOrders } from "@/lib/admin-store";
import { parsePrice } from "@/data/shoes";
import { formatVnd } from "@/lib/api";
import {
  displayOrderNumber,
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

export default function AdminDashboardPage() {
  const { products, categories, hydrated, fromApi, error, report, orders } =
    useAdmin();
  const { t } = useLocale();

  const totalRevenue =
    report?.deliveredSales ??
    products.reduce(
      (sum, p) =>
        sum + parsePrice(p.price) * Math.max(1, Math.floor(p.sales / 50)),
      0,
    );
  const activeStock = products.reduce((sum, p) => sum + p.stock, 0);
  const bestSellers = [...products]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  const stats = [
    {
      label: t("admin.statRevenue"),
      value: report
        ? formatVnd(totalRevenue)
        : `$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      delta: fromApi ? t("admin.statApiReport") : "+34.7%",
    },
    {
      label: t("admin.statProducts"),
      value: String(products.length),
      delta: t("admin.statCatsDelta", { count: categories.length }),
    },
    {
      label: fromApi ? t("admin.statOrdersPeriod") : t("admin.statStockUnits"),
      value: fromApi ? String(report?.orders ?? orders.length) : String(activeStock),
      delta: fromApi
        ? t("admin.statCancelled", { count: report?.cancelled ?? 0 })
        : "+12.4%",
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
            <p className="mt-2 text-xs font-semibold text-[#ed3b6b]">
              ↑ {stat.delta}{" "}
              <span className="font-normal text-white/40">
                {t("admin.vsLastPeriod")}
              </span>
            </p>
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
              {(fromApi && orders.length
                ? orders.slice(0, 5).map((order) => {
                    const statusCanon = orderStatusCanonFromState(order.state);
                    return {
                      id: displayOrderNumber(order.number, order.id),
                      product:
                        order.carrier ||
                        order.trackingCode ||
                        t("admin.codOrder"),
                      date: order.reservationExpiresAt?.slice(0, 10) || "—",
                      payment: "COD",
                      customer: formatAddressRecipient(
                        order.addressSnapshot,
                        t("admin.customerFallback"),
                      ),
                      status: t(orderStateKey(order.state)),
                      statusCanon,
                      amount: order.total,
                      amountLabel: formatVnd(order.total),
                    };
                  })
                : fakeOrders.slice(0, 5).map((order) => {
                    const statusCanon = orderStatusCanonFromDemo(order.status);
                    return {
                      ...order,
                      status: t(orderStatusKeyFromCanon(statusCanon)),
                      statusCanon,
                      amountLabel: `$${order.amount.toFixed(2)}`,
                    };
                  })
              ).map((order) => (
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
