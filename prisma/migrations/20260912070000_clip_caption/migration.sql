-- The post's own caption, so the clips wall can keep itself to English posts.
-- Nullable and without a default: additive, and existing rows keep working
-- until the resolver backfills them.
ALTER TABLE "CampaignClip" ADD COLUMN "caption" TEXT;
