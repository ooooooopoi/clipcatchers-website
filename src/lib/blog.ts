/**
 * Blog posts, as data.
 *
 * Not MDX and not a CMS. There are a handful of posts, they are written by the
 * people who run the product, and a route that maps a slug to an object in
 * this file is the whole system — no build step, no editor to host, no
 * dependency to keep current. If it ever reaches thirty posts, that is the
 * moment to reconsider, not before.
 *
 * ── A post here must also be reachable ──────────────────────────────────
 * /blog is in auth.config's PUBLIC_PREFIXES and in sitemap.ts. Adding a post
 * to this array covers both, because the sitemap maps over it — but if anyone
 * ever moves the route, both of those need moving too, or the sitemap will
 * advertise a URL that answers with a 307 to /login.
 *
 * Body paragraphs are plain strings. Deliberately: the day a post needs a
 * table or a diagram is the day to introduce a real content pipeline, and
 * until then an array of paragraphs can't render something the design system
 * has no opinion about.
 */
export type BlogSection = {
  heading: string;
  paragraphs: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  /** One sentence. Used on the index, in <meta description>, and in the OG card. */
  summary: string;
  /** ISO date. Shown to the reader and given to search engines as datePublished. */
  published: string;
  /** Rough minutes, honestly rounded — an overstated figure is a small lie a reader can check. */
  readingMinutes: number;
  intro: string[];
  sections: BlogSection[];
};

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-tell-if-campaign-views-are-real",
    title: "How to tell whether the views you paid for are real",
    summary:
      "Four checks a brand can run on any creator campaign, and what each one actually proves.",
    published: "2026-09-12",
    readingMinutes: 6,
    intro: [
      "Every creator campaign arrives with a number attached. Two million views, four hundred clips, a screenshot of a dashboard. The number is the product, and almost nobody is shown how it was arrived at.",
      "That matters because inflating it is cheap. Bought views cost a few dollars per thousand and land within hours. A campaign report is a spreadsheet, and a spreadsheet does not know where its figures came from. So the useful question is not whether a number is big — it is whether anyone can show you the individual posts behind it.",
      "Here are the four checks worth running, in the order they are worth running them.",
    ],
    sections: [
      {
        heading: "1. Ask where each figure was read from",
        paragraphs: [
          "There are only two ways a campaign knows how many views a clip has. Either something read the live post, or the creator typed a number into a form. The difference sounds pedantic and is the whole thing.",
          "Self-reported figures cannot be audited after the fact. If a creator overstates a clip by 40%, nothing in the system disagrees with them, and the total you are billed against is that overstatement plus everyone else's. Ask the question directly: is this read from the post, and how often? An answer that involves a person and a spreadsheet is an answer.",
          "The follow-up is when. A figure read once, on the day the clip went up, is a figure about the first few hours of a post's life. Views keep arriving for weeks afterwards, so a campaign that reads once is understating quiet posts and has no way to notice a spike that arrived overnight.",
        ],
      },
      {
        heading: "2. Ask to see one clip, chosen by you",
        paragraphs: [
          "A campaign total is unfalsifiable. A single post is not. Pick a clip — not one you are offered, one you pick — and ask for the link, the account, and what that clip was paid.",
          "Three things fall out of that. You can open the post and read the view count yourself. You can see whether the account looks like a real account with a real audience, or a shell with nine followers and forty uploads. And you can check that what the clip earned matches the rate you agreed, rather than a rate that drifted.",
          "If a campaign cannot produce that for an arbitrary clip, the total is not evidence of anything. Every figure on a report should be traceable down to one video, and if the chain breaks anywhere it breaks everywhere.",
        ],
      },
      {
        heading: "3. Look at the engagement, not the views",
        paragraphs: [
          "Bought views leave a signature. Views are the cheap thing to buy; comments, shares and saves are not, because they require accounts that behave like people. So a purchased clip tends to show a view count that has run away from everything else on the post.",
          "You do not need a model for this. Take the likes, comments, shares and saves, add them up, and divide by views. Organic short-form content usually lands somewhere in the low single-digit percentages. A clip at 800,000 views with 300 likes and no comments is not a clip that 800,000 people watched.",
          "Two honest caveats. A genuinely viral post reaching far beyond its creator's audience will show a lower ratio than their normal work, because most of the reach is strangers who scrolled past. And a clip can be engagement-poor for dull reasons — a bad hook, the wrong audience — without anything being bought. This is a flag for a human to look at, not a verdict.",
        ],
      },
      {
        heading: "4. Check that the account was verified before it earned",
        paragraphs: [
          "The gap most people miss is ownership. If anyone can submit any link, then a campaign is paying for views on posts the submitter may have nothing to do with — someone else's viral video, pasted into a form.",
          "The fix is dull and effective: before a creator's clips count for anything, they prove the account is theirs. A one-time code placed in the profile bio and checked against the live profile does it. It takes a creator about a minute and it closes the hole permanently.",
          "Ask whether this happens, and whether it happens before the first clip earns or after somebody complains.",
        ],
      },
      {
        heading: "What good looks like",
        paragraphs: [
          "A campaign you can audit has four properties. Every view figure was read from the live post rather than reported. Every figure traces to one clip, which you can open. Clips are checked for the engagement pattern bought views leave behind, and failing ones earn nothing. And accounts prove ownership before they can earn at all.",
          "None of that is exotic, and all of it is checkable by a buyer in about ten minutes. If you are about to fund a campaign, run the four checks on whoever you are about to fund — including us. A campaign that objects to being asked has told you something useful.",
        ],
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Newest first, which is the only order an index of these should ever use. */
export function sortedPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.published.localeCompare(a.published));
}
