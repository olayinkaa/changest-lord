/*
  Warnings:

  - A unique constraint covering the columns `[nin]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bvn]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "bvn_caches" (
    "id" TEXT NOT NULL,
    "bvn" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "dob" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bvn_caches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bvn_caches_bvn_key" ON "bvn_caches"("bvn");

-- CreateIndex
CREATE UNIQUE INDEX "users_nin_key" ON "users"("nin");

-- CreateIndex
CREATE UNIQUE INDEX "users_bvn_key" ON "users"("bvn");
