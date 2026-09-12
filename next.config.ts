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
