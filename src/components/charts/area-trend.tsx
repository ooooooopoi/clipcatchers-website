"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "@/lib/format";

export type SeriesPoint = Record<string, string | number>;

/** Named formats, because a formatter function can't cross into a client component. */
export type ValueFormat = "compact" | "usd";

const FORMATTERS: Record<ValueFormat, (n: number) => string> = {
  compact: formatCompact,
  usd: (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
};

/** Axis ticks are short: "$25,000.00" didn't fit the axis and showed as "000.00". */
const TICKS: Record<ValueFormat, (n: number) => string> = {
  compact: formatCompact,
  usd: (n) => `$${formatCompact(n)}`,
};

export function AreaTrend({
  data,
  keys,
  height = 280,
  valueFormat = "compact",
  smooth = false,
}: {
  data: SeriesPoint[];
  keys: { key: string; label: string; color: string }[];
  height?: number;
  valueFormat?: ValueFormat;
  /**
   * A fully smoothed curve, for running totals. "monotone" passes through
   * every daily point, so a total that grows in uneven daily steps still
   * shows a corner at each one; "basis" rounds them off. Fine for a curve
   * that only ever climbs, wrong for daily figures, where it would blur
   * real peaks — so it's opt-in.
   */
  smooth?: boolean;
}) {
  const format = FORMATTERS[valueFormat];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          {keys.map(({ key, color }) => (
            <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          minTickGap={28}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          tickFormatter={(v) => TICKS[valueFormat](Number(v))}
          width={56}
        />
        <Tooltip
          cursor={{ stroke: "hsl(var(--border))" }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 10,
            fontSize: 12,
            boxShadow: "0 12px 30px -12px rgba(0,0,0,.6)",
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
          formatter={(value: number | string, name: string) => [format(Number(value)), name]}
        />
        {keys.map(({ key, label, color }) => (
          <Area
            key={key}
            type={smooth ? "basis" : "monotone"}
            dataKey={key}
            name={label}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${key})`}
            dot={false}
            activeDot={{ r: 3.5, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
