"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useEffect, useMemo, useState } from "react";
import { formatVnd, storeApi } from "@/lib/api";
import { useAdmin } from "@/context/AdminContext";
import { useLocale } from "@/context/LocaleContext";
import { revenueSeries } from "@/lib/admin-store";
import type { MessageKey } from "@/i18n/messages";

type Range = "weekly" | "monthly" | "yearly";

type Point = { name: string; value: number };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

function buildBuckets(range: Range, labels: string[]): { name: string; from: string; to: string }[] {
  const now = new Date();

  if (range === "weekly") {
    // 7 ngày gần nhất (hôm nay là cột cuối)
    return Array.from({ length: 7 }, (_, i) => {
      const offset = 6 - i;
      const from = startOfDay(now);
      from.setDate(from.getDate() - offset);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return {
        name: labels[from.getDay()] || from.toLocaleDateString("vi-VN"),
        from: from.toISOString(),
        to: to.toISOString(),
      };
    });
  }

  if (range === "monthly") {
    // 6 tháng gần nhất
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const from = startOfMonth(now);
      from.setMonth(from.getMonth() - offset);
      const to = new Date(from);
      to.setMonth(to.getMonth() + 1);
      return {
        name: labels[from.getMonth()] || `${from.getMonth() + 1}`,
        from: from.toISOString(),
        to: to.toISOString(),
      };
    });
  }

  // 6 năm gần nhất
  return Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const year = now.getFullYear() - offset;
    const from = startOfYear(new Date(year, 0, 1));
    const to = startOfYear(new Date(year + 1, 0, 1));
    return {
      name: String(year),
      from: from.toISOString(),
      to: to.toISOString(),
    };
  });
}

export default function RevenueChart() {
  const { t, locale } = useLocale();
  const { fromApi } = useAdmin();
  const [range, setRange] = useState<Range>("monthly");
  const [points, setPoints] = useState<Point[]>(revenueSeries.monthly);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekdayLabels = useMemo(() => {
    // getDay(): 0=CN … 6=T7
    const keys: MessageKey[] = [
      "admin.daySun",
      "admin.dayMon",
      "admin.dayTue",
      "admin.dayWed",
      "admin.dayThu",
      "admin.dayFri",
      "admin.daySat",
    ];
    return keys.map((k) => t(k));
  }, [t]);

  const monthLabels = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      new Date(2026, i, 1).toLocaleString(locale === "en" ? "en-US" : "vi-VN", {
        month: "short",
      }),
    );
  }, [locale]);

  useEffect(() => {
    let cancelled = false;

    if (!fromApi) {
      setPoints(revenueSeries[range]);
      setError(null);
      setLoading(false);
      return;
    }

    const labels = range === "weekly" ? weekdayLabels : monthLabels;
    const buckets = buildBuckets(range, labels);

    setLoading(true);
    setError(null);

    Promise.all(
      buckets.map((b) =>
        storeApi.getReport(b.from, b.to).then((report) => ({
          name: b.name,
          // Doanh số đơn đã giao (Total, sau giảm, gồm ship)
          value: Number(report.deliveredSales) || 0,
        })),
      ),
    )
      .then((series) => {
        if (cancelled) return;
        setPoints(series);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được biểu đồ");
        setPoints(buckets.map((b) => ({ name: b.name, value: 0 })));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fromApi, range, weekdayLabels, monthLabels]);

  const categories = useMemo(() => points.map((p) => p.name), [points]);

  const options = useMemo<Highcharts.Options>(
    () => ({
      chart: {
        type: "areaspline",
        backgroundColor: "transparent",
        height: 280,
        style: { fontFamily: "var(--font-manrope), sans-serif" },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories,
        lineColor: "rgba(255,255,255,0.12)",
        tickColor: "rgba(255,255,255,0.12)",
        labels: { style: { color: "rgba(255,255,255,0.55)" } },
      },
      tooltip: {
        backgroundColor: "#1e1e28",
        borderColor: "rgba(255,255,255,0.12)",
        style: { color: "#fff" },
        formatter: function () {
          const y = typeof this.y === "number" ? this.y : 0;
          return `<span style="font-size:11px">${this.x}</span><br/><b>${formatVnd(y)}</b>`;
        },
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: "rgba(255,255,255,0.08)",
        labels: {
          style: { color: "rgba(255,255,255,0.55)" },
          formatter: function () {
            const v =
              typeof this.value === "number" ? this.value : Number(this.value);
            if (!Number.isFinite(v)) return "";
            if (Math.abs(v) >= 1_000_000_000) {
              return `${(v / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
            }
            if (Math.abs(v) >= 1_000_000) {
              return `${(v / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}tr`;
            }
            return formatVnd(v);
          },
        },
      },
      plotOptions: {
        areaspline: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, "rgba(237,59,107,0.45)"],
              [1, "rgba(237,59,107,0.02)"],
            ],
          },
          marker: {
            enabled: true,
            radius: 4,
            fillColor: "#ed3b6b",
            lineWidth: 0,
          },
          lineWidth: 3,
          color: "#ed3b6b",
        },
      },
      series: [
        {
          type: "areaspline",
          name: t("admin.chartRevenue"),
          data: points.map((d) => d.value),
        },
      ],
    }),
    [categories, points, t],
  );

  const ranges: { id: Range; labelKey: MessageKey }[] = [
    { id: "weekly", labelKey: "admin.chartWeekly" },
    { id: "monthly", labelKey: "admin.chartMonthly" },
    { id: "yearly", labelKey: "admin.chartYearly" },
  ];

  return (
    <div className="admin-card flex h-full min-w-0 flex-col overflow-hidden p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t("admin.chartSaleGraph")}</h2>
          <p className="mt-0.5 text-[11px] text-white/40">
            {fromApi
              ? "Theo đơn đã giao (API report)"
              : "Dữ liệu demo (chưa nối API)"}
          </p>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-black/20 p-1">
          {ranges.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
                range === item.id
                  ? "bg-[#ed3b6b] text-white"
                  : "text-white/55 hover:text-white"
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="mb-2 text-xs text-amber-200/80">{error}</p>
      ) : null}
      {loading ? (
        <p className="flex flex-1 items-center justify-center text-sm text-white/45">
          {t("admin.loadingChart")}
        </p>
      ) : (
        <HighchartsReact highcharts={Highcharts} options={options} />
      )}
    </div>
  );
}
