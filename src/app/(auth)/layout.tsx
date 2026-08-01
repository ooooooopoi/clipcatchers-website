import Link from "next/link";
import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { BrandWordmark } from "@/components/brand";

const HIGHLIGHTS = [
  {
    icon: BarChart3,
    title: "Every clip, one view",
    body: "Live views, reach and CPM across every creator running your campaign.",
  },
  {
    icon: Sparkles,
    title: "Launch in minutes",
    body: "Brief, assets and budget in a single guided flow — we handle the rest.",
  },
  {
    icon: ShieldCheck,
    title: "Verified reporting",
    body: "Numbers pulled from the platforms themselves, never self-reported.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />

      <div className="relative z-10 flex w-full flex-col justify-center px-6 py-12 lg:w-[52%] lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-block">
            <BrandWordmark />
          </Link>
          <div className="mt-10">{children}</div>
        </div>
      </div>

      <div className="relative hidden border-l border-border/60 bg-card/30 lg:flex lg:w-[48%] lg:flex-col lg:justify-center lg:px-16">
        <div className="max-w-md">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Clip Catchers for brands
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
            The dashboard your campaign reporting deserves.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Brief your campaign, drop your assets, and watch performance land in real time —
            without chasing a single spreadsheet.
          </p>

          <div className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
