import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Payouts folded into Earnings — one subject, one page.
 *
 * A redirect rather than a deletion because this URL is already in the wild
 * where it can't be edited: Discord DMs from the bot, the notification panel's
 * stored links, and whatever anyone bookmarked. A 404 there reads as "my money
 * page is gone", which lands in support tickets; a redirect reads as nothing
 * at all.
 */
export default async function PayoutsRedirect({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  redirect(`/clipper/${encodeURIComponent(userId)}/${sig}/earnings`);
}
