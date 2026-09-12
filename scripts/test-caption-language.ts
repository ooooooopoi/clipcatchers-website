/**
 * Does the caption filter keep the homepage English?
 *
 *   npx tsx scripts/test-caption-language.ts
 *
 * The captions below are real ones returned by TikTok's oEmbed for clips in
 * this database, not invented examples — including the two French POV posts
 * that were visibly sitting on the live homepage and prompted the filter.
 *
 * Plain script rather than a test runner, matching clip-catchers-bot/tests:
 * this repo has no test framework and one heuristic does not justify adding
 * one.
 */
import { looksEnglish } from "../src/lib/caption-language";

let failed = 0;

function check(caption: string, want: boolean, note = "") {
  const got = looksEnglish(caption);
  const ok = got === want;
  if (!ok) failed += 1;
  const shown = caption.length > 62 ? `${caption.slice(0, 62)}…` : caption;
  console.log(
    `  ${ok ? "PASS " : "FAIL "} ${want ? "keep  " : "drop  "} ${JSON.stringify(shown)}${note ? `  — ${note}` : ""}`,
  );
}

console.log("\n--- real captions from this database ---");
check("Relatable😂?#relatable #couple #gf #bf #viral ", true);
check("#viral #fyp #relatable #humour #viralmemes", true, "English/neutral tags");
check("POV: me counting day until I get to see you again", true);
check(
  "POV: quand tu viens de crier sur ton copain mais qu'il ne te crie pas dessus en retour",
  false,
  "was on the live homepage",
);
check(
  "POV: Moi en train de compter combien de temps il reste avant de revoir mon homme",
  false,
  "was on the live homepage",
);
check("POV: eu ouvindo meu namorado dizer que nao vai me deixar", false);

console.log("\n--- English that must not be thrown away ---");
check("This is the craziest thing I've ever seen", true);
check("she said no to me on a daily basis", true);
check("Crazy fans reaction after knick's win", true);
check("my husband: we're going to my parents' house", true);
check("", true, "no caption is not evidence of anything");
check("😭😭😭", true, "no letters at all");
check("#fyp", true);
check("#humour", true, "British spelling — must never be on the reject list");
check("#humor", true, "American spelling, same");
check("A queue for the bus, and I passed", true, "‘que’ and ‘pas’ inside English words");
check("No pain no gain", true, "single stray match is a coincidence, not a sentence");

console.log("\n--- accents are decisive on their own ---");
check("café vibes all day", false, "accented letter in the prose");
check("best day ever #café", false, "an accented tag is a declared audience");

console.log(
  "\n" + (failed === 0 ? "ALL PASS" : `${failed} FAILED`),
);
process.exit(failed === 0 ? 0 : 1);
