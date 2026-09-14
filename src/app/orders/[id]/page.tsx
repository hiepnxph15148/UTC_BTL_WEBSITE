"use client";

import { Suspense } from "react";
import OrderInvoiceContent from "./OrderInvoiceContent";
import PageShell from "@/components/PageShell";

export default function OrderInvoicePage() {
  return (
    <Suspense
      fallback={
        <PageShell title="Hóa đơn" subtitle="Đang tải…">
          <p className="text-white/60">Loading…</p>
        </PageShell>
      }
    >
      <OrderInvoiceContent />
    </Suspense>
  );
}
