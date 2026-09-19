"use client";

import dynamic from "next/dynamic";
import { useAdmin } from "@/context/AdminContext";
import { useLocale } from "@/context/LocaleContext";

function OrdersLoading() {
  const { t } = useLocale();
  return (
    <p className="py-16 text-center text-sm text-white/45">
      {t("admin.ordersLoading")}
    </p>
  );
}

const OrdersGrid = dynamic(() => import("@/components/admin/OrdersGrid"), {
  ssr: false,
  loading: () => <OrdersLoading />,
});

export default function AdminOrdersPage() {
  const { fromApi, error } = useAdmin();
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("admin.ordersTitle")}
        </h1>
        <p className="mt-1 text-sm text-white/55">
          {fromApi ? t("admin.ordersApiHint") : t("admin.ordersBreadcrumb")}
        </p>
        {error ? (
          <p className="mt-1 text-xs text-amber-200/80">{error}</p>
        ) : null}
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{t("admin.ordersRecent")}</h2>
          <p className="text-xs text-white/45">
            {fromApi ? t("admin.ordersApiMeta") : t("admin.ordersDemoMeta")}
          </p>
        </div>
        <OrdersGrid />
      </div>
    </div>
  );
}
