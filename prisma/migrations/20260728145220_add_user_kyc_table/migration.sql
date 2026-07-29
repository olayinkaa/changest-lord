-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'merchant');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'deleted', 'restricted', 'pending', 'banned');

-- CreateEnum
CREATE TYPE "MerchantType" AS ENUM ('individual', 'branch');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "middleName" TEXT,
    "isMarketer" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "businessCategory" TEXT,
    "businessName" TEXT,
    "address" TEXT,
    "nin" TEXT,
    "bvn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserKyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "livenessDone" BOOLEAN NOT NULL DEFAULT false,
    "completedProfile" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "ninVerified" BOOLEAN NOT NULL DEFAULT false,
    "locationVerified" BOOLEAN NOT NULL DEFAULT false,
    "whatsappVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdPin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserKyc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "UserKyc_userId_key" ON "UserKyc"("userId");

-- AddForeignKey
ALTER TABLE "UserKyc" ADD CONSTRAINT "UserKyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
