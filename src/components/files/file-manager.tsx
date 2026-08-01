"use client";

import { useEffect, useState } from "react";
import { Download, FileArchive, FileText, Film, Image as ImageIcon, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dropzone } from "@/components/files/dropzone";
import { useDebounce } from "@/hooks/use-debounce";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type FileRow = {
  id: string;
  name: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  url: string;
  campaign: { id: string; name: string } | null;
};

const KINDS = [
  { value: "", label: "All" },
  { value: "LOGO", label: "Logos" },
  { value: "BRAND_KIT", label: "Brand kits" },
  { value: "VIDEO", label: "Video" },
  { value: "IMAGE", label: "Images" },
  { value: "PDF", label: "PDFs" },
  { value: "ARCHIVE", label: "ZIPs" },
];

function iconFor(file: FileRow) {
  if (file.mimeType.startsWith("video/")) return Film;
  if (file.mimeType.startsWith("image/")) return ImageIcon;
  if (file.mimeType === "application/pdf") return FileText;
  if (file.kind === "ARCHIVE") return FileArchive;
  return FileText;
}

export function FileManager() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const debounced = useDebounce(query, 300);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (debounced) params.set("query", debounced);
    const res = await fetch(`/api/files?${params.toString()}`);
    const data = await res.json().catch(() => ({ files: [] }));
    setFiles(data.files ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, debounced]);

  async function remove(id: string, name: string) {
    setDeleting(id);
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      toast.error("Couldn't delete that file.");
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success(`${name} deleted`);
  }

  return (
    <div className="space-y-6">
      <Dropzone onUploaded={() => void load()} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((option) => (
            <button
              key={option.value}
              onClick={() => setKind(option.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                kind === option.value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={query || kind ? "No matching files" : "No files yet"}
          description={
            query || kind
              ? "Try a different search or filter."
              : "Drop logos, brand kits, footage or PDFs above — they'll be available to attach to any campaign."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const Icon = iconFor(file);
            return (
              <Card key={file.id} className="group overflow-hidden">
                <div className="flex h-28 items-center justify-center border-b border-border bg-background/40">
                  {file.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatBytes(file.sizeBytes)} · {formatDate(file.createdAt)}
                  </p>
                  {file.campaign && (
                    <p className="mt-1 truncate text-xs text-primary">{file.campaign.name}</p>
                  )}
                  <div className="mt-3 flex items-center gap-1">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href={`${file.url}?download=1`}>
                        <Download />
                        Download
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      loading={deleting === file.id}
                      onClick={() => remove(file.id, file.name)}
                      aria-label={`Delete ${file.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
