"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BotCampaign } from "@/lib/bot";

/**
 * Everything a campaign says about itself, behind one button.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * "Brief" used to mean one thing: an external document, and only the eighteen
 * campaigns that had a link to one got the button. The other nine looked
 * broken beside them — a campaign with a sound link, three rules and a
 * requirement list showed no brief at all, because none of it happened to live
 * in a Google Doc.
 *
 * But the brief is the campaign's own words, wherever they are stored. This
 * gathers details, rules and the external link into one place, so every
 * campaign that has anything to say has a Brief button and the button always
 * opens the same kind of thing.
 *
 * ── Why it isn't printed on the card ─────────────────────────────────────
 * It was, briefly, and a campaign with four lines of rules made its whole row
 * of cards that tall. The grid is for comparing rates; the brief is for after
 * you have picked one.
 */
export function CampaignBrief({ campaign }: { campaign: BotCampaign }) {
  const [open, setOpen] = useState(false);

  const details = lines(campaign.details);
  const rules = lines(campaign.rules);
  const doc = (campaign.brief_url || "").trim();
  if (!details.length && !rules.length && !doc) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-border px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Brief
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* `dark` again because the dialog portals to document.body, outside
            the .clipper-shell wrapper that scopes this subtree's variables. */}
        <DialogContent className="dark max-h-[85vh] overflow-y-auto bg-background text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{campaign.name}</DialogTitle>
            <DialogDescription>
              {campaign.artist ? `${campaign.artist} · ` : ""}
              {`$${campaign.rate_amount} per ${campaign.rate_per_views.toLocaleString()} views`}
            </DialogDescription>
          </DialogHeader>

          <BudgetBar campaign={campaign} />

          {details.length > 0 ? (
            <Section label="The campaign">
              {details.map((line, i) => (
                <li key={`${line}-${i}`} className="text-sm leading-relaxed text-muted-foreground">
                  <BriefLine line={line} />
                </li>
              ))}
            </Section>
          ) : null}

          {rules.length > 0 ? (
            <Section label="Rules">
              {rules.map((line, i) => (
                <li
                  key={`${line}-${i}`}
                  className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <span aria-hidden className="text-warning">
                    !
                  </span>
                  <span>
                    <BriefLine line={line} />
                  </span>
                </li>
              ))}
            </Section>
          ) : null}

          {doc ? (
            <a
              href={doc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary-ink underline-offset-4 hover:underline"
            >
              Full brief document
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * How much of the campaign's money is still there to earn.
 *
 * ── Why a clipper needs this ─────────────────────────────────────────────
 * The rate tells you what a view is worth; it doesn't tell you whether there
 * is anything left to win. A campaign at 95% with a good rate is a worse bet
 * than one at 20% with a lower one, and until now nothing on this page
 * distinguished them — a clipper could cut for a budget that ran out while
 * they were editing.
 *
 * ── What it deliberately doesn't do ──────────────────────────────────────
 * Nothing renders when hide_budget is set. The bot sends the real figures
 * either way because the team dashboard reads the same endpoint, so this is
 * the check that keeps an undisclosed budget undisclosed.
 *
 * Spend counts approved *and pending* clips, so the bar can read higher than
 * what has actually been paid. That is the honest direction to be wrong in:
 * the money is committed the moment a clip qualifies, and a bar that only
 * counted settled clips would show room that isn't there.
 */
function BudgetBar({ campaign }: { campaign: BotCampaign }) {
  const budget = campaign.budget ?? 0;
  const spent = campaign.spent ?? 0;
  if (!budget || Number(campaign.hide_budget ?? 0) === 1) return null;

  const pct = Math.min(100, (spent / budget) * 100);
  const left = Math.max(0, budget - spent);
  // Under a couple of percent the fill is a sliver that reads as nothing at
  // all, so it gets a floor — the bar's job is to say "barely touched", not
  // to be measured with a ruler.
  const width = spent > 0 ? Math.max(pct, 2) : 0;
  const nearlyGone = pct >= 90;

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Budget
        </h3>
        <p className="font-mono text-xs text-muted-foreground">
          <span className={nearlyGone ? "text-warning" : "text-foreground"}>
            ${left.toFixed(2)}
          </span>{" "}
          left of ${budget.toFixed(2)}
        </p>
      </div>
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(pct)}% of the budget used`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            nearlyGone ? "bg-warning" : "bg-primary"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {pct >= 100
          ? "Fully committed — this campaign is done paying out."
          : nearlyGone
            ? `${Math.round(pct)}% committed. Close to the cap, so cut soon or pick another.`
            : `${Math.round(pct)}% committed.`}
      </p>
    </section>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      <ul className="mt-2 space-y-1.5">{children}</ul>
    </section>
  );
}

/**
 * Split on newlines and drop bullet markers the campaign typed itself.
 *
 * The whitespace after the marker is required: without it this strips the
 * first character of "**Language:** English only" and leaves a stray asterisk.
 */
function lines(text: string | undefined) {
  return (text || "")
    .split("\n")
    .map((l) => l.trim().replace(/^[•\-*]\s+/, ""))
    .filter(Boolean);
}

/**
 * One line of campaign text, with its Discord markup rendered.
 *
 * Masked links keep their name, bare ones shorten to host and last segment,
 * and bold becomes bold. All three in one pass, so a bolded label followed by
 * a link comes out as both rather than as whichever pattern ran first.
 */
function BriefLine({ line }: { line: string }) {
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
          className="break-all text-primary-ink underline underline-offset-2 hover:opacity-80"
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
