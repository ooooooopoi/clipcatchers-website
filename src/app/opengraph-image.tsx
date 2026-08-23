import { ImageResponse } from "next/og";
import { RATE_PER_THOUSAND } from "@/lib/pricing";
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
 * White, matching the site. A charcoal card would sit better against Discord's
 * dark theme, but it would be the only place the brand appears on a dark
 * ground and the first impression should look like the page it opens.
 */
export const runtime = "edge";
export const alt = "Clip Catchers — performance-based creator distribution for brands";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ORANGE = "#FC7800";
const INK = "#A84F00";
const TEXT = "#0D0F0C";
const MUTED = "#6B6F68";
const BORDER = "#E1E3DF";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFFFF",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* A single brand rule along the top, the same gradient the comparison
            table uses to mark our column. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            background: `linear-gradient(to right, ${ORANGE}, #FCA800)`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: ORANGE,
                display: "flex",
              }}
            />
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
            Scale your brand through&nbsp;<span style={{ color: INK }}>hundreds of creators</span>
          </div>

          <div
            style={{
              marginTop: 26,
              fontSize: 29,
              color: MUTED,
              lineHeight: 1.4,
              maxWidth: 880,
              display: "flex",
            }}
          >
            Launch TikTok and Instagram campaigns and pay only for views that actually
            landed — not an influencer retainer.
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
            [`$${RATE_PER_THOUSAND.toFixed(2)}`, "per 1,000 views"],
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
