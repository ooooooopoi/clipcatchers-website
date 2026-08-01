"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dropzone, UploadedList, type UploadedFile } from "@/components/files/dropzone";
import { CAMPAIGN_GOALS, PLATFORMS } from "@/lib/validations";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Brand", hint: "Who the campaign is for" },
  { title: "Logo", hint: "Your brand mark" },
  { title: "Assets", hint: "Footage and brand kit" },
  { title: "Details", hint: "What creators should make" },
  { title: "Budget", hint: "Spend and schedule" },
  { title: "Review", hint: "Check everything" },
  { title: "Submit", hint: "Send for approval" },
];

type FormState = {
  name: string;
  brandName: string;
  website: string;
  discord: string;
  description: string;
  goal: string;
  notes: string;
  budget: string;
  platforms: string[];
  startDate: string;
  endDate: string;
};

const EMPTY: FormState = {
  name: "",
  brandName: "",
  website: "",
  discord: "",
  description: "",
  goal: "",
  notes: "",
  budget: "",
  platforms: [],
  startDate: "",
  endDate: "",
};

export function CreateCampaignWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [logo, setLogo] = useState<UploadedFile | null>(null);
  const [assets, setAssets] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  function validateStep(index: number) {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (form.name.trim().length < 2) next.name = "Give the campaign a name";
      if (!form.brandName.trim()) next.brandName = "Brand name is required";
      if (form.website && !/^https?:\/\/.+/.test(form.website)) {
        next.website = "Must start with http:// or https://";
      }
    }
    if (index === 3) {
      if (!form.platforms.length) next.platforms = "Pick at least one platform";
      if (form.description.trim().length < 10) {
        next.description = "Tell creators what to make (10+ characters)";
      }
    }
    if (index === 4) {
      const amount = Number(form.budget);
      if (!form.budget || Number.isNaN(amount) || amount < 1) {
        next.budget = "Enter a budget of at least $1";
      }
      if (form.startDate && form.endDate && form.endDate < form.startDate) {
        next.endDate = "End date must be after the start date";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    // Re-check every gated step before sending.
    for (const index of [0, 3, 4]) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }

    setSubmitting(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        budget: Number(form.budget),
        brandLogoUrl: logo?.url ?? "",
        fileIds: [...assets.map((a) => a.id), ...(logo ? [logo.id] : [])],
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't create the campaign.");
      return;
    }
    setCreatedId(data.campaign.id);
    setStep(STEPS.length - 1);
    toast.success("Campaign submitted for review");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Step rail */}
      <ol className="hidden lg:block">
        {STEPS.map((s, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li key={s.title} className="relative flex gap-3 pb-6 last:pb-0">
              {index < STEPS.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[13px] top-7 h-full w-px",
                    done ? "bg-primary/50" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && !done && "border-primary bg-primary/10 text-primary",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="pt-0.5">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.title}
                </span>
                <span className="block text-xs text-muted-foreground/70">{s.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div>
        {/* Mobile progress */}
        <div className="mb-4 lg:hidden">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{STEPS[step].title}</span>
            <span className="text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {step === 0 && (
                  <div className="space-y-4">
                    <Header title="Brand information" hint="The basics we'll show creators." />
                    <Field label="Campaign name" error={errors.name}>
                      <Input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Summer Single Push"
                      />
                    </Field>
                    <Field label="Brand name" error={errors.brandName}>
                      <Input
                        value={form.brandName}
                        onChange={(e) => set("brandName", e.target.value)}
                        placeholder="Northwind Records"
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Website" optional error={errors.website}>
                        <Input
                          value={form.website}
                          onChange={(e) => set("website", e.target.value)}
                          placeholder="https://northwind.com"
                        />
                      </Field>
                      <Field label="Discord" optional>
                        <Input
                          value={form.discord}
                          onChange={(e) => set("discord", e.target.value)}
                          placeholder="discord.gg/northwind"
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <Header
                      title="Upload your logo"
                      hint="Square PNG or SVG works best — it appears on your campaign card."
                    />
                    {logo ? (
                      <UploadedList files={[logo]} onRemove={() => setLogo(null)} />
                    ) : (
                      <Dropzone
                        kind="LOGO"
                        multiple={false}
                        accept="image/*"
                        hint="PNG, JPG or SVG up to 50MB"
                        onUploaded={(file) => setLogo(file)}
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Optional — you can add it later from the campaign page.
                    </p>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <Header
                      title="Upload assets"
                      hint="Raw footage, brand kits, reference clips, guidelines."
                    />
                    <Dropzone
                      kind="BRAND_KIT"
                      onUploaded={(file) => setAssets((prev) => [...prev, file])}
                    />
                    <UploadedList
                      files={assets}
                      onRemove={(id) => setAssets((prev) => prev.filter((a) => a.id !== id))}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <Header title="Campaign details" hint="What should creators actually make?" />
                    <Field label="Description" error={errors.description}>
                      <Textarea
                        rows={5}
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Clip the chorus of the new single over gameplay or vlog footage. Hook in the first 2 seconds…"
                      />
                    </Field>
                    <Field label="Target platforms" error={errors.platforms}>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORMS.map((platform) => {
                          const selected = form.platforms.includes(platform);
                          return (
                            <button
                              key={platform}
                              type="button"
                              onClick={() =>
                                set(
                                  "platforms",
                                  selected
                                    ? form.platforms.filter((p) => p !== platform)
                                    : [...form.platforms, platform],
                                )
                              }
                              className={cn(
                                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                                selected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {selected && <Check className="mr-1.5 inline h-3 w-3" />}
                              {platform}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                    <Field label="Campaign goal" optional>
                      <Select value={form.goal} onValueChange={(v) => set("goal", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a primary goal" />
                        </SelectTrigger>
                        <SelectContent>
                          {CAMPAIGN_GOALS.map((goal) => (
                            <SelectItem key={goal} value={goal}>
                              {goal}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Notes for our team" optional>
                      <Textarea
                        rows={3}
                        value={form.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        placeholder="Anything we should know — do's, don'ts, approvals…"
                      />
                    </Field>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <Header title="Budget & schedule" hint="What you're willing to spend, and when." />
                    <Field label="Total budget (USD)" error={errors.budget}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          className="pl-7"
                          value={form.budget}
                          onChange={(e) => set("budget", e.target.value)}
                          placeholder="5000"
                        />
                      </div>
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Start date" optional>
                        <Input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => set("startDate", e.target.value)}
                        />
                      </Field>
                      <Field label="End date" optional error={errors.endDate}>
                        <Input
                          type="date"
                          value={form.endDate}
                          onChange={(e) => set("endDate", e.target.value)}
                        />
                      </Field>
                    </div>
                    {Number(form.budget) > 0 && (
                      <p className="rounded-lg border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                        At a typical{" "}
                        <span className="font-medium text-foreground">$2.50 CPM</span>, this budget
                        targets roughly{" "}
                        <span className="font-mono font-medium text-foreground">
                          {Math.round((Number(form.budget) / 2.5) * 1000).toLocaleString()}
                        </span>{" "}
                        views.
                      </p>
                    )}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <Header title="Review" hint="Last look before it goes to our team." />
                    <dl className="divide-y divide-border rounded-lg border border-border">
                      <Row label="Campaign" value={form.name} />
                      <Row label="Brand" value={form.brandName} />
                      <Row label="Website" value={form.website || "—"} />
                      <Row label="Discord" value={form.discord || "—"} />
                      <Row label="Platforms" value={form.platforms.join(", ") || "—"} />
                      <Row label="Goal" value={form.goal || "—"} />
                      <Row
                        label="Budget"
                        value={form.budget ? formatCurrency(Number(form.budget) * 100) : "—"}
                      />
                      <Row
                        label="Schedule"
                        value={
                          form.startDate || form.endDate
                            ? `${form.startDate || "—"} → ${form.endDate || "—"}`
                            : "Flexible"
                        }
                      />
                      <Row label="Logo" value={logo ? logo.name : "Not uploaded"} />
                      <Row
                        label="Assets"
                        value={assets.length ? `${assets.length} file(s)` : "None"}
                      />
                      <Row label="Description" value={form.description || "—"} />
                      {form.notes && <Row label="Notes" value={form.notes} />}
                    </dl>
                  </div>
                )}

                {step === 6 && (
                  <div className="py-6 text-center">
                    {createdId ? (
                      <>
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
                          <PartyPopper className="h-6 w-6 text-primary" />
                        </span>
                        <h2 className="mt-5 text-xl font-semibold">Campaign submitted</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{form.name}</span> is in
                          review. We typically approve within one business day, and you&apos;ll get
                          a notification the moment it goes live.
                        </p>
                        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                          <Button onClick={() => router.push(`/campaigns/${createdId}`)}>
                            View campaign
                          </Button>
                          <Button variant="outline" onClick={() => router.push("/campaigns")}>
                            All campaigns
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
                          <CheckCircle2 className="h-6 w-6 text-primary" />
                        </span>
                        <h2 className="mt-5 text-xl font-semibold">Ready to submit</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                          We&apos;ll review your brief and get clips live shortly after approval.
                        </p>
                        <Button className="mt-7" size="lg" onClick={submit} loading={submitting}>
                          {submitting ? "Submitting…" : "Submit campaign"}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {!createdId && step < STEPS.length - 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                <Button
                  variant="ghost"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                >
                  <ArrowLeft />
                  Back
                </Button>
                {step === STEPS.length - 2 ? (
                  <Button onClick={submit} loading={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" /> Submitting
                      </>
                    ) : (
                      <>
                        Submit campaign
                        <ArrowRight />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={goNext}>
                    Continue
                    <ArrowRight />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Header({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="pb-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {optional && <span className="ml-1.5 text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-2.5 text-sm">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{value}</dd>
    </div>
  );
}
