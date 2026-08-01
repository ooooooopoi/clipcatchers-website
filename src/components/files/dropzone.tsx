"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

export type UploadedFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  url: string;
};

export function Dropzone({
  onUploaded,
  campaignId,
  ticketId,
  kind,
  accept,
  multiple = true,
  compact = false,
  hint,
}: {
  onUploaded?: (file: UploadedFile) => void;
  campaignId?: string;
  ticketId?: string;
  kind?: "LOGO" | "BRAND_KIT";
  accept?: string;
  multiple?: boolean;
  compact?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;

      for (const file of list) {
        setUploading((prev) => [...prev, file.name]);
        const form = new FormData();
        form.append("file", file);
        if (campaignId) form.append("campaignId", campaignId);
        if (ticketId) form.append("ticketId", ticketId);
        if (kind) form.append("kind", kind);

        try {
          const res = await fetch("/api/upload", { method: "POST", body: form });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error ?? `Couldn't upload ${file.name}`);
          } else {
            onUploaded?.(data.file);
            toast.success(`${file.name} uploaded`);
          }
        } catch {
          toast.error(`Couldn't upload ${file.name}`);
        } finally {
          setUploading((prev) => prev.filter((n) => n !== file.name));
        }
      }
    },
    [campaignId, ticketId, kind, onUploaded],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "px-4 py-6" : "px-6 py-12",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border/80 bg-card/40 hover:border-border hover:bg-accent/30",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-full border border-border bg-background/60",
            compact ? "h-9 w-9" : "h-11 w-11",
          )}
        >
          <FileUp className={cn("text-muted-foreground", compact ? "h-4 w-4" : "h-5 w-5")} />
        </span>
        <p className={cn("font-medium", compact ? "mt-2.5 text-sm" : "mt-4")}>
          Drop files here or <span className="text-primary">browse</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hint ?? "Images, video, PDFs and ZIPs up to 50MB"}
        </p>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={accept}
          onChange={(e) => {
            if (e.target.files) void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {uploading.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploading.map((name) => (
            <li
              key={name}
              className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-2 text-sm"
            >
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              <span className="truncate">{name}</span>
              <span className="ml-auto text-xs text-muted-foreground">uploading…</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UploadedList({
  files,
  onRemove,
}: {
  files: UploadedFile[];
  onRemove?: (id: string) => void;
}) {
  if (!files.length) return null;

  return (
    <ul className="mt-3 space-y-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2"
        >
          {file.mimeType.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt="" className="h-8 w-8 rounded border border-border object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-[10px] font-medium uppercase text-muted-foreground">
              {file.name.split(".").pop()?.slice(0, 4)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{file.name}</span>
            <span className="block text-xs text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
          </span>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onRemove(file.id)}
              aria-label={`Remove ${file.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
