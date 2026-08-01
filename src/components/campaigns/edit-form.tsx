"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CAMPAIGN_GOALS, PLATFORMS } from "@/lib/validations";
import { cn } from "@/lib/utils";

function dateValue(date: Date | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export function CampaignEditForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: campaign.name,
    brandName: campaign.brandName,
    website: campaign.website ?? "",
    discord: campaign.discord ?? "",
    description: campaign.description ?? "",
    goal: campaign.goal ?? "",
    notes: campaign.notes ?? "",
    budget: String(campaign.budgetCents / 100),
    platforms: campaign.platforms,
    startDate: dateValue(campaign.startDate),
    endDate: dateValue(campaign.endDate),
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Give the campaign a name";
    if (!form.brandName.trim()) next.brandName = "Brand name is required";
    if (!form.platforms.length) next.platforms = "Pick at least one platform";
    if (!form.budget || Number(form.budget) < 1) next.budget = "Enter a budget of at least $1";
    if (form.website && !/^https?:\/\/.+/.test(form.website)) {
      next.website = "Must start with http:// or https://";
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = "End date must be after the start date";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, budget: Number(form.budget) }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Couldn't save your changes.");
      return;
    }
    toast.success("Campaign updated");
    router.push(`/campaigns/${campaign.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Brand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Campaign name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Brand name</Label>
              <Input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />
              {errors.brandName && <p className="text-xs text-destructive">{errors.brandName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://…"
              />
              {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
            </div>
            <div className="space-y-2">
              <Label>Discord</Label>
              <Input value={form.discord} onChange={(e) => set("discord", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Target platforms</Label>
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
            {errors.platforms && <p className="text-xs text-destructive">{errors.platforms}</p>}
          </div>
          <div className="space-y-2">
            <Label>Campaign goal</Label>
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
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Budget & schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Budget (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  min={1}
                  className="pl-7"
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                />
              </div>
              {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving}>
          <Save />
          Save changes
        </Button>
      </div>
    </div>
  );
}
