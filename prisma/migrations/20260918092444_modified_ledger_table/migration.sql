/*
  Warnings:

  - Added the required column `newBalance` to the `ledgers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousBalance` to the `ledgers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ledgers" ADD COLUMN     "newBalance" DECIMAL(18,2) NOT NULL,
ADD COLUMN     "previousBalance" DECIMAL(18,2) NOT NULL;
