import type { Metadata, Viewport } from "next";
import { Archivo, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Marketing headlines and figures only — scoped by the `.marketing` wrapper
// in globals.css, so the dashboard and the clipper portal keep their type.
//
// Chosen from evidence rather than taste. clouted.com, the site this one takes
// its energy from, sets its headlines in Obviously — a heavy grotesque — with
// a plain sans for body copy. Archivo is the closest free match, and its
// variable width axis is what lets it sit semi-expanded like Obviously does.
// `axes: ["wdth"]` is required: next/font ships only the axes you name.
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Without this, every relative image in a page's metadata — the OG cards,
  // the icon — resolves against localhost at build time and Next warns on
  // every build. It has to be absolute for a crawler or an unfurler, both of
  // which fetch the page from somewhere that isn't this machine.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://clipcatchers.net"),
  title: {
    default: "Clip Catchers — Client Dashboard",
    template: "%s · Clip Catchers",
  },
  description:
    "Track campaign performance, budgets and deliverables across every clip your creators publish.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // White, matching the page. This was #0a0a0b, which painted a near-black
  // band of browser chrome above a white site on every mobile visit — the
  // first thing anyone saw on a phone was a colour the product doesn't use.
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior is what tells Next to suppress the smooth scroll
    // set in globals.css during a route change — without it a navigation
    // animates the scroll position instead of jumping, and Next warns.
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
