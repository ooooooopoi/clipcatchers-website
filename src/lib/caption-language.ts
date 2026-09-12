/**
 * Is this TikTok caption English enough to put on the homepage?
 *
 * ── What the data actually looks like ────────────────────────────────────
 * Read the real captions before touching this. On the clips in this database
 * they are almost entirely hashtags, or empty:
 *
 *     "#viral #fyp #relatable #humour #viralmemes"
 *     "#casal #humor #namorados #fyp #foryou"
 *     ""
 *
 * The first version of this module stripped hashtags as "no language" and so
 * passed every single clip, including the Portuguese and French ones. The
 * hashtags *are* the signal here; there is usually nothing else.
 *
 * ── The limit you cannot fix here ────────────────────────────────────────
 * The French posts that prompted this had English-neutral hashtags and their
 * French — "POV: quand tu viens de crier sur ton copain" — burned into the
 * video frame. oEmbed reports the caption, never the pixels, so no caption
 * test can catch those. Reading them needs OCR over the thumbnail, which is a
 * different project. This filter catches what is declared, not what is shown.
 *
 * ── The test ─────────────────────────────────────────────────────────────
 * Not "which language is this" — too little text to answer. Narrower: *is
 * there positive evidence this is not English?* Three kinds count:
 *
 *   1. Letters English does not use: é à ç ñ ã.
 *   2. Function words common in a neighbouring language and near-absent in
 *      English, whole-word, two or more — "que" in "queue" is English, and one
 *      stray "no" is a coincidence.
 *   3. A topical hashtag that only exists in another language: #casal,
 *      #namorados, #amour. One is enough, because a hashtag is a deliberate
 *      label rather than a passing word.
 *
 * Anything with no such evidence passes, including empty captions. That bias
 * is deliberate: dropping a borderline English clip costs one tile out of
 * thousands; keeping a French one costs the page its credibility.
 */

/** Letters that appear in fr/pt/es/de captions and not in English ones. */
const NON_ENGLISH_LETTERS = /[àâäãáçéèêëíìîïñóòôõöúùûüýÿœæßğşıžčšđ]/i;

/**
 * Whole words that are ordinary in a neighbouring language and effectively
 * absent from English. Deliberately short: every entry is a word this would
 * reject a caption for, so a false friend here silently deletes real clips.
 */
const WORDS = [
  // French
  "je", "tu", "il", "elle", "nous", "vous", "ils", "mon", "ton", "son", "ma",
  "mes", "tes", "ses", "ne", "pas", "que", "qui", "quand", "avec", "pour",
  "dans", "sur", "est", "sont", "une", "des", "les", "du", "au", "aux", "ce",
  "cette", "mais", "plus", "tout", "tous", "moi", "toi", "lui", "fait", "faire",
  "quoi", "oui", "non", "bien", "très", "meilleur", "copain", "copine",
  // Portuguese / Spanish
  "que", "nao", "não", "como", "para", "por", "com", "meu", "minha", "seu",
  "sua", "eu", "ele", "ela", "voce", "você", "eles", "elas", "isso", "esse",
  "essa", "muito", "mais", "quando", "porque", "pero", "todo", "toda", "bien",
  "hacer", "hace", "tambem", "também", "gente", "coisa", "vida", "amigo",
  "amiga", "novio", "novia", "siempre", "nunca", "dela", "dele",
  // German
  "ich", "du", "der", "die", "das", "und", "nicht", "ist", "mit", "auf",
  "ein", "eine", "wenn", "aber", "auch", "schon", "mehr", "sehr",
];

const WORD_SET = new Set(WORDS);

/**
 * Topic tags that only exist in another language. One is decisive, because a
 * creator choosing #namorados is labelling the post for a Portuguese audience.
 *
 * Every entry must be a word English genuinely does not use. #humour and
 * #humor are both English spellings and must never appear here — they are the
 * two most common tags in this dataset, and adding either would empty the
 * wall.
 */
const NON_ENGLISH_TAGS = new Set([
  // Portuguese / Spanish
  "casal", "casais", "namorados", "namorada", "namorado", "relacionamento",
  "pareja", "parejas", "novios", "novia", "novio", "amor", "risas", "gracioso",
  "engracado", "engraçado", "brasil", "espanol", "español", "mexicano",
  // French
  "amour", "couplefr", "drole", "drôle", "humourfr", "francais", "français",
  "petitcopain", "petitecopine", "rigolo",
  // German / Italian
  "liebe", "lustig", "beziehung", "paar", "amore", "coppia", "divertente",
]);

/** Words written as prose, with hashtags and mentions taken out. */
function proseWords(caption: string): string[] {
  return caption
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#@][\p{L}\p{N}_]+/gu, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** The words inside hashtags, which on this data is usually all there is. */
function tagWords(caption: string): string[] {
  return [...caption.toLowerCase().matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1]);
}

/** True unless there is positive evidence the caption is not English. */
export function looksEnglish(caption: string | null | undefined): boolean {
  if (!caption) return true; // nothing to judge; not evidence of anything

  // 3. Declared topic, checked first: on this data it is the only signal most
  // captions carry, and it is the strongest one when present.
  for (const tag of tagWords(caption)) {
    if (NON_ENGLISH_TAGS.has(tag)) return false;
    if (NON_ENGLISH_LETTERS.test(tag)) return false;
  }

  const prose = proseWords(caption);
  if (prose.length === 0) return true;

  // 1. Letters English doesn't use.
  if (NON_ENGLISH_LETTERS.test(prose.join(" "))) return false;

  // 2. Function words: one is a coincidence, two is a sentence.
  let hits = 0;
  for (const word of prose) {
    if (WORD_SET.has(word) && ++hits >= 2) return false;
  }
  return true;
}
