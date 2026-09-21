import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * The Clips page is gone; the campaigns board took its job.
 *
 * Submitting happens on the campaign card itself now — the form opens there
 * with the campaign preselected — so a page whose centrepiece was the same
 * form behind a "which campaign?" picker had nothing left to be. A redirect
 * rather than a 404 because the address is still stored in notification
 * panels and old DMs, where "page not found" reads as something being broken
 * rather than moved.
 */
export default async function ClipsRedirect({
  params,
}: {
  params: Promise<{ userId: string; sig: string }>;
}) {
  const { userId, sig } = await params;
  redirect(`/clipper/${encodeURIComponent(userId)}/${sig}`);
}
