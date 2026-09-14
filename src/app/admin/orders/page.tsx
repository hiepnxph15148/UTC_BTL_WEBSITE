"use client";

import dynamic from "next/dynamic";
import { useAdmin } from "@/context/AdminContext";

const OrdersGrid = dynamic(() => import("@/components/admin/OrdersGrid"), {
  ssr: false,
  loading: () => (
    <p className="py-16 text-center text-sm text-white/45">Loading orders…</p>
  ),
});

export default function AdminOrdersPage() {
  const { fromApi, error } = useAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Order List</h1>
        <p className="mt-1 text-sm text-white/55">
          {fromApi
            ? "Đơn từ API · xác nhận, giao hàng, thu COD"
            : "Home > Order List · danh sách đơn (local/demo nếu chưa login API)"}
        </p>
        {error ? (
          <p className="mt-1 text-xs text-amber-200/80">{error}</p>
        ) : null}
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Recent Purchases</h2>
          <p className="text-xs text-white/45">
            {fromApi ? "admin-orders + admin-order" : "AG Grid · demo"}
          </p>
        </div>
        <OrdersGrid />
      </div>
    </div>
  );
}
