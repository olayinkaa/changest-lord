-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TRANSFER_MYCHANGE', 'TRANSFER_BANK', 'GIVE_CHANGE');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('USER', 'SYSTEM_FEE', 'TRANSIT', 'SETTLEMENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledgers" (
    "id" TEXT NOT NULL,
    "ledgerTransactionId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "LedgerType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "WalletType" NOT NULL DEFAULT 'USER',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_reference_key" ON "ledger_transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- AddForeignKey
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
