import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { createReadStream, existsSync } from "fs";
import path from "path";
import type { FileKind } from "@prisma/client";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB ?? 50) * 1024 * 1024;

export const ACCEPTED_MIME = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
];

export function kindFor(mime: string, filename: string): FileKind {
  const ext = path.extname(filename).toLowerCase();
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime === "application/pdf") return "PDF";
  if (ext === ".zip" || mime.includes("zip")) return "ARCHIVE";
  if (mime.startsWith("image/")) return "IMAGE";
  return "OTHER";
}

/** Writes the upload to disk and returns the storage key (never a raw path). */
export async function saveUpload(file: File): Promise<{ key: string; size: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File is larger than ${process.env.MAX_UPLOAD_MB ?? 50}MB`);
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).slice(0, 12);
  const key = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
  return { key, size: buffer.byteLength };
}

export function uploadPath(key: string) {
  // Strip any traversal attempt — keys are generated, but never trust them.
  return path.join(UPLOAD_DIR, path.basename(key));
}

export function uploadExists(key: string) {
  return existsSync(uploadPath(key));
}

export function readUpload(key: string) {
  return createReadStream(uploadPath(key));
}

export async function deleteUpload(key: string) {
  try {
    await unlink(uploadPath(key));
  } catch {
    // Already gone — deleting the DB row is what matters.
  }
}
