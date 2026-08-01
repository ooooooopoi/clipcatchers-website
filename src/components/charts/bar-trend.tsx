"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact } from "@/lib/format";

export function BarTrend({
  data,
  dataKey,
  label,
  color = "hsl(var(--primary))",
  height = 260,
  valueFormatter = formatCompact,
  layout = "horizontal",
  categoryKey = "label",
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  label: string;
  color?: string;
  height?: number;
  valueFormatter?: (n: number) => string;
  layout?: "horizontal" | "vertical";
  categoryKey?: string;
}) {
  const vertical = layout === "vertical";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 8, bottom: 0, left: vertical ? 8 : -12 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={vertical} horizontal={!vertical} />
        {vertical ? (
          <>
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => valueFormatter(Number(v))}
            />
            <YAxis
              type="category"
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              width={130}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              minTickGap={20}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => valueFormatter(Number(v))}
              width={56}
            />
          </>
        )}
        <Tooltip
          cursor={{ fill: "hsl(var(--accent) / 0.4)" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
          formatter={(value: number | string) => [valueFormatter(Number(value)), label]}
        />
        <Bar dataKey={dataKey} name={label} fill={color} radius={vertical ? [0, 5, 5, 0] : [5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
