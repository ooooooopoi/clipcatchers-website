import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/lib/public-stats";

/**
 * Named clients.
 *
 * The site had none — every campaign was anonymised, which protects the client
 * but leaves a brand buyer with nothing to check us against. A single real
 * name does more for credibility than six "Campaign 04"s, so the ones who've
 * agreed to be named go here.
 *
 * ── ADDING A CLIENT ──────────────────────────────────────────────────────
 * A client appearing here is something they agree to, not something they get.
 * Get it in writing before adding a row.
 *
 * 1. Add an entry below with a `slug`.
 * 2. Add the exact brand name, as it appears in the dashboard, to
 *    NAMED_CLIENTS in lib/public-stats.ts so the per-client table in Results
 *    names them too.
 * 3. Drop their artwork at `public/clients/<slug>.<ext>` — square, 256px or
 *    larger. No code change needed: the file is detected at render time, and
 *    until it exists the row shows a monogram in the brand palette rather
 *    than a broken image. That's deliberate — a name can go up the moment
 *    it's agreed, without waiting on artwork.
 * ─────────────────────────────────────────────────────────────────────────
 */
type Client = {
  name: string;
  /** Filename stem under public/clients. */
  slug: string;
  /** What they ran with us. One short line — this is a caption, not a case study. */
  detail: string;
};

const CLIENTS: Client[] = [
  {
    name: "Silent Collision",
    slug: "silent-collision",
    detail: "TikTok campaign · music release",
  },
];

const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"];

/**
 * The artwork for a client, or null if it hasn't been added yet.
 *
 * Checked against the filesystem rather than hardcoded so adding a logo is
 * dropping in a file, not editing code — the person with the artwork usually
 * isn't the person who'd open an editor.
 *
 * Resolved once at module load, which on a server component means build time.
 * Deliberately not per-request: on Vercel `public/` is served from the CDN and
 * isn't guaranteed to exist in the lambda's filesystem, so a runtime check
 * could decide the file was missing on a page where it renders perfectly well.
 */
function findLogo(slug: string): string | null {
  for (const ext of EXTENSIONS) {
    const rel = `/clients/${slug}.${ext}`;
    if (existsSync(path.join(process.cwd(), "public", rel))) return rel;
  }
  return null;
}

const RESOLVED = CLIENTS.map((client) => ({ ...client, logo: findLogo(client.slug) }));

function monogram(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function Clients() {
  if (RESOLVED.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-4">
      <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
        Brands we&apos;ve run campaigns for
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
        {RESOLVED.map(({ logo, ...client }) => (
          // A link, because a named client is the one thing on this page a
          // brand wants to interrogate rather than read. The case study behind
          // it is generated from the same reporting the client sees, so it can
          // be taken apart campaign by campaign.
          <Link
            key={client.name}
            href={`/case-studies/${slugify(client.name)}`}
            className="surface lift reveal group flex items-center gap-4 rounded-2xl border border-border bg-card px-6 py-4 hover:border-primary/25"
          >
            {logo ? (
              <Image
                src={logo}
                alt={client.name}
                width={128}
                height={128}
                className="h-12 w-12 rounded-xl border border-border object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.07] font-mono text-sm font-semibold text-primary-ink">
                {monogram(client.name)}
              </span>
            )}
            <div>
              <p className="font-semibold tracking-tight">{client.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{client.detail}</p>
              <p className="mt-1 text-xs text-primary-ink opacity-0 transition-opacity group-hover:opacity-100">
                See the numbers →
              </p>
            </div>
          </Link>
        ))}

        {/* Says the list is short because we're careful, not because it's all
            there is — which is the true reason, and the one a reader would
            otherwise assume the opposite of. */}
        <p className="w-full text-center text-xs leading-relaxed text-muted-foreground/70">
          Most of our clients prefer not to be named. Their campaigns still show real
          figures under Results — we&apos;ll walk you through any of them on a call.
        </p>
      </div>
    </section>
  );
}
