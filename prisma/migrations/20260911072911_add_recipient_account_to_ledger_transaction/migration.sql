-- AlterTable
ALTER TABLE "ledger_transactions" ADD COLUMN     "recipientAccount" TEXT;

-- CreateIndex
CREATE INDEX "ledger_transactions_recipientAccount_idx" ON "ledger_transactions"("recipientAccount");
