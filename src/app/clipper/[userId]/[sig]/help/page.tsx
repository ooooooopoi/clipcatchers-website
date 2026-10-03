import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/clipper/chrome";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE } from "@/lib/discord";
import { clipperSignatureValid } from "@/lib/share";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Help" };

/**
 * Static, so it stays up when the bot doesn't — the moment someone most wants
 * to know how any of this works is when something looks wrong.
 */
// Each answer that names a place on this site has a button to it. They used
// to send people to Discord commands (/withdraw, /register) for things the
// site now does itself, and to Payouts and Clips pages that were folded into
// Earnings and the dashboard.
const FAQ: { q: string; a: string; action?: { label: string; href: string } }[] = [
  {
    q: "How much is a clip worth?",
    a: "Views on the live post divided by the campaign's rate. A campaign paying $10 per 100K views pays $5 for a clip on 50K. Views are re-read regularly, so the figure moves while the post does.",
  },
  {
    q: "Why is my clip worth $0.00?",
    a: "Either it's under the campaign's view floor, or it hasn't been approved yet. Both are shown on the clip itself in your clip list. A clip under the floor starts earning as soon as it passes it — nothing needs resubmitting.",
    action: { label: "See your clips", href: "#clips" },
  },
  {
    q: "Why can't I withdraw what I'm owed?",
    a: "Money becomes withdrawable once the campaign it came from is released for payout, which happens after the figures are checked. Until then it shows as awaiting release on Earnings.",
    action: { label: "Open Earnings", href: "/earnings" },
  },
  {
    q: "How do I get paid?",
    a: "Add a payout method on your Earnings page, then press Withdraw. It pays to that method, so check it first. Network fees come out of the amount sent.",
    action: { label: "Open Earnings", href: "/earnings" },
  },
  {
    q: "What does Take down do?",
    a: "It stops that clip earning, for good. It does not pay you out — Withdraw on Earnings does that. A clip taken down keeps its history but earns nothing from then on.",
  },
  {
    q: "Can I post from any account?",
    a: "Only from accounts added on your Accounts page, so we can tell your posts from someone else's. Add yours there, put the code we give you in your bio, and press Check my bio.",
    action: { label: "Open Accounts", href: "/accounts" },
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
            {item.action && (
              <dd className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href={`${base}${item.action.href}`}>{item.action.label}</Link>
                </Button>
              </dd>
            )}
          </div>
        ))}
      </dl>

      <div className="mt-8 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Still stuck? Ask in the Discord server and someone will help.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <a href={DISCORD_INVITE} target="_blank" rel="noopener noreferrer">
            Ask in Discord
          </a>
        </Button>
      </div>
    </>
  );
}
