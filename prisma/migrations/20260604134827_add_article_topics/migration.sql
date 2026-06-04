-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];
