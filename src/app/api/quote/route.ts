import { NextResponse } from "next/server";
import { z } from "zod";
import { botUrl } from "@/lib/bot";

/**
 * A quote request from the public site, handed to the bot to deliver.
 *
 * Public and unauthenticated, so it is the one route a stranger can make this
 * server act on — hence the length caps, and hence the deliberate absence of
 * anything that renders the input. It answers with whether a human was
 * actually reached: telling someone "we've got it" when the enquiry went
 * nowhere is the failure they'd never discover.
 */
const Lead = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  artist: z.string().trim().max(160).optional().default(""),
  releaseDate: z.string().trim().max(60).optional().default(""),
  // Which vertical the enquiry is from. Zod strips unknown keys rather than
  // rejecting them, so a field missing from this schema doesn't fail loudly —
  // it just never arrives.
  category: z.string().trim().max(60).optional().default(""),
  budget: z.string().trim().max(60).optional().default(""),
  link: z.string().trim().max(400).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  // Never filled in by a person; bots fill every field they find. Accepted by
  // the schema rather than rejected by it, so a filled honeypot reaches the
  // silent-success below instead of a 400 that tells the bot it was spotted.
  company: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const parsed = Lead.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form and try again — a name and a valid email are needed." },
      { status: 400 },
    );
  }
  // Silently accepted, never delivered: a bot that fills the honeypot gets a
  // success it can't distinguish from the real thing.
  if (parsed.data.company) return NextResponse.json({ ok: true });

  const secret = process.env.INGEST_SECRET;
  if (!secret) {
    console.error("quote: INGEST_SECRET isn't set, so the lead can't be delivered");
    return NextResponse.json(
      { error: "We couldn't send that just now — please try again in a moment." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${botUrl()}/api/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-ingest-secret": secret },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
    if (!res.ok) {
      // Logged with the lead attached: if delivery is broken, the enquiry
      // should still exist somewhere we can read it back out of.
      console.error("quote: bot refused the lead", res.status, JSON.stringify(parsed.data));
      return NextResponse.json(
        { error: "We couldn't send that just now — please try again in a moment." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("quote: couldn't reach the bot", e, JSON.stringify(parsed.data));
    return NextResponse.json(
      { error: "We couldn't send that just now — please try again in a moment." },
      { status: 502 },
    );
  }
}
