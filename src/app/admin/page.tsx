"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { fakeOrders } from "@/lib/admin-store";
import { parsePrice } from "@/data/shoes";

const RevenueChart = dynamic(
  () => import("@/components/admin/RevenueChart"),
  {
    ssr: false,
    loading: () => (
      <div className="admin-card flex h-[340px] items-center justify-center text-sm text-white/45">
        Loading chart…
      </div>
    ),
  },
);

const ProductsGrid = dynamic(
  () => import("@/components/admin/ProductsGrid"),
  {
    ssr: false,
    loading: () => (
      <p className="py-10 text-center text-sm text-white/45">Loading grid…</p>
    ),
  },
);

export default function AdminDashboardPage() {
  const { products, categories, hydrated } = useAdmin();

  const totalRevenue = products.reduce(
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
      label: "Total Revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      delta: "+34.7%",
    },
    {
      label: "Active Products",
      value: String(products.length),
      delta: `+${categories.length} cats`,
    },
    {
      label: "Stock Units",
      value: String(activeStock),
      delta: "+12.4%",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Thống kê cửa hàng · quản lý sản phẩm & danh mục
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-[#ed3b6b] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(237,59,107,0.35)] transition hover:brightness-110"
          >
            + Create Product
          </Link>
          <Link
            href="/admin/categories/new"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
          >
            + Create Category
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
              <span className="font-normal text-white/40">vs last period</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <RevenueChart />

        <div className="admin-card flex flex-col p-5">
          <h2 className="mb-4 text-lg font-bold">Best Sellers</h2>
          <div className="flex-1 space-y-3">
            {(hydrated ? bestSellers : []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.hero}
                  alt=""
                  className="h-12 w-14 rounded-lg bg-[#0a0a12] object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {item.name}{" "}
                    <span style={{ color: item.accent }}>{item.nameAccent}</span>
                  </p>
                  <p className="text-sm text-white/55">{item.price}</p>
                </div>
                <p className="text-xs font-semibold text-white/45">
                  {item.sales} sales
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/admin/products"
            className="mt-4 rounded-xl border border-white/12 py-2.5 text-center text-xs font-bold uppercase tracking-[0.18em] text-white/70 transition hover:border-[#ed3b6b]/50 hover:text-white"
          >
            Report · All Products
          </Link>
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">All Products</h2>
          <p className="text-xs text-white/45">AG Grid · {products.length} rows</p>
        </div>
        {hydrated ? (
          <ProductsGrid products={products} height={380} />
        ) : (
          <p className="py-10 text-center text-sm text-white/45">Loading…</p>
        )}
      </div>

      <div className="admin-card overflow-hidden p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-bold uppercase tracking-wide text-[#ed3b6b] hover:underline"
          >
            Xem Order List →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-white/45">
              <tr className="border-b border-white/10">
                <th className="pb-3 font-semibold">Product</th>
                <th className="pb-3 font-semibold">Order ID</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Payment</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {fakeOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-white/5">
                  <td className="py-3 font-medium">{order.product}</td>
                  <td className="py-3 text-white/60">{order.id}</td>
                  <td className="py-3 text-white/60">{order.date}</td>
                  <td className="py-3 text-white/60">{order.payment}</td>
                  <td className="py-3">{order.customer}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-2 ${
                        order.status === "Canceled"
                          ? "text-orange-400"
                          : order.status === "Shipped"
                            ? "text-sky-400"
                            : order.status === "Processing"
                              ? "text-amber-300"
                              : "text-[#ed3b6b]"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 font-semibold">
                    ${order.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
