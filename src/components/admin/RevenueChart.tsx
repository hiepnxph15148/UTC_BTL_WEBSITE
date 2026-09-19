"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useMemo, useState } from "react";
import { revenueSeries } from "@/lib/admin-store";
import { useLocale } from "@/context/LocaleContext";
import type { MessageKey } from "@/i18n/messages";

type Range = "weekly" | "monthly" | "yearly";

const WEEKLY_KEYS: MessageKey[] = [
  "admin.dayMon",
  "admin.dayTue",
  "admin.dayWed",
  "admin.dayThu",
  "admin.dayFri",
  "admin.daySat",
  "admin.daySun",
];

const MONTHLY_KEYS: MessageKey[] = [
  "admin.monthJul",
  "admin.monthAug",
  "admin.monthSep",
  "admin.monthOct",
  "admin.monthNov",
  "admin.monthDec",
];

export default function RevenueChart() {
  const { t } = useLocale();
  const [range, setRange] = useState<Range>("monthly");
  const data = revenueSeries[range];

  const categories = useMemo(() => {
    if (range === "weekly") return WEEKLY_KEYS.map((k) => t(k));
    if (range === "monthly") return MONTHLY_KEYS.map((k) => t(k));
    return data.map((d) => d.name);
  }, [range, data, t]);

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
      yAxis: {
        title: { text: undefined },
        gridLineColor: "rgba(255,255,255,0.08)",
        labels: { style: { color: "rgba(255,255,255,0.55)" } },
      },
      tooltip: {
        backgroundColor: "#1e1e28",
        borderColor: "rgba(255,255,255,0.12)",
        style: { color: "#fff" },
        valuePrefix: "$",
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
          data: data.map((d) => d.value),
        },
      ],
    }),
    [categories, data, t],
  );

  const ranges: { id: Range; labelKey: MessageKey }[] = [
    { id: "weekly", labelKey: "admin.chartWeekly" },
    { id: "monthly", labelKey: "admin.chartMonthly" },
    { id: "yearly", labelKey: "admin.chartYearly" },
  ];

  return (
    <div className="admin-card flex h-full min-w-0 flex-col overflow-hidden p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t("admin.chartSaleGraph")}</h2>
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
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
