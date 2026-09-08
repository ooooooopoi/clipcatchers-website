import type { Metadata } from "next";
import Link from "next/link";
import { ImpressionCounter } from "@/components/marketing/impressions";
import { PageShell } from "@/components/marketing/page-shell";
import { Verification } from "@/components/marketing/verification";
import { getPublicStats } from "@/lib/public-stats";

const TITLE = "Verification";
const SOCIAL_TITLE = "Verification — Clip Catchers";
const DESCRIPTION =
  "How a view becomes a billed view: account ownership proved before a clip counts, views read off the live post every hour, and bought engagement rejected.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/verification" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/verification",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Clip Catchers" }],
  },
  twitter: { card: "summary_large_image", title: SOCIAL_TITLE, description: DESCRIPTION },
};

/**
 * The trust page.
 *
 * This is the objection that kills the deal silently — nobody writes back to
 * say "I assumed the numbers were inflated". It had a section on the homepage
 * and now has a page, because it is also the thing a sceptical buyer forwards
 * to whoever signs off, and forwarding an anchor into the middle of a
 * marketing page is not the same as sending them a page about the subject.
 */
const CHECKS = [
  {
    q: "The creator proves they own the account",
    a: "Before any clip of theirs can earn, a creator adds a code we generate to the bio of the account they want to post from. We read it off the live profile. An account nobody has proved ownership of cannot be attached to a paid clip.",
  },
  {
    q: "The post is checked against the account",
    a: "When a clip is submitted we resolve who actually posted the video and match it against that creator's verified accounts. A clip posted by somebody else's account is rejected, not quietly re-filed.",
  },
  {
    q: "Views come off the live post, hourly",
    a: "Never from the creator. Each approved clip is read directly from TikTok or Instagram and logged on its own row with a timestamp, so every figure on your report traces back to one video you can open.",
  },
  {
    q: "Bought views leave a pattern, and we look for it",
    a: "Purchased views climb without the comments, shares and saves that normally come with them. Clips showing that shape are flagged and rejected, and a rejected clip earns nothing — the cost of that lands on the creator, which is what makes it a deterrent rather than a policy.",
  },
  {
    q: "The brief is enforced, not just attached",
    a: "Rules you set — required footage, a sound, wording that must or must not appear — are checked on review. Clips that break them are rejected. That is the same mechanism that keeps a regulated category inside its own rules.",
  },
  {
    q: "You can audit any of it",
    a: "Your report lists every clip with a link to the post and what it earned. Nothing is presented only as a total, so any number on the page can be taken apart down to the individual video that produced it.",
  },
] as const;

export default async function VerificationPage() {
  const stats = await getPublicStats();

  return (
    <PageShell
      eyebrow="Trust & verification"
      title="How a view becomes a billed view"
      intro={
        <>
          Nothing on your report is self-reported by a creator. Here is every check
          between someone posting a clip and you being charged for it.
        </>
      }
    >
      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-16">
        <ImpressionCounter stats={stats} label="impressions delivered, every one logged per clip" />
      </section>

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20">
        <ol className="space-y-3">
          {CHECKS.map((c, i) => (
            <li
              key={c.q}
              className="surface reveal rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex gap-4">
                <span className="font-mono text-sm text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="display-sm text-sm">{c.q}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.a}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* The existing homepage section, which carries the same argument in a
          different shape — kept rather than rewritten so the two can't drift. */}
      <Verification />

      <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-8 text-center">
        <p className="text-sm text-muted-foreground">
          Then see{" "}
          <Link href="/results" className="text-primary-ink underline-offset-4 hover:underline">
            what those checks have actually delivered
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
