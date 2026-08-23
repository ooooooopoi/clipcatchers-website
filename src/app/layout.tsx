import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
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
      className={`${inter.variable} ${mono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
