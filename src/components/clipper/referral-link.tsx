"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * A clipper's personal invite link, with Copy, and Share where the device has
 * a share sheet.
 *
 * Share is decided after mount, for the same reason as Paste in the submit
 * form: the server has no navigator, so an inline check would render
 * differently on the server and the client. Most desktop browsers don't have
 * one, and a button that does nothing is worse than no button.
 */
/** Copy through a hidden text box: execCommand, for browsers that refuse the clipboard API. */
function legacyCopy(text: string) {
  const box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  document.body.appendChild(box);
  box.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  box.remove();
  return ok;
}

export function ReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const reset = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(reset);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    } catch {
      // In-app browsers (Discord's among them) often deny the clipboard API.
      // The older copy command usually still works there.
    }
    if (legacyCopy(url)) {
      setCopied(true);
    } else {
      // The link is on screen and selectable, so say that rather than fail quietly.
      toast.error("Couldn't copy. Select the link and copy it instead.");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: "Join Clip Catchers", url });
    } catch {
      // Closing the share sheet rejects too. Nothing to report.
    }
  }

  return (
    <div className="mt-4">
      {/* Smaller on a phone so a whole discord.gg link fits on one line. */}
      <p className="select-all break-all rounded-2xl border border-border bg-background px-3.5 py-3.5 font-mono text-sm text-foreground sm:px-4 sm:text-base">
        {url}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy link"}
        </button>
        {canShare ? (
          <button
            type="button"
            onClick={share}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share
          </button>
        ) : null}
      </div>
    </div>
  );
}
