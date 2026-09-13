import Link from "next/link";
import { CampaignArt } from "@/components/clipper/campaign-art";
import { compact, rateLabel } from "@/lib/clipper-data";
import type { BotCampaign } from "@/lib/bot";

/**
 * One campaign in the browse grid, led by its artwork.
 *
 * The picture is the point: a clipper hears about a campaign in Discord where
 * it appears as a card with this same banner, and recognising it again here is
 * faster than reading a list of names. Campaigns without one fall back to the
 * name set large rather than a grey placeholder, which carries no information
 * and makes the grid look broken.
 */
export function CampaignCard({
  campaign,
  href,
}: {
  campaign: BotCampaign;
  href: string;
}) {
  const live = Boolean(campaign.active);

  return (
    <div className="group surface overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40">
      <div className="relative">
        <CampaignArt
          src={campaign.image_url ?? ""}
          name={campaign.name}
          seed={campaign.id}
        />

        {campaign.platform ? (
          <span className="absolute left-3 top-3 rounded-md bg-background/85 px-2 py-1 text-[11px] font-medium backdrop-blur">
            {campaign.platform}
          </span>
        ) : null}

        {!live ? (
          <span className="absolute right-3 top-3 rounded-md bg-background/85 px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
            Ended
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{campaign.name}</p>
            {campaign.artist ? (
              <p className="truncate text-xs text-muted-foreground">{campaign.artist}</p>
            ) : null}
          </div>
          {live ? (
            <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
              Live
            </span>
          ) : null}
        </div>

        <p className="mt-3 font-mono text-lg font-semibold tracking-tight text-primary-ink">
          {rateLabel(campaign)}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {campaign.min_views > 0
            ? `${compact(campaign.min_views)} views to qualify`
            : "No view floor"}
          {campaign.max_views > 0 ? ` · counts up to ${compact(campaign.max_views)}` : ""}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {live ? (
            <Link
              href={href}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
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
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm transition-colors hover:bg-accent"
            >
              Brief
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
