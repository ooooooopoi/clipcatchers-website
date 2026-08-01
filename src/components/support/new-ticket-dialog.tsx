"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const PRIORITIES = [
  { value: "LOW", label: "Low — general question" },
  { value: "NORMAL", label: "Normal — needs a look" },
  { value: "HIGH", label: "High — blocking a campaign" },
  { value: "URGENT", label: "Urgent — something is broken" },
];

export function NewTicketDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function submit() {
    const next: Record<string, string> = {};
    if (subject.trim().length < 3) next.subject = "Give your ticket a subject";
    if (message.trim().length < 10) next.message = "Add a little more detail (10+ characters)";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        message,
        priority,
        fileIds: files.map((f) => f.id),
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error ?? "Couldn't create the ticket.");
      return;
    }

    toast.success("Ticket created — we'll be in touch shortly");
    setOpen(false);
    setSubject("");
    setMessage("");
    setPriority("NORMAL");
    setFiles([]);
    router.push(`/support/${data.ticket.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Open a support ticket</DialogTitle>
          <DialogDescription>
            Tell us what&apos;s going on and we&apos;ll reply within one business day.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Views aren't updating on my campaign"
            />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include campaign names, dates and anything you've already tried…"
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <Dropzone
              compact
              hint="Screenshots or exports help us move faster"
              onUploaded={(file) => setFiles((prev) => [...prev, file])}
            />
            <UploadedList
              files={files}
              onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
