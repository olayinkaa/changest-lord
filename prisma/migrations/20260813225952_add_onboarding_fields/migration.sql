/*
  Warnings:

  - You are about to drop the column `userId` on the `business_types` table. All the data in the column will be lost.
  - You are about to drop the column `businessCategory` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `UserKyc` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[type]` on the table `business_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId5]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[virtualAccountNo]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('PHONE_VALIDATED', 'PROFILE_COMPLETED', 'LIVENESS_PASSED', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "UserKyc" DROP CONSTRAINT "UserKyc_userId_fkey";

-- DropForeignKey
ALTER TABLE "business_types" DROP CONSTRAINT "business_types_userId_fkey";

-- DropIndex
DROP INDEX "business_types_userId_key";

-- AlterTable
ALTER TABLE "business_types" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "businessCategory",
DROP COLUMN "role",
ADD COLUMN     "businessLocation" TEXT,
ADD COLUMN     "businessTypeId" TEXT,
ADD COLUMN     "deviceBindingId" TEXT,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "livenessImageUrl" TEXT,
ADD COLUMN     "livenessPublicId" TEXT,
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'PHONE_VALIDATED',
ADD COLUMN     "pinHash" TEXT,
ADD COLUMN     "userId5" TEXT,
ADD COLUMN     "userType" "UserType",
ADD COLUMN     "virtualAccountNo" TEXT;

-- DropTable
DROP TABLE "UserKyc";

-- CreateTable
CREATE TABLE "user_kycs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "livenessDone" BOOLEAN NOT NULL DEFAULT false,
    "completedProfile" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "ninVerified" BOOLEAN NOT NULL DEFAULT false,
    "locationVerified" BOOLEAN NOT NULL DEFAULT false,
    "whatsappVerified" BOOLEAN NOT NULL DEFAULT false,
    "pinCreated" BOOLEAN NOT NULL DEFAULT false,
    "isSmsVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_kycs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceToken" TEXT,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_kycs_userId_key" ON "user_kycs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_userId_key" ON "user_devices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_deviceId_key" ON "user_devices"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "business_types_type_key" ON "business_types"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_userId5_key" ON "users"("userId5");

-- CreateIndex
CREATE UNIQUE INDEX "users_virtualAccountNo_key" ON "users"("virtualAccountNo");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_businessTypeId_fkey" FOREIGN KEY ("businessTypeId") REFERENCES "business_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_kycs" ADD CONSTRAINT "user_kycs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
