"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { KeyRound, Mail, Save, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dropzone } from "@/components/files/dropzone";
import { initials } from "@/lib/format";

type Props = {
  name: string;
  email: string;
  company: string | null;
  image: string | null;
  prefs: {
    emailCampaignUpdates: boolean;
    emailInvoices: boolean;
    emailProductUpdates: boolean;
    emailMarketing: boolean;
  };
};

const PREF_COPY = [
  {
    key: "emailCampaignUpdates" as const,
    title: "Campaign updates",
    detail: "Approvals, launches and completions.",
  },
  {
    key: "emailInvoices" as const,
    title: "Invoices & receipts",
    detail: "When an invoice is issued or paid.",
  },
  {
    key: "emailProductUpdates" as const,
    title: "Product updates",
    detail: "New dashboard features worth knowing about.",
  },
  {
    key: "emailMarketing" as const,
    title: "Marketing",
    detail: "Occasional case studies and offers.",
  },
];

export function SettingsForms({ name, email, company, image, prefs }: Props) {
  const router = useRouter();
  const { update } = useSession();

  const [profile, setProfile] = useState({
    name,
    company: company ?? "",
    image: image ?? "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [emailForm, setEmailForm] = useState({ email, password: "" });
  const [savingEmail, setSavingEmail] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifications, setNotifications] = useState(prefs);
  const [savingPrefs, setSavingPrefs] = useState(false);

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  async function saveProfile() {
    setSavingProfile(true);
    const { ok, data } = await patch({ action: "profile", ...profile });
    setSavingProfile(false);
    if (!ok) return toast.error(data.error ?? "Couldn't save your profile.");

    await update({ name: profile.name, image: profile.image || null, company: profile.company });
    toast.success("Profile updated");
    router.refresh();
  }

  async function saveEmail() {
    setSavingEmail(true);
    const { ok, data } = await patch({ action: "email", ...emailForm });
    setSavingEmail(false);
    if (!ok) return toast.error(data.error ?? "Couldn't change your email.");

    setEmailForm((prev) => ({ ...prev, password: "" }));
    toast.success("Email updated");
    router.refresh();
  }

  async function savePassword() {
    if (passwords.newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters.");
    }
    setSavingPassword(true);
    const { ok, data } = await patch({ action: "password", ...passwords });
    setSavingPassword(false);
    if (!ok) return toast.error(data.error ?? "Couldn't change your password.");

    setPasswords({ currentPassword: "", newPassword: "" });
    toast.success("Password changed");
  }

  async function savePrefs(next: typeof notifications) {
    setNotifications(next);
    setSavingPrefs(true);
    const { ok } = await patch({ action: "notifications", ...next });
    setSavingPrefs(false);
    if (!ok) {
      setNotifications(notifications);
      toast.error("Couldn't save your preferences.");
      return;
    }
    toast.success("Preferences saved");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
          <CardDescription>How your account appears across the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile.image ? <AvatarImage src={profile.image} alt={profile.name} /> : null}
              <AvatarFallback className="text-lg">{initials(profile.name || name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-[240px] flex-1">
              <Dropzone
                compact
                multiple={false}
                accept="image/*"
                hint="Square image, at least 200×200"
                onUploaded={(file) => setProfile((prev) => ({ ...prev, image: file.url }))}
              />
            </div>
            {profile.image && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfile((prev) => ({ ...prev, image: "" }))}
              >
                Remove photo
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profile.company}
                onChange={(e) => setProfile((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveProfile} loading={savingProfile}>
              <Save />
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4" />
              Email address
            </CardTitle>
            <CardDescription>Confirm with your password to change it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Current password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="current-password"
                value={emailForm.password}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={saveEmail}
                loading={savingEmail}
                disabled={!emailForm.password}
              >
                Update email
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Password
            </CardTitle>
            <CardDescription>Use at least 8 characters with a number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={savePassword}
                loading={savingPassword}
                disabled={!passwords.currentPassword || !passwords.newPassword}
              >
                Change password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Notification preferences</CardTitle>
          <CardDescription>Choose what lands in your inbox.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {PREF_COPY.map(({ key, title, detail }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-accent/40"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
              <Switch
                checked={notifications[key]}
                disabled={savingPrefs}
                onCheckedChange={(checked) => savePrefs({ ...notifications, [key]: checked })}
                aria-label={title}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
