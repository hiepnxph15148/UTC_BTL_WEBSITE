"use client";

import { fakeFeedback } from "@/lib/admin-store";

const statusStyle: Record<string, string> = {
  Open: "bg-orange-400/15 text-orange-300",
  Reviewed: "bg-sky-400/15 text-sky-300",
  Closed: "bg-white/10 text-white/60",
};

const typeStyle: Record<string, string> = {
  "Góp ý": "bg-[#ed3b6b]/15 text-[#ed3b6b]",
  "Phản ánh": "bg-amber-400/15 text-amber-300",
};

export default function AdminFeedbackPage() {
  const openCount = fakeFeedback.filter((f) => f.status === "Open").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Góp ý & phản ánh
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Xem góp ý khách hàng và phản ánh liên quan đơn hàng
          </p>
        </div>
        <p className="rounded-full border border-[#ed3b6b]/35 bg-[#ed3b6b]/10 px-3 py-1.5 text-xs font-bold text-[#ed3b6b]">
          {openCount} đang mở
        </p>
      </div>

      <div className="grid gap-4">
        {fakeFeedback.map((item) => (
          <article key={item.id} className="admin-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${typeStyle[item.type]}`}
                  >
                    {item.type}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusStyle[item.status]}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-xs text-white/40">{item.id}</span>
                </div>
                <h2 className="text-lg font-bold">{item.subject}</h2>
                <p className="mt-1 text-sm text-white/55">
                  {item.customer} · đơn {item.orderId} · {item.date}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/75">{item.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
