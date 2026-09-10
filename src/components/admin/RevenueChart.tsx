"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useMemo, useState } from "react";
import { revenueSeries } from "@/lib/admin-store";

type Range = "weekly" | "monthly" | "yearly";

export default function RevenueChart() {
  const [range, setRange] = useState<Range>("monthly");
  const data = revenueSeries[range];

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
        categories: data.map((d) => d.name),
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
          name: "Revenue",
          data: data.map((d) => d.value),
        },
      ],
    }),
    [data],
  );

  const ranges: { id: Range; label: string }[] = [
    { id: "weekly", label: "WEEKLY" },
    { id: "monthly", label: "MONTHLY" },
    { id: "yearly", label: "YEARLY" },
  ];

  return (
    <div className="admin-card flex h-full flex-col p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Sale Graph</h2>
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
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
