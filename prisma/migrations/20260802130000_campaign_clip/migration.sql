-- CreateTable
CREATE TABLE "CampaignClip" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignClip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignClip_campaignId_views_idx" ON "CampaignClip"("campaignId", "views");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignClip_campaignId_externalId_key" ON "CampaignClip"("campaignId", "externalId");

-- AddForeignKey
ALTER TABLE "CampaignClip" ADD CONSTRAINT "CampaignClip_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
