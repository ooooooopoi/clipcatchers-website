import type { Metadata } from "next";
import Link from "next/link";

/**
 * ⚠ NOT LEGAL ADVICE, AND NOT REVIEWED BY A LAWYER.
 *
 * Every statement below was written from the code as it actually behaves —
 * the quote route, the auth flow, the campaign and clip models, the Discord
 * ingest — rather than from a template. That makes it accurate about what the
 * system does today, which is the hard half. It does not make it a compliant
 * privacy policy for any particular jurisdiction, and it deliberately doesn't
 * try to be: retention periods, the lawful basis for processing, the
 * controller/processor split and the data-subject rights section all need
 * someone qualified to look at them before this is published.
 *
 * If the system changes, change this too. A policy that describes a version of
 * the product that no longer exists is worse than no policy.
 */
export const metadata: Metadata = {
  // No brand name here. The root layout appends "· Clip Catchers" via its
  // title template, so spelling it out again renders it twice in the tab and
  // in every search result.
  title: "Privacy Policy",
  description:
    "What Clip Catchers collects, why, who it goes to, and how to have it removed.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/legal/privacy" },
};

const UPDATED = "August 2026";

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated {UPDATED}</p>

      <p>
        This explains what we collect, why we collect it, and who else sees it. It covers
        clipcatchers.co, the client dashboard, and the Discord bot creators use to submit
        clips.
      </p>

      <h2>What we collect</h2>

      <h3>If you ask us for a campaign</h3>
      <p>
        The enquiry form on <Link href="/launch">/launch</Link> asks for your name and
        email, and optionally your brand or artist name, a launch date, your category, a
        rough budget, a link to what you&apos;re promoting, and anything else you want to
        tell us. Only the name and email are required. The form is delivered to our own
        team; it is not passed to an advertising network or a mailing list.
      </p>

      <h3>If you have a client account</h3>
      <p>
        Your name, email, an optional company name, and a hashed password. Passwords are
        stored hashed and are never readable by us. Alongside that we hold the campaigns
        you create — brand details, budgets, briefs, and any files you upload — and the
        delivery figures for them.
      </p>

      <h3>If you clip for us</h3>
      <p>
        Your Discord account ID, the social accounts you verify, the clips you submit, the
        view counts read from those posts, and the payout details you give us so we can
        pay you.
      </p>

      <h3>Campaign delivery data</h3>
      <p>
        For every approved clip we store its public URL, the platform, the posting
        account&apos;s handle, and view counts read from the live post over time. These are
        public posts and public figures; we read them, we do not obtain anything private
        about the people who watch them.
      </p>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell your data, and we don&apos;t share it with advertisers.</li>
        <li>
          We don&apos;t run third-party advertising or tracking pixels on the marketing
          site.
        </li>
        <li>
          We don&apos;t have access to your viewers&apos; personal data. TikTok and
          Instagram don&apos;t give it to us, which is also why reach anywhere in our
          reporting is labelled as an estimate rather than a measurement.
        </li>
      </ul>

      <h2>Who else sees it</h2>
      <p>
        We use a small number of services to run the product, and your data touches them
        only so far as that requires: a hosting provider for the site and dashboard, a
        managed database, an email provider for account and notification email, and
        Discord for the creator workflow. Payouts to creators are made through PayPal or a
        USDT transfer, which means the payout details you give us reach that payment route.
      </p>

      <h2>Campaign reports</h2>
      <p>
        Every campaign has a private share link. Anyone holding that link can open the
        report without an account — that is the point of it, and it is why the link should
        be treated as confidential. The report shows campaign delivery only; it never
        exposes anything about your account, your other campaigns, or your billing.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Enquiries, accounts and campaign records are kept while your relationship with us
        is active and for a period afterwards for accounting and dispute purposes. Ask us
        and we&apos;ll tell you exactly what we hold about you.
      </p>

      <h2>Your choices</h2>
      <p>
        You can ask for a copy of what we hold about you, ask us to correct it, or ask us
        to delete it. Creators can remove a registered account at any time, which removes
        the clips attached to it. Depending on where you live you may have further rights
        over this data, and we will honour them.
      </p>

      <h2>Getting in touch</h2>
      <p>
        Use the form on <Link href="/launch">/launch</Link> and say it&apos;s a privacy
        request — it reaches the same people. Creators can raise it in our Discord.
      </p>
    </article>
  );
}
