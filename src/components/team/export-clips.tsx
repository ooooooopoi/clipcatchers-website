"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExplorerClip } from "@/components/team/clips-explorer";

/**
 * The per-clip report, as a file.
 *
 * The site sells "full per-clip report, exportable" and there was no export —
 * a client who wanted these numbers in a deck or a finance system had to
 * screenshot the page. Which is both embarrassing and the exact thing that
 * makes a serious buyer doubt the rest of it.
 *
 * Built entirely client-side. The rows are already loaded to draw the table,
 * so a round trip would add latency and a route that would need its own
 * signature check to avoid becoming a way to read any campaign's clips.
 */
function csvCell(value: string | number): string {
  const text = String(value ?? "");
  // Quote anything containing a delimiter, a quote or a newline, and double
  // any quote inside. A creator handle with a comma in it would otherwise
  // shift every column after it by one.
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ExportClips({
  clips,
  campaignName,
}: {
  clips: ExplorerClip[];
  campaignName: string;
}) {
  const [done, setDone] = useState(false);

  function download() {
    const header = ["Creator", "Platform", "Views", "First seen", "URL"];
    const rows = clips.map((clip) => [
      clip.handle ? `@${clip.handle}` : "",
      clip.platform,
      clip.views,
      clip.createdAt.slice(0, 10),
      clip.url,
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    // The BOM is what stops Excel reading a UTF-8 file as Latin-1 and turning
    // every non-ASCII handle into mojibake on open.
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${campaignName.replace(/[^\w-]+/g, "-").toLowerCase()}-clips.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={clips.length === 0}>
      {done ? <Check /> : <Download />}
      {done ? "Downloaded" : "Export CSV"}
    </Button>
  );
}
