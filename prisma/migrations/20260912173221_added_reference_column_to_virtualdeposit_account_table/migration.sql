/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `virtual_deposit_accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reference` to the `virtual_deposit_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Actor" AS ENUM ('USER', 'MERCHANT', 'SEEDER');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CASHBACK', 'CHARGE', 'COMMISSION');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('FACE_PAYMENT', 'COLLECT', 'JAMB', 'TRANSFER', 'AIRTIME', 'INTERNET', 'WITHDRAW', 'STAMP_DUTY', 'DEPOSIT');

-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "virtual_deposit_accounts" ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "transaction_rates" (
    "id" TEXT NOT NULL,
    "actor" "Actor" NOT NULL,
    "action" "ActionType" NOT NULL,
    "txType" "TxType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "type" "RateType" NOT NULL,
    "cap" DOUBLE PRECISION,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transaction_rates_actor_action_txType_key" ON "transaction_rates"("actor", "action", "txType");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_deposit_accounts_reference_key" ON "virtual_deposit_accounts"("reference");
