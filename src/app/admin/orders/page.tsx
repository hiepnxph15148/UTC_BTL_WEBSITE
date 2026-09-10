"use client";

import dynamic from "next/dynamic";

const OrdersGrid = dynamic(() => import("@/components/admin/OrdersGrid"), {
  ssr: false,
  loading: () => (
    <p className="py-16 text-center text-sm text-white/45">Loading orders…</p>
  ),
});

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order List</h1>
        <p className="mt-1 text-sm text-white/55">
          Home &gt; Order List · danh sách đơn đã mua hàng
        </p>
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Recent Purchases</h2>
          <p className="text-xs text-white/45">AG Grid · đơn hàng demo</p>
        </div>
        <OrdersGrid />
      </div>
    </div>
  );
}
