import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { FileManager } from "@/components/files/file-manager";
import { requireUser } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Files" };

export default async function FilesPage() {
  await requireUser();

  return (
    <div>
      <PageHeader
        title="Files"
        description="Logos, brand kits, footage and documents shared with our team."
      />
      <FileManager />
    </div>
  );
}
