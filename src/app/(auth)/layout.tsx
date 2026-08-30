import Link from "next/link";
import { BrandWordmark } from "@/components/brand";

/**
 * The sign-in shell. One centred column, and nothing else.
 *
 * It used to carry a marketing panel down the right-hand side — a headline,
 * a paragraph and three feature blurbs — which is a pitch aimed at someone
 * who has already bought. Everyone who reaches this page is either a client
 * signing in or the team; none of them need selling to, and the three claims
 * it made are all made properly on the homepage, where a reader can actually
 * check them.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col justify-center px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />

      <div className="relative z-10 mx-auto w-full max-w-sm">
        <Link href="/" className="inline-block">
          <BrandWordmark />
        </Link>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
