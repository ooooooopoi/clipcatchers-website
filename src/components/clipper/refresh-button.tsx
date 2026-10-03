"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Loads the page's data again, for something that failed for a moment: the
 * bot unreachable, or a link it couldn't make. Pressing this beats being told
 * to wait and reload, or to go and run a command in Discord.
 */
export function RefreshButton({ label = "Try again" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {!pending && <RotateCw className="mr-1.5 h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
