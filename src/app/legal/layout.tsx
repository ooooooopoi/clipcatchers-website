import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { SiteFooter } from "@/components/marketing/site-footer";

/**
 * Shared chrome for the legal pages.
 *
 * Deliberately plain — narrow measure, no decoration, nothing to scroll past.
 * Somebody reading this is checking a specific clause before signing off on a
 * budget, and every flourish between them and the text costs us time we don't
 * want to cost them.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-tight">Clip Catchers</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </header>

      {/* The prose rules live here rather than on each page, so the two can't
          drift apart in spacing or type size. */}
      <main
        className="mx-auto w-full max-w-3xl px-5 py-14
          [&_h2]:mt-12 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight
          [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-semibold
          [&_li]:leading-relaxed [&_li]:text-muted-foreground
          [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground
          [&_ul]:mt-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:[list-style:disc]
          [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4"
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
