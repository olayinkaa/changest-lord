/*
  Warnings:

  - You are about to drop the column `livenessPublicId` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('PHONE', 'EMAIL', 'RESET_PASSWORD', 'RESET_PIN');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "livenessPublicId",
ADD COLUMN     "livenessImagePublicId" TEXT;

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "otpType" "OtpType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);
