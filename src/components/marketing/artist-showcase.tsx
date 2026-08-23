import Image from "next/image";
import { formatCompact } from "@/lib/format";
import { getPublicStats } from "@/lib/public-stats";

/**
 * The client, shown large, with what we actually delivered for them.
 *
 * The number is read from the database rather than typed in — the same query
 * that draws the totals and the per-client table, matched on brand name. That
 * matters more here than anywhere else on the page: this panel is the largest
 * thing in the hero and it carries a named client's results, so a figure
 * somebody typed in and forgot to update is a figure that misrepresents them.
 *
 * If the client has no delivery recorded yet, or the database can't be
 * reached, the panel shows the image and the name and no number at all. An
 * invented or stale figure under a real client's face is worse than no figure.
 */
const ARTIST = {
  /** Must match `brandName` in the dashboard exactly — that's the join key. */
  name: "Silent Collision",
  image: "/clients/silent-collision.jpg",
  context: "TikTok · music release",
} as const;

export async function ArtistShowcase() {
  const stats = await getPublicStats();
  const row = stats.clients.find(
    (c) => c.label.trim().toLowerCase() === ARTIST.name.toLowerCase(),
  );
  const views = row && row.views > 0 ? row.views : null;

  return (
    <figure className="relative mx-auto max-w-md">
      {/* Glow sits behind the frame, not on it, so the edges stay crisp. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-primary/[0.08] blur-3xl"
      />

      <div className="surface relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* Square, because the source is a square avatar — letterboxing it into
            a wide frame would either crop the subject out or pad it with bars. */}
        <Image
          src={ARTIST.image}
          alt={ARTIST.name}
          width={500}
          height={500}
          priority
          sizes="(max-width: 640px) 90vw, 28rem"
          className="aspect-square w-full object-cover"
        />

        <figcaption className="border-t border-border px-6 py-5 text-center">
          <p className="text-lg font-semibold tracking-tight">{ARTIST.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{ARTIST.context}</p>

          {views !== null && (
            <div className="mt-5 flex items-start justify-center divide-x divide-border border-t border-border pt-5">
              <div className="px-6">
                <p className="font-mono text-3xl font-semibold tracking-tight text-primary-ink">
                  {formatCompact(views)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">views delivered</p>
              </div>
              {/* This campaign's own CPM, from its own spend and delivery —
                  not the list rate. It's the figure that says what the reach
                  actually cost, and it's different for every campaign. */}
              {row && row.cpm > 0 && (
                <div className="px-6">
                  <p className="font-mono text-3xl font-semibold tracking-tight text-primary-ink">
                    ${row.cpm.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">their CPM</p>
                </div>
              )}
            </div>
          )}
        </figcaption>
      </div>
    </figure>
  );
}
