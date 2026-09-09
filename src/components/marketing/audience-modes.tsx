"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ClipboardCheck,
  DollarSign,
  Eye,
  Gauge,
  Megaphone,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "brand" | "clipper";

type AudienceModesProps = {
  stats: {
    views: string;
    clips: string;
    creators: string;
    campaigns: string;
  };
  creatorHref: string;
  hasDiscordInvite: boolean;
  rate: string;
};

const BRAND_STEPS = [
  {
    icon: ClipboardCheck,
    title: "Brief the campaign",
    body: "Set the platform, budget, payout rate, view minimum, creative rules and assets creators should use.",
  },
  {
    icon: Users,
    title: "Creators start posting",
    body: "Verified clippers cut your content for TikTok and Instagram, then submit live links for review.",
  },
  {
    icon: ShieldCheck,
    title: "Only approved clips count",
    body: "Submissions that miss the brief can be rejected before they move budget or appear in the client report.",
  },
  {
    icon: BarChart3,
    title: "Watch delivery live",
    body: "Your dashboard shows the posts, handles, platforms and verified views behind the campaign total.",
  },
] as const;

const CLIPPER_STEPS = [
  {
    icon: BadgeCheck,
    title: "Register your account",
    body: "Connect the TikTok or Instagram handle you post from, so every submission can be tied back to you.",
  },
  {
    icon: ClipboardCheck,
    title: "Read the brief",
    body: "Check the payout rate, view minimum, platforms, rules and deadline before you spend time cutting.",
  },
  {
    icon: Megaphone,
    title: "Post and submit",
    body: "Publish from your verified account, paste the live link, and wait for approval from the campaign team.",
  },
  {
    icon: WalletCards,
    title: "Track what you earned",
    body: "Approved clips keep counting views. Your private page shows pending, approved, paid and owed clips.",
  },
] as const;

export function AudienceModes({
  stats,
  creatorHref,
  hasDiscordInvite,
  rate,
}: AudienceModesProps) {
  const [mode, setMode] = useState<Mode>("brand");
  const isBrand = mode === "brand";
  const steps = isBrand ? BRAND_STEPS : CLIPPER_STEPS;

  return (
    <section
      id="audience"
      className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-16"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-primary-ink">Two ways to use Clip Catchers</p>
        <h2 className="display mt-3 text-3xl sm:text-5xl">
          One system for brands and clippers
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          Brand mode shows how campaigns buy distribution. Clipper mode shows how creators
          join, post and track payouts. Brands see this first by default.
        </p>
      </div>

      <div
        className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1"
        role="tablist"
        aria-label="Choose audience mode"
      >
        {(["brand", "clipper"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
              mode === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            {value === "brand" ? <Megaphone className="size-4" /> : <BadgeCheck className="size-4" />}
            {value === "brand" ? "Brand mode" : "Clipper mode"}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface reveal rounded-2xl border border-border bg-card p-6 sm:p-8">
          <p className="eyebrow text-muted-foreground/70">
            {isBrand ? "For brands" : "For clippers"}
          </p>
          <h3 className="display mt-3 text-2xl sm:text-4xl">
            {isBrand
              ? "Launch with control, pay on proof"
              : "How clipping runs from post to payout"}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {isBrand
              ? "You give one clear brief, set the budget ceiling, and let verified creators compete for reach. Every approved post stays visible, so performance is easy to inspect."
              : "You do not need to pitch brands one by one. Pick an open campaign, follow the rules, post from a verified account, and let approved views decide what you earn."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(isBrand
              ? [
                  { label: "Price", value: `${rate} CPM`, icon: DollarSign },
                  { label: "Spend", value: "Budget capped", icon: Gauge },
                  { label: "Proof", value: "Every clip linked", icon: Eye },
                  { label: "Delivery", value: `${stats.views} views`, icon: BarChart3 },
                ]
              : [
                  { label: "Before posting", value: "Read the brief", icon: ClipboardCheck },
                  { label: "Account", value: "Verified handle", icon: BadgeCheck },
                  { label: "Views", value: "Tracked hourly", icon: Eye },
                  { label: "Payout", value: "Private balance", icon: WalletCards },
                ]
            ).map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-background p-4">
                <item.icon className="size-4 text-primary-ink" />
                <p className="mt-3 font-mono text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {isBrand ? (
              <>
                <Button asChild size="lg">
                  <Link href="/launch">
                    Start a campaign
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/launch?mode=call">Book a call</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <a
                    href={creatorHref}
                    {...(hasDiscordInvite
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    Join the network
                    <ArrowRight />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/for-creators">Read creator rules</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="surface reveal rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
                  <step.icon className="size-4 text-primary-ink" />
                </span>
                <span className="font-mono text-xs text-muted-foreground/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h4 className="display-sm mt-4 text-base">{step.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-center">
          <p className="font-mono text-sm font-semibold text-primary-ink">{stats.clips}</p>
          <p className="mt-1 text-xs text-muted-foreground">approved clips</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-center">
          <p className="font-mono text-sm font-semibold text-primary-ink">{stats.creators}</p>
          <p className="mt-1 text-xs text-muted-foreground">creators activated</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-center">
          <p className="font-mono text-sm font-semibold text-primary-ink">{stats.campaigns}</p>
          <p className="mt-1 text-xs text-muted-foreground">campaigns tracked</p>
        </div>
      </div>
    </section>
  );
}
