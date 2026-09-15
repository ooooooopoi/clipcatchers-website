/**
 * The two ways a call gets into a calendar.
 *
 * ── Why there are two ───────────────────────────────────────────────────
 * The form used to ask "when suits you?" and offer four chips: as soon as
 * possible, this week, next week, no rush. The comment beside them argued
 * against a date picker on the grounds that we don't publish availability, so
 * a picker would be offering slots we can't promise. That was right about
 * *our* picker and wrong as a conclusion — a real scheduler owns real
 * availability, so it can promise a slot because it holds the calendar.
 *
 * So: embed the scheduler when one is configured, and keep the ask-for-a-time
 * form behind it for anyone who opens every slot and finds none of them work.
 * A booking flow whose only answer is "none of these" is a dead end, and the
 * person who hits it is by definition the one still trying.
 */

/**
 * The scheduler to embed, or null to fall back to the request form.
 *
 * NEXT_PUBLIC_ because this ends up as an iframe src in the browser — there is
 * nothing secret in a public booking page, and a server-only var would render
 * an empty frame with no way to tell why.
 *
 * Read through a function rather than exported as a constant so it is read at
 * call time: Next inlines NEXT_PUBLIC_ vars at build, and a module-level
 * constant makes that inlining harder to reason about when the value is unset.
 */
export function bookingUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_BOOKING_URL?.trim();
  if (!raw) return null;
  // https only, and parsed rather than pattern-matched: this string becomes an
  // iframe src, so a value that isn't a URL should render nothing rather than
  // a broken frame — and one that isn't https would be a mixed-content block
  // that looks like the scheduler being down.
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Time-of-day preferences, for the request-a-time fallback. */
export const CALL_TIMES = ["Morning", "Afternoon", "Evening", "Any time"] as const;

/**
 * The visitor's UTC offset as a short label — "GMT+3", "GMT-5:30", "GMT".
 *
 * Browser-only: on the server this would report the server's timezone, which
 * is both wrong and a hydration mismatch. Every caller computes it in an
 * effect or at submit.
 */
export function localTimezoneLabel(): string {
  // getTimezoneOffset is minutes *behind* UTC, so the sign is inverted from
  // how it's written: UTC+3 reports -180.
  const minutes = -new Date().getTimezoneOffset();
  if (minutes === 0) return "GMT";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `GMT${sign}${hours}${rest ? `:${String(rest).padStart(2, "0")}` : ""}`;
}

/**
 * Compose the requested time into one line for the existing `callWindow`
 * field.
 *
 * Deliberately not three new keys. `callWindow` is free text all the way to
 * the Discord embed a human reads, so composing into it means the date, the
 * time of day and the timezone arrive without a new field in the API schema or
 * the bot — the same reason the budget figure rides `budget`.
 *
 * Capped at 60 characters because that is what the API schema accepts; a
 * longer string would be rejected and take the whole enquiry with it.
 */
export function composeCallWindow(input: {
  date?: string;
  time?: string;
  timezone?: string;
}): string {
  const parts: string[] = [];

  if (input.date) {
    // Parsed as local midday rather than the date string alone: `new
    // Date("2026-09-22")` is parsed as UTC midnight, which in any timezone
    // behind UTC renders as the day before — so a visitor in New York asking
    // for the 22nd would have "Mon 21 Sep" sent to us.
    const [y, m, d] = input.date.split("-").map(Number);
    if (y && m && d) {
      const local = new Date(y, m - 1, d, 12);
      if (!Number.isNaN(local.getTime())) {
        parts.push(
          local.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }),
        );
      }
    }
  }

  // Lowercased only when it follows a date ("Tue 22 Sept, afternoon"), and
  // keyed on a date having actually been *rendered* rather than merely
  // supplied — an unparseable date pushes nothing, and testing the input
  // instead left the time starting the string in lowercase.
  if (input.time) parts.push(parts.length ? input.time.toLowerCase() : input.time);
  if (!parts.length) return "";

  const line = parts.join(", ");
  const withZone = input.timezone ? `${line} (${input.timezone})` : line;
  return withZone.slice(0, 60);
}

/**
 * The earliest date worth offering, as a `yyyy-mm-dd` for an input's `min`.
 *
 * Today, not tomorrow: "as soon as possible" is a real answer and someone
 * asking at 9am may well mean this afternoon.
 */
export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
