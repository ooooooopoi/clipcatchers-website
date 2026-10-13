import { ImageResponse } from "next/og";
import { SITE_STATS } from "@/lib/site-stats";

/**
 * The card every shared link renders as.
 *
 * There wasn't one. `openGraph` carried a title and a description and no
 * image, so a link pasted into Discord, X, LinkedIn or iMessage came out as a
 * bare grey rectangle — on a business whose deals start in DMs, that's the
 * single highest-traffic surface there is and it was blank.
 *
 * Generated rather than exported as a PNG so the rate and the totals can't
 * drift from the page: both are imported from the same modules the site reads.
 *
 * Black, matching the site since 2026-09-30: the first impression should look
 * like the page it opens. The colours are the `theme-black` tokens in
 * globals.css — logo blue for the rule and the glow, the lighter text blue for
 * the highlighted words and figures. (It was still orange from before the site
 * went blue.)
 *
 * Both blues come from the brand icon (2026-10-13): BLUE is the tile,
 * #0052F2, and INK is its inner light-blue C, #8DC2FF (11.3:1 on black). The
 * corner mark is the icon itself rather than a plain blue square, because the
 * card is often the first time someone sees the brand and the square was a
 * placeholder for a logo the old artwork couldn't supply on black.
 */
export const runtime = "edge";
export const alt = "Clip Catchers — performance-based creator distribution for brands";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BLUE = "#0052F2";
const INK = "#8DC2FF";
const TEXT = "#FAFAFA";
const MUTED = "#9D9FA9";
const BORDER = "#25272E";

/**
 * The icon as a data URI. On the edge runtime there is no filesystem, so the
 * PNG is pulled in with `new URL(..., import.meta.url)`, which makes the
 * bundler ship the file with the function, and then inlined: the image
 * renderer reads a data URI without a second request, and a string `src`
 * keeps the <img> typed without a cast. Encoded in chunks because spreading
 * a 110 KB array into one String.fromCharCode call can overflow the stack.
 */
async function iconDataUri(): Promise<string> {
  const buffer = await fetch(new URL("../../public/brand/icon-1024.png", import.meta.url)).then(
    (res) => res.arrayBuffer(),
  );
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

export default async function OpengraphImage() {
  const icon = await iconDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(900px 460px at 50% -120px, rgba(0, 82, 242, 0.22), rgba(0, 82, 242, 0.06) 45%, transparent 75%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* A single brand rule along the top, logo blue into the text blue. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: `linear-gradient(to right, ${BLUE}, ${INK})`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* The icon carries its own rounded corners and transparent
                surround, so it sits on the black card with no backing tile. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- the image renderer only understands a plain <img>. */}
            <img src={icon} alt="" width={36} height={36} style={{ width: 36, height: 36 }} />
            <div style={{ fontSize: 26, fontWeight: 600, color: TEXT, letterSpacing: -0.4 }}>
              Clip Catchers
            </div>
          </div>

          <div
            style={{
              marginTop: 44,
              fontSize: 72,
              fontWeight: 600,
              color: TEXT,
              lineHeight: 1.06,
              letterSpacing: -2,
              maxWidth: 940,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            Get your brand into&nbsp;<span style={{ color: INK }}>millions of feeds</span>
          </div>

          <div
            style={{
              marginTop: 26,
              fontSize: 29,
              color: MUTED,
              lineHeight: 1.4,
              maxWidth: 880,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Broken by hand: the image renderer can't balance a wrap, and
                left to itself it stranded "and Shorts." on a line alone. */}
            <span>Hundreds of creators posting about your brand</span>
            <span>on TikTok, Reels and Shorts.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 44,
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 30,
          }}
        >
          {[
            ["Pay per view", "no retainer"],
            [SITE_STATS.viewsDelivered, "views delivered"],
            [SITE_STATS.clipsPublished, "clips published"],
            [SITE_STATS.creatorsPaid, "creators paid"],
          ].map(([value, label]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 38, fontWeight: 600, color: INK, letterSpacing: -1 }}>
                {value}
              </div>
              <div style={{ marginTop: 4, fontSize: 20, color: MUTED }}>{label}</div>
            </div>
          ))}

          <div
            style={{
              marginLeft: "auto",
              fontSize: 21,
              color: MUTED,
              display: "flex",
            }}
          >
            clipcatchers.net
          </div>
        </div>
      </div>
    ),
    size,
  );
}
