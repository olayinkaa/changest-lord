-- CreateEnum
CREATE TYPE "VirtualAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "bonusBalance" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "virtual_deposit_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "VirtualAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_deposit_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "virtual_deposit_accounts_userId_key" ON "virtual_deposit_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_deposit_accounts_accountNumber_key" ON "virtual_deposit_accounts"("accountNumber");

-- AddForeignKey
ALTER TABLE "virtual_deposit_accounts" ADD CONSTRAINT "virtual_deposit_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
