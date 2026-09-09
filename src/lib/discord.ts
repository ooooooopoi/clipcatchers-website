/**
 * Where creators join.
 *
 * ── Why there is a real default and not an empty string ─────────────────
 * This was read straight from the environment in three separate files, each
 * falling back to "" and then to /signup. NEXT_PUBLIC_DISCORD_INVITE was never
 * set, so every "Join the network" button on the site pointed at the client
 * signup form — which the comment beside each of them already described as a
 * dead end for a clipper. Three copies of a fallback, all landing somewhere
 * nobody wanted to go.
 *
 * The invite is not a secret. It is handed out in Discord, pasted into TikTok
 * bios and printed on the bot's own landing page, so keeping it in an
 * environment variable bought no privacy and cost a working link. Same shape
 * as DEFAULT_BOT_URL in lib/bot.ts: a real value in code, overridable by the
 * environment when a deployment needs a different one.
 *
 * ── If the invite ever changes ──────────────────────────────────────────
 * Change it here. Setting NEXT_PUBLIC_DISCORD_INVITE in Vercel also works and
 * takes precedence, which is the faster route if the old link is being abused
 * and needs revoking before a deploy can finish.
 *
 * Discord invite codes are permanent unless revoked, so a stale value here
 * fails loudly — the link 404s in Discord rather than silently going nowhere.
 */
export const DISCORD_INVITE =
  process.env.NEXT_PUBLIC_DISCORD_INVITE || "https://discord.gg/7NYnJK7eqq";

/**
 * The same link, named for the thing it is used as.
 *
 * Creators join through Discord — that is where campaigns are briefed, clips
 * submitted and payouts run. There is no longer a /signup fallback: sending a
 * clipper to the client dashboard was worse than sending them nowhere, since
 * they arrive at an empty account with no way to reach a campaign.
 */
export const CREATOR_HREF = DISCORD_INVITE;

/**
 * Props for an anchor pointing at Discord.
 *
 * Spread rather than written out at each call site, because a link that opens
 * a new tab without `rel="noopener"` hands the destination a reference back to
 * this page — and it is easy to remember `target` and forget `rel`.
 */
export const DISCORD_LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;
