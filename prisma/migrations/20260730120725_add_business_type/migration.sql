-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('customer', 'seller');

-- CreateTable
CREATE TABLE "business_types" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_types_userId_key" ON "business_types"("userId");

-- AddForeignKey
ALTER TABLE "business_types" ADD CONSTRAINT "business_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
