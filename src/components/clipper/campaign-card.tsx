import { Users } from "lucide-react";
import { CampaignArt } from "@/components/clipper/campaign-art";
import { CampaignBrief } from "@/components/clipper/campaign-brief";
import { SubmitClipDialog } from "@/components/clipper/submit-clip-dialog";
import { compact, rateLabel } from "@/lib/clipper-data";
import type { BotCampaign, ClipperAccount } from "@/lib/bot";

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
  userId,
  sig,
  accounts,
  showRules = false,
}: {
  campaign: BotCampaign;
  /** Who is browsing — the submit dialog files the clip under them. */
  userId: string;
  sig: string;
  /** Their registered accounts, so the dialog can offer the right ones. */
  accounts: ClipperAccount[];
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
  const clippers = Number(campaign.clippers ?? 0);
  const createdAt = Number(campaign.created_at ?? 0);
  const isNew = live && createdAt > 0 && Date.now() / 1000 - createdAt < NEW_FOR_SECONDS;

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
          <span className="flex gap-1.5">
            {campaign.platform ? (
              <span className="rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium backdrop-blur-sm">
                {campaign.platform}
              </span>
            ) : null}
            {/* Fresh campaigns are where a clipper gets the most of the
                budget, so they're marked — and only for a few days, or the
                badge stops meaning anything. */}
            {isNew ? (
              <span className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                New
              </span>
            ) : null}
          </span>
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

        <BudgetBar campaign={campaign} live={live} />

        {clippers >= MIN_CLIPPERS_SHOWN ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {clippers} clippers {live ? "earning" : "paid"}
          </p>
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

        {/* Details live behind the Brief button rather than on the card. They
            were printed here for a moment and a campaign with four lines of
            them made its entire row that tall — the grid is for comparing
            rates, the brief is for after you have picked one. */}

        {/* The campaign's own conditions, in its own words. Rendered as written
            rather than summarised — they are short, and a paraphrase of a rule
            somebody is held to is worse than the rule. */}
        {showRules && (campaign.rules || "").trim() ? (
          <ul className="mt-3 space-y-1 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2">
            {(campaign.rules || "")
              .split("\n")
              // The whitespace is required. Without it this strips the first
              // character of "**Language:** English only", leaving a stray
              // asterisk on every bolded line the campaign wrote for Discord.
              .map((line) => line.trim().replace(/^[•\-*]\s+/, ""))
              .filter(Boolean)
              .map((line) => (
                <li key={line} className="flex gap-2 text-xs leading-relaxed">
                  <span aria-hidden className="text-warning">
                    !
                  </span>
                  {/* Same renderer as the details. Rules are written in the
                      same Discord text as everything else, so a rule with a
                      bolded label or a link in it has to survive the trip. */}
                  <span>
                    <DetailLine line={line} />
                  </span>
                </li>
              ))}
          </ul>
        ) : null}

        {/* Pinned to the foot so a row of cards with different amounts of copy
            still lines its buttons up. */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          {live ? (
            // Opens the form right here with this campaign preselected. It
            // used to link to the Clips page, which then asked "which
            // campaign?" — a question the click had already answered.
            <SubmitClipDialog
              campaign={campaign}
              userId={userId}
              sig={sig}
              accounts={accounts}
            />
          ) : (
            <span className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border px-3 text-sm text-muted-foreground">
              Closed
            </span>
          )}

          <CampaignBrief campaign={campaign} />
        </div>
      </div>
    </article>
  );
}

/** How long a campaign carries the New badge. */
const NEW_FOR_SECONDS = 3 * 24 * 60 * 60;
/**
 * The clipper count shows from here up. "1 clipper earning" says nobody wants
 * it; a small number beside a strong offer drags the offer down rather than
 * backing it, so it waits until it reads as proof.
 */
const MIN_CLIPPERS_SHOWN = 3;
/** From this share used, the bar turns amber and says the budget is nearly gone. */
const ALMOST_GONE = 0.8;

/**
 * How much of the budget has been paid out, the way the big clipping
 * marketplaces show it (Whop Content Rewards leads every card with it).
 *
 * It answers the two questions a clipper has before cutting anything: does
 * this campaign actually pay (a part-spent budget is proof it does), and is
 * there enough left to be worth it. Nearly gone turns amber, because the
 * scarcity is real — a clip that lands after the budget runs out earns
 * nothing.
 *
 * A campaign with its budget hidden shows the share used but no dollars, as
 * its Discord card does: the bar and the dollars left together would give
 * the hidden figure away.
 */
function BudgetBar({ campaign, live }: { campaign: BotCampaign; live: boolean }) {
  const budget = Number(campaign.budget ?? 0);
  if (!budget || campaign.spent === undefined) return null;
  const share = Math.min(Number(campaign.spent) / budget, 1);
  const pct = Math.round(share * 100);
  const hidden = Number(campaign.hide_budget ?? 0) === 1;
  const left = Math.max(budget - Number(campaign.spent), 0);
  const almostGone = live && share >= ALMOST_GONE;

  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className={almostGone ? "font-medium text-warning" : "text-muted-foreground"}>
          {almostGone ? "Almost gone · " : ""}
          {pct}% paid out
        </span>
        {live && !hidden ? (
          <span className="font-mono text-foreground/80">${Math.round(left).toLocaleString()} left</span>
        ) : null}
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Budget paid out"
      >
        <div
          className={[
            "h-full rounded-full",
            !live ? "bg-muted-foreground/40" : almostGone ? "bg-warning" : "bg-primary",
          ].join(" ")}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

/**
 * One line of a campaign's details, with its links made clickable.
 *
 * The text is written for Discord, so a link arrives either masked as
 * `[name](url)` or bare. Rendered raw, the first shows its own markup and the
 * second shows a hundred characters of tracking parameters — on a card four
 * inches wide, both are unusable. A masked link keeps its name; a bare one is
 * shortened to host and last segment, which is enough to recognise a TikTok
 * link without wrapping over three lines.
 */
function DetailLine({ line }: { line: string }) {
  // Masked link, then bold, then bare link — one pass, so a bolded label
  // followed by a link on the same line comes out as both rather than as
  // whichever pattern happened to run first.
  const pattern =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s]+)/g;
  const out: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) out.push(line.slice(cursor, match.index));
    const [, maskedText, maskedUrl, bold, bareUrl] = match;

    if (bold !== undefined) {
      out.push(
        <strong key={key++} className="font-medium text-foreground">
          {bold}
        </strong>,
      );
    } else {
      const url = (maskedUrl ?? bareUrl) as string;
      out.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-ink underline underline-offset-2 hover:opacity-80"
        >
          {maskedText ?? shortUrl(url)}
        </a>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) out.push(line.slice(cursor));
  return <>{out}</>;
}

/** "https://vt.tiktok.com/ZSq7AM9Qv/?x=1" -> "vt.tiktok.com/ZSq7AM9Qv" */
function shortUrl(url: string) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ? `${u.host}/${last}` : u.host;
  } catch {
    return url;
  }
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}
