/*
  Warnings:

  - A unique constraint covering the columns `[faceId]` on the table `user_kycs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_kycs" ADD COLUMN     "faceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_kycs_faceId_key" ON "user_kycs"("faceId");
