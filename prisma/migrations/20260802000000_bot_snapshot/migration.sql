-- CreateTable
CREATE TABLE "BotSnapshot" (
    "id" TEXT NOT NULL DEFAULT 'latest',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSnapshot_pkey" PRIMARY KEY ("id")
);
