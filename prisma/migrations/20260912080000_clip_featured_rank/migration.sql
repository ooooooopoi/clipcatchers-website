-- Hand-picked position on the homepage clips belt. Null means not picked, so
-- this is additive and the belt keeps its views ordering until a rank is set.
ALTER TABLE "CampaignClip" ADD COLUMN "featuredRank" INTEGER;

-- The belt's query when curation is in use: the few ranked rows, in order.
-- Partial, because the overwhelming majority of rows will never be ranked and
-- there is no reason to carry them in the index.
CREATE INDEX "CampaignClip_featuredRank_idx"
  ON "CampaignClip"("featuredRank")
  WHERE "featuredRank" IS NOT NULL;
