import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/clipper/chrome";
import { clipperSignatureValid } from "@/lib/share";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Help" };

/**
 * Static, so it stays up when the bot doesn't — the moment someone most wants
 * to know how any of this works is when something looks wrong.
 */
const FAQ = [
  {
    q: "How much is a clip worth?",
    a: "Views on the live post divided by the campaign's rate. A campaign paying $10 per 100K views pays $5 for a clip on 50K. Views are re-read regularly, so the figure moves while the post does.",
  },
  {
    q: "Why is my clip worth $0.00?",
    a: "Either it's under the campaign's view floor, or it hasn't been approved yet. Both are shown on the clip itself under Clips. A clip under the floor starts earning as soon as it passes it — nothing needs resubmitting.",
  },
  {
    q: "Why can't I withdraw what I'm owed?",
    a: "Money becomes withdrawable once the campaign it came from is released for payout, which happens after the figures are checked. Until then it shows as \"earned, awaiting release\" on Payouts.",
  },
  {
    q: "How do I get paid?",
    a: "Run /withdraw in Discord. It pays to the address on your Payouts page, so check that first. Network fees come out of the amount sent.",
  },
  {
    q: "What does Take down do?",
    a: "It stops that clip earning, for good. It does not pay you out — that's /withdraw. A clip taken down keeps its history but earns nothing from then on.",
  },
  {
    q: "Can I post from any account?",
    a: "Only from accounts registered under Accounts, so we can tell your posts from someone else's. Adding one runs through /register in Discord.",
  },
];

export default async function HelpPage({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  // Checked here too — a layout guard isn't a boundary, since this page can be
  // requested on its own.
  if (!clipperSignatureValid(userId, sig)) notFound();

  const base = `/clipper/${encodeURIComponent(userId)}/${sig}`;

  return (
    <>
      <PageHeading title="Help" subtitle="How clipping, earning and getting paid work." />

      <dl className="mt-8 max-w-2xl space-y-4">
        {FAQ.map((item) => (
          <div
            key={item.q}
            className="surface rounded-2xl border border-border bg-card px-5 py-4"
          >
            <dt className="font-medium">{item.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
        Still stuck? Ask in Discord — that&apos;s where clips, accounts and payouts are all
        handled. Your{" "}
        <Link href={base} className="text-primary-ink underline-offset-4 hover:underline">
          campaigns
        </Link>{" "}
        are the quickest place to see what&apos;s open.
      </p>
    </>
  );
}
