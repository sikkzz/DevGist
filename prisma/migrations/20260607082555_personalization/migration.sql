-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "personalScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "personalTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articles_personalScore_idx" ON "articles"("personalScore");
