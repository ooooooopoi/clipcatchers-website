/**
 * A running total with its day-to-day wobble averaged out, for growth charts.
 *
 * Each point becomes the average of the `window` days centred on it; the
 * first and last keep their real values, so where the line starts and ends
 * (the figure people read off it) is exact. Only for totals that climb:
 * on daily figures this would flatten the peaks that matter.
 */
export function smoothSeries<T extends Record<string, string | number>>(
  points: T[],
  keys: string[],
  window = 7,
): T[] {
  if (points.length < 3) return points;
  const half = Math.floor(window / 2);
  return points.map((point, i) => {
    if (i === 0 || i === points.length - 1) return point;
    const from = Math.max(0, i - half);
    const to = Math.min(points.length - 1, i + half);
    const out: Record<string, string | number> = { ...point };
    for (const key of keys) {
      let sum = 0;
      for (let k = from; k <= to; k++) sum += Number(points[k][key]);
      out[key] = Math.round((sum / (to - from + 1)) * 100) / 100;
    }
    return out as T;
  });
}
