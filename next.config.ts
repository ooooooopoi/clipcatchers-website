import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["bcryptjs", "nodemailer"],
  eslint: { ignoreDuringBuilds: true },
  images: {
    // TikTok thumbnails for the clips wall. Routing them through next/image
    // isn't cosmetic: the source URLs are signed and expire, and the optimizer
    // keeps its own copy, so a tile goes on rendering after the signature
    // behind it has lapsed. Served from several regional CDN hosts, hence the
    // wildcards.
    remotePatterns: [
      { protocol: "https", hostname: "*.tiktokcdn.com" },
      { protocol: "https", hostname: "*.tiktokcdn-us.com" },
    ],
  },
  async redirects() {
    return [
      // The enquiry page moved from /quote to /launch when the button stopped
      // saying "Get a quote". Permanent, because links to /quote have already
      // gone out in DMs and there's no way to edit those.
      { source: "/quote", destination: "/launch", permanent: true },

      // ── One site, one domain ──────────────────────────────────────────
      // clipcatchers.co and clipcatchers.net both served the whole site,
      // identically. To a search engine that is duplicate content competing
      // with itself, and it splits whatever ranking either would have earned
      // between two addresses — which matters more than usual here, because
      // as of writing neither domain is indexed at all.
      //
      // .net is canonical. It is what every hardcoded reference in the source
      // already says (eight of them, against none for .co), what the privacy
      // page names, and what the OG card prints.
      //
      // permanent: true is a 308, not a 301, and that distinction is load
      // bearing: the Discord bot POSTs its sync to this host, and a 308 is the
      // only permanent redirect that obliges a client to keep the method and
      // the body. A 301 would quietly turn those posts into GETs.
      {
        source: "/:path*",
        has: [{ type: "host", value: "clipcatchers.co" }],
        destination: "https://clipcatchers.net/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.clipcatchers.co" }],
        destination: "https://clipcatchers.net/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
