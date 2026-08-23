import type { Metadata } from "next";
import Link from "next/link";
import { RATE_PER_THOUSAND } from "@/lib/pricing";

/**
 * ⚠ NOT LEGAL ADVICE, AND NOT REVIEWED BY A LAWYER.
 *
 * Written from how the product actually behaves — budgets draw down against
 * delivery, campaigns auto-close at budget, clips are read hourly from the
 * live post, failed clips earn nothing — rather than from a template. That
 * makes it an accurate description of the deal. It is not a substitute for
 * terms drafted for your jurisdiction, and the liability, indemnity,
 * termination and governing-law sections in particular need a lawyer before
 * this is relied on.
 *
 * The rate is imported rather than typed, so terms and pricing can't disagree.
 */
export const metadata: Metadata = {
  // No brand name here — the root layout's title template appends it.
  title: "Terms of Service",
  description:
    "How campaigns, budgets, billing and delivery work when you run a campaign with Clip Catchers.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/legal/terms" },
};

const UPDATED = "August 2026";

export default function TermsPage() {
  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Terms of Service</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <p>
        These cover running a campaign with Clip Catchers. Clipping for us is covered by
        the creator terms in our Discord.
      </p>

      <h2>What we do</h2>
      <p>
        You give us a budget and a brief. We put it in front of a network of independent
        creators who cut and post your content to TikTok and Instagram from accounts they
        have verified as their own. We read the view count off each live post, log it
        against that clip, and bill you against what was delivered.
      </p>

      <h2>What you pay</h2>
      <ul>
        <li>
          ${RATE_PER_THOUSAND.toFixed(2)} per 1,000 delivered views, unless we&apos;ve
          agreed a different rate with you in writing.
        </li>
        <li>No retainer, no minimum term, no setup fee.</li>
        <li>
          You set a total budget. The campaign closes itself once that budget is met, so
          you cannot be billed past it.
        </li>
        <li>
          You are billed against views that actually landed. If a campaign underdelivers,
          you pay proportionally less. Unspent budget is not charged.
        </li>
      </ul>

      <h2>What counts as a delivered view</h2>
      <p>
        A view counts when it is read from a live post on a verified creator account
        against an approved clip on your campaign. Views on a clip that is later rejected,
        or on a post that is deleted, stop counting.
      </p>
      <p>
        We reject clips that break your brief and clips showing the engagement pattern
        purchased views leave behind. Rejected clips earn the creator nothing and are not
        billed to you.
      </p>

      <h2>Your content</h2>
      <p>
        You keep every right you have in the assets you give us. By starting a campaign you
        licence us and the creators on it to use those assets for the purpose of that
        campaign. You confirm you have the rights to what you upload — including any music,
        footage or likeness in it.
      </p>
      <p>
        Creators keep ownership of the posts they make. Posts stay up after a campaign
        ends; we do not require creators to remove them, and we cannot promise they will.
      </p>

      <h2>What you control, and what you don&apos;t</h2>
      <p>
        Your brief sets the rules: required footage, hooks, hashtags or sounds, things you
        don&apos;t want said, and a minimum view threshold. Clips that break those rules
        are rejected. What you don&apos;t get is approval over each post before it goes up
        — that is the trade that makes the volume possible, and it is a real one worth
        understanding before you start.
      </p>

      <h2>What we don&apos;t promise</h2>
      <ul>
        <li>
          We don&apos;t guarantee a view count, a completion date, or any commercial
          outcome. You pay for delivery, so weak delivery costs you less rather than
          costing you the same.
        </li>
        <li>
          Reach figures are modelled, not measured. TikTok and Instagram do not expose
          unique viewers per post. Views are the number we bill on.
        </li>
        <li>
          We can tell you which post earned which views. Attributing that to your signups,
          sales or streams is your analytics, not ours.
        </li>
        <li>
          We depend on TikTok and Instagram remaining readable. If a platform changes what
          it exposes, delivery and reporting can be affected.
        </li>
      </ul>

      <h2>Campaign reports</h2>
      <p>
        Every campaign gets a private share link that opens the live report with no account
        required. Anyone with the link can see it, so treat it as confidential. You are
        free to share it with your team, your label or your client.
      </p>

      <h2>Ending a campaign</h2>
      <p>
        You can ask us to close a campaign at any time. You are billed for views delivered
        up to that point. We may decline or stop a campaign whose content is unlawful,
        infringing, or that we cannot brief creators on in good conscience — and we will
        tell you why.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Campaigns already running continue under the terms in
        place when they started.
      </p>

      <h2>Getting in touch</h2>
      <p>
        Use the form on <Link href="/launch">/launch</Link>. See also our{" "}
        <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>
    </article>
  );
}
