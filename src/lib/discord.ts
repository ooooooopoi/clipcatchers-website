/**
 * Where creators join.
 *
 * ── Read this before adding the environment variable back ───────────────
 * There is deliberately no NEXT_PUBLIC_DISCORD_INVITE lookup here, and that
 * is not an oversight. It used to read `process.env.X || <this value>`, and
 * the variable turned out to be set in Vercel to an invite that had expired:
 *
 *     env    https://discord.gg/nxwg4QmGW   -> 404 "Invite is expired."
 *     code   https://discord.gg/7NYnJK7eqq  -> 200
 *
 * Because the environment won, production served the dead link and every
 * creator following it was told the invite was invalid — while the working
 * one sat right here in the repo, deployed and unreachable. Locally the
 * variable was unset, so it looked correct everywhere it was tested.
 *
 * An override is only worth having if someone remembers it exists. This one
 * outlived the memory of whoever set it and silently shadowed the fix. One
 * value, in the file, where changing it is a diff someone reviews.
 *
 * ── If the invite ever changes ──────────────────────────────────────────
 * Change the line below. Discord invite codes are permanent unless revoked,
 * so a stale value fails loudly — Discord says "Invite is expired" rather
 * than quietly going nowhere, which is how this one was caught.
 *
 * Worth verifying without opening Discord:
 *     curl -s -o /dev/null -w "%{http_code}" \
 *       https://discord.com/api/v10/invites/<code>
 * 200 is live, 404 is expired or revoked.
 */
export const DISCORD_INVITE = "https://discord.gg/7NYnJK7eqq";

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
