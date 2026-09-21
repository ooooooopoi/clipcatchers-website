import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand";
import { fetchCampaigns } from "@/lib/bot";
import { compact } from "@/lib/clipper-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campaign brief",
  // A brief is for people who were sent it, not for search. It carries a rate
  // and a budget, which is our commercial position, not a landing page.
  robots: { index: false, follow: false },
};

/**
 * One campaign's brief, as a page.
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 * `brief_url` has always pointed at a Google Doc, which means a campaign only
 * has a brief if somebody remembered to write one and paste the link. Eighteen
 * of twenty-seven did; the rest had nothing to link to even though the campaign
 * itself knew its sound, its rules, its floor and its caps.
 *
 * So the brief is generated from the campaign. Nothing here is invented — every
 * line is a field the campaign already holds, which also means it cannot go
 * stale the way a copy pasted into a document does: change the rate in the
 * editor and this changes with it.
 *
 * A pasted document still wins if there is one. Set brief_url and the card
 * links there instead.
 */
export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const campaign = await fetchCampaigns()
    .then(({ campaigns }) => campaigns.find((c) => c.id === Number(id)) ?? null)
    .catch(() => null);
  if (!campaign) notFound();

  const details = lines(campaign.details);
  const rules = lines(campaign.rules);
  const perAccount = Number(campaign.max_clips_per_account ?? 0);
  const live = Boolean(campaign.active);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <div className="flex items-center gap-2.5">
        <BrandMark className="h-7 w-7" />
        <span className="wordmark text-sm">Clip Catchers</span>
      </div>

      <p className="eyebrow mt-10 text-muted-foreground">
        {live ? "Campaign brief" : "Campaign brief · closed"}
      </p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">{campaign.name}</h1>
      {campaign.artist ? (
        <p className="mt-2 text-muted-foreground">{campaign.artist}</p>
      ) : null}

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="eyebrow text-muted-foreground">What it pays</h2>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tracking-tight text-primary-ink">
            ${campaign.rate_amount}
          </span>
          <span className="text-muted-foreground">
            per {campaign.rate_per_views.toLocaleString()} views
          </span>
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          <li>
            Earning starts at{" "}
            <strong className="font-medium text-foreground">
              {campaign.min_views.toLocaleString()}
            </strong>{" "}
            views per clip.
          </li>
          {campaign.max_views > 0 ? (
            <li>
              Views count up to{" "}
              <strong className="font-medium text-foreground">
                {compact(campaign.max_views)}
              </strong>{" "}
              per clip — a maximum of{" "}
              <strong className="font-medium text-foreground">
                ${((campaign.max_views / campaign.rate_per_views) * campaign.rate_amount).toFixed(0)}
              </strong>{" "}
              from any one clip.
            </li>
          ) : null}
          {perAccount > 0 ? (
            <li>
              Up to{" "}
              <strong className="font-medium text-foreground">{perAccount}</strong> clip
              {perAccount === 1 ? "" : "s"} per account on this campaign.
            </li>
          ) : null}
          {campaign.platform ? (
            <li>
              <strong className="font-medium text-foreground">{campaign.platform}</strong> only.
            </li>
          ) : null}
        </ul>
      </section>

      {details.length > 0 ? (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="eyebrow text-muted-foreground">The campaign</h2>
          <ul className="mt-3 space-y-2">
            {details.map((line, i) => (
              <li key={`${line}-${i}`} className="text-sm leading-relaxed text-muted-foreground">
                <Line line={line} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {rules.length > 0 ? (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="eyebrow text-muted-foreground">Rules</h2>
          <ul className="mt-3 space-y-2">
            {rules.map((line, i) => (
              <li
                key={`${line}-${i}`}
                className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
              >
                <span aria-hidden className="text-warning">
                  !
                </span>
                <span>
                  <Line line={line} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
        {live
          ? "Submit through the campaign card in the clipping server. A clip only counts from an account registered to you."
          : "This campaign has closed and is no longer accepting clips."}
      </p>
    </main>
  );
}

/** Split on newlines, dropping bullet markers the campaign typed itself. */
function lines(text: string | undefined) {
  return (text || "")
    .split("\n")
    // Whitespace required, or this eats the first character of "**Bold:**".
    .map((l) => l.trim().replace(/^[•\-*]\s+/, ""))
    .filter(Boolean);
}

/** Campaign text is written for Discord: masked links, bare links, bold. */
function Line({ line }: { line: string }) {
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
          className="break-all text-primary-ink underline underline-offset-4 hover:opacity-80"
        >
          {maskedText ?? url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>,
      );
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) out.push(line.slice(cursor));
  return <>{out}</>;
}
