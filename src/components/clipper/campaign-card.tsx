import Link from "next/link";
import { CampaignArt } from "@/components/clipper/campaign-art";
import { compact, rateLabel } from "@/lib/clipper-data";
import type { BotCampaign } from "@/lib/bot";

/**
 * One campaign in the browse grid, led by its artwork and its rate.
 *
 * ── What the card is for ─────────────────────────────────────────────────
 * A clipper scanning this grid is deciding one thing: is this worth cutting.
 * That decision is the rate, and the rate used to sit mid-card in the same
 * size as everything around it — below the name, above a line of view
 * thresholds, all competing at one weight. The card looked tidy and answered
 * the question slowly.
 *
 * So the rate is the loudest thing on it, set in the figure face at a size
 * nothing else approaches, and everything else is quiet: the name identifies,
 * the pills qualify, and neither argues with the number. The artwork still
 * leads because a clipper meets a campaign in Discord as a banner and
 * recognising it again is faster than reading a title.
 */
export function CampaignCard({
  campaign,
  href,
  showRules = false,
}: {
  campaign: BotCampaign;
  href: string;
  /**
   * Put the campaign's own rules on the face of the card.
   *
   * Off for organic campaigns, where the rules are detail behind the brief and
   * the rate is the decision. On for paid ads, where they are not detail at
   * all: "1 post per acc" against a rate 150× the organic one changes what the
   * offer is worth, and a clipper who reads the rate and cuts twenty is out
   * nineteen clips' worth of ad spend they will never be paid for.
   */
  showRules?: boolean;
}) {
  const live = Boolean(campaign.active);
  const perAccount = Number(campaign.max_clips_per_account ?? 0);

  // The rate split in two so the money can carry the weight and the unit can
  // stay out of its way. rateLabel still holds the canonical wording and is
  // used as the accessible label, so the two can't drift apart.
  const amount = `$${campaign.rate_amount}`;
  const unit = `per ${compact(campaign.rate_per_views)} views`;

  return (
    <article
      className={[
        "group surface relative flex flex-col overflow-hidden rounded-2xl border bg-card",
        "transition-all duration-200",
        live
          ? "border-border hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
          : "border-border/60",
      ].join(" ")}
    >
      <div className="relative">
        {/* Finished campaigns are dimmed rather than badged twice. The state
            reads from the picture before any text is parsed. */}
        <div className={live ? "" : "opacity-45 saturate-50"}>
          <CampaignArt src={campaign.image_url ?? ""} name={campaign.name} seed={campaign.id} />
        </div>

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {campaign.platform ? (
            <span className="rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur-sm">
              {campaign.platform}
            </span>
          ) : (
            <span />
          )}
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium backdrop-blur-sm",
              live ? "bg-success/15 text-success" : "bg-background/80 text-muted-foreground",
            ].join(" ")}
          >
            {live ? (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
            ) : null}
            {live ? "Live" : "Ended"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* The number first, then what it is for. */}
        <p className="flex items-baseline gap-1.5" aria-label={rateLabel(campaign)}>
          <span className="font-mono text-2xl font-semibold tracking-tight text-primary-ink">
            {amount}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </p>

        <p className="mt-2 truncate text-sm font-medium" title={campaign.name}>
          {campaign.name}
        </p>
        {campaign.artist ? (
          <p className="truncate text-xs text-muted-foreground">{campaign.artist}</p>
        ) : null}

        {/* The conditions, as things you can count rather than a sentence. */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Pill>
            {campaign.min_views > 0 ? `${compact(campaign.min_views)} to qualify` : "No view floor"}
          </Pill>
          {campaign.max_views > 0 ? <Pill>{compact(campaign.max_views)} cap</Pill> : null}
          {perAccount > 0 ? (
            <Pill>
              {perAccount} clip{perAccount === 1 ? "" : "s"} / account
            </Pill>
          ) : null}
        </div>

        {/* The campaign's own conditions, in its own words. Rendered as written
            rather than summarised — they are short, and a paraphrase of a rule
            somebody is held to is worse than the rule. */}
        {showRules && (campaign.rules || "").trim() ? (
          <ul className="mt-3 space-y-1 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2">
            {(campaign.rules || "")
              .split("\n")
              .map((line) => line.trim().replace(/^[•\-*]\s*/, ""))
              .filter(Boolean)
              .map((line) => (
                <li key={line} className="flex gap-2 text-xs leading-relaxed">
                  <span aria-hidden className="text-warning">
                    !
                  </span>
                  <span>{line}</span>
                </li>
              ))}
          </ul>
        ) : null}

        {/* Pinned to the foot so a row of cards with different amounts of copy
            still lines its buttons up. */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          {live ? (
            <Link
              href={href}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Submit a clip
            </Link>
          ) : (
            <span className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border px-3 text-sm text-muted-foreground">
              Closed
            </span>
          )}

          {campaign.brief_url ? (
            <a
              href={campaign.brief_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-border px-3 text-sm transition-colors hover:bg-accent"
            >
              Brief
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}
