/**
 * The dashboard, shown rather than described.
 *
 * Built in markup instead of a screenshot: it stays sharp at any density,
 * follows the theme, and can't go stale the way an exported PNG of a UI does.
 * The figures are a real campaign's, so the shot isn't promising a product
 * that doesn't exist.
 *
 * ⚠ Don't put a client's name or logo on this panel until you've confirmed
 * these figures are that client's. Showing one client's delivery under
 * another's name is wrong twice over — it misleads the reader and it leaks the
 * first client's numbers.
 */
const STATS = [
  { label: "Views delivered", value: "4,224,619" },
  { label: "Clips live", value: "187" },
  { label: "Creators", value: "41" },
];

// Redacted, not relabelled. "Creator 01" sat directly above a line claiming
// every figure on the page is real, and a placeholder-shaped name is what
// undercut it — the panel read as a mockup of a product rather than a picture
// of one. Masking the middle of a real handle keeps the person anonymous while
// still looking like something that came out of a database. Inventing handles
// isn't an option either: they land on somebody's actual account.
const CLIPS = [
  { handle: "@m•••••ra", platform: "TikTok", views: "312,400", pct: "100%" },
  { handle: "@th•••••7", platform: "TikTok", views: "188,910", pct: "61%" },
  { handle: "@cl•••••ip", platform: "Instagram", views: "94,220", pct: "30%" },
];

export function HeroPreview() {
  return (
    <div className="relative">
      {/* Glow sits behind the panel, not on it, so the edges stay crisp. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-primary/10 blur-3xl"
      />

      <div className="surface relative overflow-hidden rounded-2xl border border-border bg-card text-left">
        {/* Browser chrome — the cue that says "this is the product". */}
        <div className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-4 py-3">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
          </span>
          <span className="mx-auto hidden rounded-md bg-background/80 px-3 py-1 font-mono text-[11px] text-muted-foreground sm:block">
            clipcatchers.net/c/·····
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {/* Named by what it was, not by its index — "Campaign 04" told a
                  reader nothing and read as a placeholder. Deliberately not
                  attributed to a client: these figures come from a campaign
                  nobody has confirmed the owner of, and delivery numbers shown
                  under the wrong name misrepresent one client and leak
                  another's results. Attribute it once the per-clip report says
                  who it belongs to. */}
              <p className="truncate text-sm font-semibold">Music release · 14-day window</p>
              <p className="mt-0.5 text-xs text-muted-foreground">TikTok · updating hourly</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Live
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="font-mono text-base font-semibold text-primary-ink sm:text-lg">
                  {s.value}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Growth curve. Non-uniform on purpose: a clean exponential reads as
              a placeholder, and clip delivery isn't smooth anyway. */}
          <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-muted-foreground">Views, last 14 days</p>
              <p className="font-mono text-xs text-primary-ink">+18.4%</p>
            </div>
            <svg
              viewBox="0 0 600 150"
              preserveAspectRatio="none"
              className="mt-3 h-24 w-full sm:h-28"
              role="img"
              aria-label="View delivery rising over the last fourteen days"
            >
              <defs>
                <linearGradient id="hp-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 138 C 45 134, 75 128, 110 122 S 175 108, 215 94 S 275 82, 310 62 S 380 54, 415 40 S 490 30, 525 22 S 580 14, 600 10 L 600 150 L 0 150 Z"
                fill="url(#hp-fill)"
              />
              <path
                d="M0 138 C 45 134, 75 128, 110 122 S 175 108, 215 94 S 275 82, 310 62 S 380 54, 415 40 S 490 30, 525 22 S 580 14, 600 10"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="mt-4 space-y-1.5">
            {CLIPS.map((c) => (
              <div key={c.handle} className="flex items-center gap-3 text-xs">
                <span className="w-20 shrink-0 truncate font-mono font-medium">{c.handle}</span>
                <span className="hidden w-16 shrink-0 text-muted-foreground sm:block">
                  {c.platform}
                </span>
                {/* The bar is the comparison; the number is the detail. */}
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary/70"
                    style={{ width: c.pct }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right font-mono text-muted-foreground">
                  {c.views}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
