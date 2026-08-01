"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Eye, MoreHorizontal, Pause, Pencil, Play } from "lucide-react";
import { toast } from "sonner";
import type { CampaignStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CampaignActions({
  id,
  name,
  status,
  variant = "menu",
}: {
  id: string;
  name: string;
  status: CampaignStatus;
  variant?: "menu" | "buttons";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);

  const canPause = status === "RUNNING" || status === "APPROVED";
  const canResume = status === "PAUSED";
  const canCancel = !["COMPLETED", "CANCELLED"].includes(status);

  async function setStatus(next: CampaignStatus, message: string) {
    setBusy(true);
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    setConfirmCancel(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Couldn't update the campaign.");
      return;
    }
    toast.success(message);
    startTransition(() => router.refresh());
  }

  const menu = (
    <>
      <DropdownMenuItem asChild>
        <Link href={`/campaigns/${id}`}>
          <Eye />
          View campaign
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href={`/campaigns/${id}/edit`}>
          <Pencil />
          Edit campaign
        </Link>
      </DropdownMenuItem>
      {(canPause || canResume) && <DropdownMenuSeparator />}
      {canPause && (
        <DropdownMenuItem onSelect={() => setStatus("PAUSED", `${name} paused.`)}>
          <Pause />
          Pause campaign
        </DropdownMenuItem>
      )}
      {canResume && (
        <DropdownMenuItem onSelect={() => setStatus("RUNNING", `${name} resumed.`)}>
          <Play />
          Resume campaign
        </DropdownMenuItem>
      )}
      {canCancel && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setConfirmCancel(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Ban />
            Cancel campaign
          </DropdownMenuItem>
        </>
      )}
    </>
  );

  return (
    <>
      {variant === "menu" ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {menu}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/campaigns/${id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
          {canPause && (
            <Button
              variant="outline"
              size="sm"
              loading={busy || pending}
              onClick={() => setStatus("PAUSED", `${name} paused.`)}
            >
              <Pause />
              Pause
            </Button>
          )}
          {canResume && (
            <Button
              variant="outline"
              size="sm"
              loading={busy || pending}
              onClick={() => setStatus("RUNNING", `${name} resumed.`)}
            >
              <Play />
              Resume
            </Button>
          )}
          {canCancel && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}>
              <Ban />
              Cancel
            </Button>
          )}
        </div>
      )}

      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this campaign?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{name}</span> will stop accepting new
              clips. Delivered views stay on your reporting, and this can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              Keep it running
            </Button>
            <Button
              variant="destructive"
              loading={busy}
              onClick={() => setStatus("CANCELLED", `${name} cancelled.`)}
            >
              Cancel campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
