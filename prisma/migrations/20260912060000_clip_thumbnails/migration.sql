-- Resolved link + cached thumbnail for the public clips wall.
--
-- All four columns are nullable and carry no default, so this is additive:
-- existing rows are untouched and the ingest upsert, which names its columns
-- explicitly, keeps writing exactly what it wrote before.
ALTER TABLE "CampaignClip" ADD COLUMN "canonicalUrl" TEXT;
ALTER TABLE "CampaignClip" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "CampaignClip" ADD COLUMN "thumbnailAt" TIMESTAMP(3);
ALTER TABLE "CampaignClip" ADD COLUMN "resolveError" TEXT;

-- The wall's only query: highest views among clips that already have a
-- thumbnail. Without this it is a sort over every clip to return twelve.
CREATE INDEX "CampaignClip_thumbnailUrl_views_idx" ON "CampaignClip"("thumbnailUrl", "views");
