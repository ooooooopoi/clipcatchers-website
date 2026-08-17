import { redirect } from "next/navigation";

/**
 * Billing is gone, but the path isn't 404'd.
 *
 * It sold Starter/Growth/Scale subscriptions the business never offered —
 * clients are billed per 1,000 delivered views, invoiced outside this app.
 * The route survives as a redirect because it was in the sidebar for months
 * and is sitting in browser histories and bookmarks.
 */
export default function BillingPage() {
  redirect("/dashboard");
}
