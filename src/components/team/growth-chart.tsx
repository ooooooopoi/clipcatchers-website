import { Card } from "@/components/ui/card";
import { AreaTrend, type SeriesPoint } from "@/components/charts/area-trend";
import { formatCompact } from "@/lib/format";

type SnapshotRow = {
  day?: unknown;
  campaign_id?: unknown;
  views?: unknown;
  spent_cents?: unknown;
};

/**
 * Cumulative views and spend across every campaign, by day.
 *
 * The bot writes one row per campaign per day it syncs, holding that
 * campaign's running total. Two consequences drive the shape of this:
 *
 * A campaign that goes quiet stops producing rows, so summing only the rows
 * present on each day makes the total fall on the days it was silent — which
 * would draw a business that shrank when nothing happened at all. Each
 * campaign's last known total is carried forward instead.
 *
 * And because the stored figures are cumulative, the per-day bars people
 * usually want are differences between consecutive days, not the values
 * themselves.
 */
export function buildSeries(rows: SnapshotRow[]) {
  const byDay = new Map<string, Map<number, { views: number; spend: number }>>();
  for (const row of rows) {
    const day = String(row.day ?? "");
    const id = Number(row.campaign_id ?? -1);
    if (!day || id < 0) continue;
    if (!byDay.has(day)) byDay.set(day, new Map());
    byDay.get(day)!.set(id, {
      views: Number(row.views ?? 0),
      spend: Number(row.spent_cents ?? 0) / 100,
    });
  }

  const days = [...byDay.keys()].sort();
  const dayNo = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;

  // Each campaign's readings, in day order.
  const points = new Map<number, { at: number; views: number; spend: number }[]>();
  for (const day of days) {
    for (const [id, value] of byDay.get(day)!) {
      if (!points.has(id)) points.set(id, []);
      points.get(id)!.push({ at: dayNo(day), ...value });
    }
  }

  /**
   * A campaign's total on a day. Between two of its readings it's drawn as a
   * straight line from one to the next: it was growing on the days it didn't
   * sync, and holding the last figure flat drew stair steps that never
   * happened. Before its first reading it hadn't started (0); after its last
   * it has stopped, so that figure holds.
   */
  function valueOn(list: { at: number; views: number; spend: number }[], at: number) {
    if (at < list[0].at) return { views: 0, spend: 0 };
    let prev = list[0];
    for (const next of list) {
      if (next.at === at) return next;
      if (next.at > at) {
        const t = (at - prev.at) / (next.at - prev.at);
        return {
          views: prev.views + (next.views - prev.views) * t,
          spend: prev.spend + (next.spend - prev.spend) * t,
        };
      }
      prev = next;
    }
    return prev;
  }

  const series: SeriesPoint[] = [];

  for (const day of days) {
    const at = dayNo(day);
    let views = 0;
    let spend = 0;
    for (const list of points.values()) {
      const value = valueOn(list, at);
      views += value.views;
      spend += value.spend;
    }
    views = Math.round(views);
    series.push({
      day,
      label: day.slice(5), // MM-DD; the year is the same for every point
      views,
      spend: Number(spend.toFixed(2)),
    });
  }
  return series;
}

export function GrowthChart({ rows }: { rows: SnapshotRow[] }) {
  const series = buildSeries(rows);

  if (series.length < 2) {
    return (
      <Card className="mt-4 p-5">
        <h2 className="text-base font-semibold">Growth</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {series.length === 0
            ? "No daily snapshots yet. The bot writes one per campaign each time it syncs, so this fills in from the next sync onward."
            : "Only one day recorded so far — a trend needs at least two."}
        </p>
      </Card>
    );
  }

  const latest = series[series.length - 1];
  const first = series[0];
  const gained = Number(latest.views) - Number(first.views);
  const spent = Number(latest.spend) - Number(first.spend);
  // Over the charted window only, so it answers "what are we paying lately"
  // rather than being dragged toward the lifetime average.
  const cpm = gained > 0 ? (spent / gained) * 1000 : 0;

  return (
    <Card className="mt-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Growth</h2>
        <span className="text-xs text-muted-foreground">
          {series.length} days · +{formatCompact(gained)} views · ${spent.toFixed(2)} spent
          {gained > 0 ? ` · $${cpm.toFixed(2)} CPM` : ""}
        </span>
      </div>
      <div className="mt-4">
        <AreaTrend
          data={series}
          keys={[{ key: "views", label: "Cumulative views", color: "hsl(var(--primary))" }]}
          height={260}
        />
      </div>
      <div className="mt-2 border-t border-border pt-4">
        <AreaTrend
          data={series}
          keys={[{ key: "spend", label: "Cumulative spend", color: "hsl(var(--warning))" }]}
          height={160}
          valueFormat="usd"
        />
      </div>
    </Card>
  );
}
