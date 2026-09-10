-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'PARTIAL_SUCCESS', 'REVERSED');

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'SETTLEMENT_SWEEP';

-- AlterTable
ALTER TABLE "ledger_transactions" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';
