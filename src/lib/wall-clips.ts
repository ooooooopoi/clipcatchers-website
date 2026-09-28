/**
 * The clips on the homepage belt, chosen by eye.
 *
 * ── Why a list in the code, not a flag in the database ─────────────────────
 * The belt used to show whatever carried a featuredRank in production. That
 * column can only be written against the live database, so changing the belt
 * meant a database session nobody could run from here — and the set it pointed
 * at went stale for weeks. The list lives in the build instead, next to the
 * video files it names, and changes with a commit.
 *
 * ── How these were chosen (2026-09-28) ─────────────────────────────────────
 * Ranking alone does not work. Of the top 700 approved TikTok clips by reach,
 * 570 were photo slideshows, which cannot play as video at all. Of the video
 * posts, most carry burned-in French, Portuguese or Indonesian text, which no
 * caption test can see, on a homepage written in English. So every candidate
 * was looked at, two frames per clip from the actual transcoded file, and
 * kept only if it was:
 *   - English on screen, or carries no text
 *   - fit for a brand-facing page (no suggestive or grim captions)
 *   - legible in a 150px tile (not near-black, text not cropped at the edges)
 *
 * ── Rules for editing ──────────────────────────────────────────────────────
 * - Every id needs public/videos/<id>.mp4. scripts/featured.tsv is the fetch
 *   script's copy of this list; keep the two in step, then run
 *   scripts/fetch-clip-videos.py.
 * - Keep the count EVEN. The belt renders the run twice and alternates the
 *   lift by index; an odd count lands the second copy on the wrong phase.
 * - `views` is the reach read off the live post when the clip was picked. The
 *   belt shows the database's figure when it has a newer, larger one, so this
 *   is only the floor — never type a number in by hand.
 */
export type WallClipPick = { externalId: string; views: number };

// Empty on 2026-09-28 at the owner's request. The ten clips below were the
// best of the network's video posts, and every one of them but a single
// landscape shot was a relationship-meme caption over stock footage — not
// what a brand deciding whether to spend should see first. Add clips here
// (and their files) and the belt reappears on the homepage by itself.
export const WALL_CLIPS: WallClipPick[] = [];
