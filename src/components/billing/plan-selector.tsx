"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Plan } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLAN_META } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const ORDER: Plan[] = ["STARTER", "GROWTH", "SCALE"];

export function PlanSelector({ current }: { current: Plan }) {
  const router = useRouter();
  const [changing, setChanging] = useState<Plan | null>(null);

  async function choose(plan: Plan) {
    if (plan === current) return;
    setChanging(plan);

    const res = await fetch("/api/billing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    setChanging(null);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't change your plan.");
      return;
    }
    // With Stripe keys configured the API returns a checkout URL instead.
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    toast.success(`You're on the ${PLAN_META[plan].label} plan`);
    router.refresh();
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ORDER.map((plan) => {
        const meta = PLAN_META[plan];
        const active = plan === current;
        const featured = plan === "GROWTH";

        return (
          <Card
            key={plan}
            className={cn(
              "relative flex flex-col p-6 transition-all",
              active && "border-primary/50 glow",
              !active && featured && "border-border/80",
            )}
          >
            {featured && !active && (
              <span className="absolute -top-2.5 left-6 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Most popular
              </span>
            )}
            {active && (
              <span className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                Current plan
              </span>
            )}

            <h3 className="text-lg font-semibold">{meta.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{meta.tagline}</p>

            <p className="mt-4">
              <span className="font-mono text-3xl font-semibold">
                {formatCurrency(meta.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground"> /month</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2.5">
              {meta.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="mt-6 w-full"
              variant={active ? "outline" : featured ? "default" : "secondary"}
              disabled={active}
              loading={changing === plan}
              onClick={() => choose(plan)}
            >
              {active
                ? "Current plan"
                : ORDER.indexOf(plan) > ORDER.indexOf(current)
                  ? `Upgrade to ${meta.label}`
                  : `Switch to ${meta.label}`}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
