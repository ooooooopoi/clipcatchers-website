import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Megaphone, PlusCircle } from "lucide-react";
import type { CampaignStatus, Prisma } from "@prisma/client";
import { PageHeader } from "@/components/page-header";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignFilters } from "@/components/campaigns/campaign-filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;
const STATUSES: CampaignStatus[] = [
  "PENDING",
  "APPROVED",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1));
  const status = params.status as CampaignStatus | undefined;
  const query = params.query?.trim();

  const where: Prisma.CampaignWhereInput = {
    userId: user.id,
    ...(status && STATUSES.includes(status) ? { status } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { brandName: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [campaigns, total, allCount] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.campaign.count({ where }),
    prisma.campaign.count({ where: { userId: user.id } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description={`${allCount} campaign${allCount === 1 ? "" : "s"} in your workspace.`}
      >
        <Button asChild>
          <Link href="/campaigns/new">
            <PlusCircle />
            New campaign
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<Skeleton className="h-9 w-full" />}>
        <CampaignFilters />
      </Suspense>

      <div className="mt-6">
        {campaigns.length === 0 ? (
          allCount === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              description="Create your first campaign and we'll get clips live within 48 hours of approval."
              action={
                <Button asChild>
                  <Link href="/campaigns/new">
                    <PlusCircle />
                    Create campaign
                  </Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No matches"
              description="No campaigns match these filters. Try a different search or status."
              action={
                <Button asChild variant="outline">
                  <Link href="/campaigns">Clear filters</Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {campaigns.map((campaign, index) => (
                <CampaignCard key={campaign.id} campaign={campaign} index={index} />
              ))}
            </div>
            <Suspense>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
