import {
  Coins,
  Dices,
  Gamepad2,
  Mic,
  Music,
  ShoppingBag,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * The eight categories, with enough behind each one to hold a page.
 *
 * ── Why these have their own pages now ──────────────────────────────────
 * This was one grid of eight cards on the homepage, three lines each. That is
 * the right size for "yes, we've done your category" and the wrong size for
 * the question that actually follows it — "so what would creators post about
 * *us*?" A gaming studio and a podcast get the same answer from a shared
 * page, and it's the generic one, which is the answer that loses the deal.
 *
 * ── What is deliberately not in here ────────────────────────────────────
 * No results, no CPMs, no client names, no "brands in this category see X".
 * We report per-client figures to that client and nowhere else, and a
 * category-level average would be reverse-engineerable from a small enough
 * set of campaigns. Every page ends by pointing at /results, which is built
 * from real reporting and is anonymised at source.
 *
 * The `angles` are the useful, checkable part: they are what a brief in this
 * category usually asks for, which is the thing a prospect cannot get from a
 * competitor's homepage.
 */
export type UseCase = {
  slug: string;
  name: string;
  /** Menu-length. One line, lower case, no full stop. */
  goal: string;
  icon: LucideIcon;
  /** The page's own headline. Set in the display face, so keep it short. */
  headline: string;
  /** Two or three sentences. The category's specific version of the pitch. */
  intro: string;
  /** What the brand hands over. Answers "do I need to make anything?" */
  assets: string[];
  /** How creators actually cut it. The bit nobody else will tell them. */
  angles: { title: string; body: string }[];
  /** What the brief usually locks down in this category. */
  rules: string[];
  /** The honest caveat. One per category, and it has to be a real one. */
  caveat: string;
};

export const USE_CASES: UseCase[] = [
  {
    slug: "music",
    name: "Music & labels",
    goal: "Saves and streams in the first 72 hours",
    icon: Music,
    headline: "Put the hook in front of the people who save it",
    intro:
      "A release has one window where distribution matters more than anything else, and it is measured in days. Clipping puts the same eight seconds of a track across hundreds of accounts inside that window, from creators whose audiences already watch this kind of edit.",
    assets: [
      "The track, or just the hook — 8 to 20 seconds is plenty",
      "The official sound link on TikTok or Instagram, so plays attribute to you",
      "Any footage you already have: video, stills, cover art",
      "A note on what the song is about, if the edit should match it",
    ],
    angles: [
      {
        title: "Hook over borrowed footage",
        body: "The most common cut by a distance. Creators lay the hook over gameplay, vlog, anime or edit footage their audience already follows them for. The song carries; the footage is the delivery vehicle.",
      },
      {
        title: "Lyric and caption edits",
        body: "One line of the song on screen, timed to land. Works when the lyric itself is the reason someone would send the clip to a friend.",
      },
      {
        title: "Reaction and first-listen",
        body: "Genuine first-play reactions from creators who post them regularly. Slower to produce, and the one angle that reads as an endorsement rather than a soundbed.",
      },
    ],
    rules: [
      "Use the official sound, not a re-upload — otherwise plays don't attribute",
      "A minimum view threshold before a clip counts",
      "Anything you don't want the track associated with",
    ],
    caveat:
      "Clipping moves distribution, not taste. If the hook doesn't hold a scroll, more clips is a more expensive way to find that out — and we'd rather tell you before the budget goes in.",
  },
  {
    slug: "gaming",
    name: "Gaming",
    goal: "Wishlists before launch, installs after",
    icon: Gamepad2,
    headline: "Your game, cut by people who play games",
    intro:
      "Gaming is the category where the footage already exists and the audience is already on the platform. What's usually missing is volume: one trailer on one channel, against a launch window where the wishlist count is decided.",
    assets: [
      "Capture footage, or a build key so creators can capture their own",
      "The trailer, if there is one",
      "Store page or wishlist link",
      "Anything under embargo, stated clearly",
    ],
    angles: [
      {
        title: "Highlight and 'wait, what' moments",
        body: "The 10 seconds where something surprising happens. This is the cut that travels, and it is almost never the one in the trailer.",
      },
      {
        title: "First-look and patch reactions",
        body: "Creators reacting to a reveal, a patch or a mechanic. Reads as coverage rather than an ad, which is the point.",
      },
      {
        title: "Comparison and 'games like this'",
        body: "Positioning against something the audience already knows. Useful pre-launch when nobody has played it yet.",
      },
    ],
    rules: [
      "Embargo dates, and what may not be shown before them",
      "Spoiler boundaries",
      "Whether store links go in the caption or the bio",
    ],
    caveat:
      "Pre-launch, the honest metric is wishlists, and wishlists lag views by days. If you need a number the same afternoon, this will look slower than it is.",
  },
  {
    slug: "apps",
    name: "Apps",
    goal: "Installs at a CPM paid social can't reach",
    icon: Smartphone,
    headline: "Show the thing working, a few hundred times",
    intro:
      "App install ads compete in the most expensive auction on the platform. Clipping sidesteps the auction: the same demo, posted organically by creators, reaching the same feed without paying for placement.",
    assets: [
      "A test account, or a build creators can actually use",
      "Screen recordings, if you'd rather they didn't record their own",
      "App store link and any tracking link you want used",
      "The one feature you want shown",
    ],
    angles: [
      {
        title: "Screen-recorded demo",
        body: "Someone using the app, narrated. Boring to describe and consistently the one that converts, because it answers 'what is this' in four seconds.",
      },
      {
        title: "Before and after",
        body: "The problem, then the app solving it. Needs a problem the audience recognises without explanation.",
      },
      {
        title: "'Apps I use for X'",
        body: "Yours inside a list. Lower intent per view, but it gets posted by creators who wouldn't post a straight ad.",
      },
    ],
    rules: [
      "Which features are fair game and which are still half-built",
      "Whether the tracking link must appear",
      "No claims about what the app does that it doesn't",
    ],
    caveat:
      "Views are ours to measure; installs are yours. We can't see your attribution, so agree upfront which of your numbers we're both looking at.",
  },
  {
    slug: "crypto",
    name: "Crypto",
    goal: "Awareness ahead of a listing or a mint",
    icon: Coins,
    headline: "Reach on the channels that won't take your ad",
    intro:
      "Most paid channels either refuse crypto outright or bury it in review. Creator distribution is the route that stays open — which is exactly why the brief matters more here than anywhere else on this list.",
    assets: [
      "What the project actually does, in plain words",
      "Chart, docs, or announcement to reference",
      "Listing or mint date",
      "Your compliance line, written down",
    ],
    angles: [
      {
        title: "Explainer",
        body: "What it is and why it exists, in under a minute. The only angle that survives an audience that has seen a thousand of these.",
      },
      {
        title: "Announcement reaction",
        body: "A listing, a partnership, a mainnet date. Timely, and short-lived — it works in the window and not after.",
      },
      {
        title: "Chart and mechanics breakdown",
        body: "For audiences that already trade. Narrower reach, considerably higher intent.",
      },
    ],
    rules: [
      "No price predictions, no returns, no 'guaranteed' anything",
      "Required disclosure wording, exactly as your counsel wants it",
      "Whether creators may hold the token they're posting about",
    ],
    caveat:
      "We reject clips that make financial promises, and that rejection costs the creator their payout, not you. It also means a brief that quietly wants those claims will underdeliver — say what you actually want and we'll tell you if we'll run it.",
  },
  {
    slug: "igaming",
    name: "iGaming & casino",
    goal: "Signups from an audience paid channels restrict",
    icon: Dices,
    headline: "Distribution in a category that's locked out of the auction",
    intro:
      "iGaming is restricted or banned on most paid inventory, in most territories. What's left is creators — and a category where getting the rules right is the entire job, because the downside of getting them wrong isn't a wasted budget, it's a licence.",
    assets: [
      "Your licence conditions and the territories they cover",
      "Approved wording, and the wording that's forbidden",
      "Affiliate or signup links",
      "Session footage, if you have it",
    ],
    angles: [
      {
        title: "Session clips",
        body: "Real play, cut to the moment that turns. Within whatever your rules allow to be shown.",
      },
      {
        title: "Reaction cuts",
        body: "The moment, not the outcome. Travels well and stays the furthest from anything that reads as an inducement.",
      },
      {
        title: "How-it-works walkthroughs",
        body: "Mechanics and interface rather than winnings. The safest angle, and the one most likely to clear review.",
      },
    ],
    rules: [
      "Age gating and territory restrictions, per platform",
      "Mandatory responsible-gambling wording",
      "No implied returns, no 'guaranteed' outcomes",
    ],
    caveat:
      "We enforce the brief; we are not your compliance department. The rules you give us are the rules we apply, so they need to be the ones your regulator would recognise — we'll follow them exactly, including the gaps.",
  },
  {
    slug: "podcasts",
    name: "Podcasts",
    goal: "One episode into a week of short-form",
    icon: Mic,
    headline: "The best forty seconds, cut fifteen ways",
    intro:
      "Every episode already contains the clips. The work is finding them and posting them everywhere, every week, which is a volume problem — and volume is the thing a network of creators is for.",
    assets: [
      "The episode, video if you have it",
      "Timestamps you already know are good, if any",
      "Your handle and where you want listeners sent",
      "Guest permissions, where they apply",
    ],
    angles: [
      {
        title: "The disagreement",
        body: "Two people not agreeing, cut tight. Reliably the most-shared thirty seconds of any episode.",
      },
      {
        title: "The claim",
        body: "One surprising statement, with just enough context to be arguable. The comments do the rest.",
      },
      {
        title: "The story",
        body: "A self-contained anecdote with a beginning and an end. Slower, and the one that actually converts to a listen.",
      },
    ],
    rules: [
      "Which guests may and may not be clipped",
      "Whether captions are required",
      "Topics that are off the table",
    ],
    caveat:
      "Clip views and downloads are different numbers with different shapes. A clip can do very well and move downloads modestly — worth agreeing which one you're buying before we start.",
  },
  {
    slug: "consumer-brands",
    name: "Consumer brands",
    goal: "Reach and social proof at the top of the funnel",
    icon: ShoppingBag,
    headline: "Hundreds of people holding the thing",
    intro:
      "One polished brand film and a media buy reaches a number. A hundred creators holding the product reaches a different number and looks like other people's opinion, which is the part a brand film can't buy.",
    assets: [
      "Product, or footage of it if you'd rather not ship",
      "Brand kit and any packshots",
      "Where to send people",
      "What's true about the product, and what isn't",
    ],
    angles: [
      {
        title: "Unboxing and first impression",
        body: "Opening it, using it, saying what they think. Cheap to make and the closest thing to a review at volume.",
      },
      {
        title: "Demonstration",
        body: "The product doing the thing it's for, without narration if the visual carries.",
      },
      {
        title: "'Things I actually bought'",
        body: "Yours in a roundup. Less control, more credibility.",
      },
    ],
    rules: [
      "Claims you're allowed to make about the product",
      "Required disclosure, per platform and territory",
      "Whether the packaging must be visible",
    ],
    caveat:
      "Creators aren't reading a script, and honest first impressions include the unflattering ones. Clips that break the brief are rejected; clips that are simply lukewarm are not.",
  },
  {
    slug: "startups",
    name: "Startups & SaaS",
    goal: "Category awareness without a content team",
    icon: Sparkles,
    headline: "Distribution before you've hired for it",
    intro:
      "The gap for most early companies isn't the product, it's that nobody has heard of it and there's no one in the building whose job is to fix that. This is that job, bought by the campaign instead of by the headcount.",
    assets: [
      "A demo account or a walkthrough recording",
      "The one sentence that explains what you do",
      "Who it's for — the sharper the better",
      "Founder footage, if you're willing to be in it",
    ],
    angles: [
      {
        title: "Product walkthrough",
        body: "The workflow, start to finish, fast. Works when the before-state is a mess the audience recognises.",
      },
      {
        title: "Founder story",
        body: "Why this exists. Narrow reach, unusually high recall, and it only works if the founder is actually in it.",
      },
      {
        title: "Problem-first",
        body: "Name the problem for forty seconds and the product for five. The angle most likely to reach people who don't know your category exists.",
      },
    ],
    rules: [
      "What you can say about traction, and what you can't yet",
      "Whether competitors may be named",
      "Where signups should be sent",
    ],
    caveat:
      "Awareness is the honest goal here, and awareness is the hardest thing to attribute. If your board needs a signup number attached to this, say so now and we'll set it up to be measurable rather than argue about it later.",
  },
];

export function useCaseBySlug(slug: string): UseCase | undefined {
  return USE_CASES.find((c) => c.slug === slug);
}
