-- Discord sign-in for clippers.
--
-- CLIPPER is a third role rather than a flag on the client role: what a
-- clipper may see (their own clips and earnings) and what a client may see
-- (campaigns, invoices, spend) have nothing in common, and a boolean would
-- leave every guard in the app asking two questions instead of one.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CLIPPER';

-- The Discord snowflake. Nullable, because clients signing in with email or
-- Google will never have one, and unique so two rows can never claim the same
-- Discord account — that would be two people sharing one balance.
--
-- Text, not a number: a snowflake exceeds JSON's safe integer range, which
-- already corrupted every id in the bot's snapshot export once today.
ALTER TABLE "User" ADD COLUMN "discordId" TEXT;
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
