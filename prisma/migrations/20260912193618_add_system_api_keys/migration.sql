-- CreateTable
CREATE TABLE "system_api_keys" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_api_keys_clientName_key" ON "system_api_keys"("clientName");

-- CreateIndex
CREATE UNIQUE INDEX "system_api_keys_keyHash_key" ON "system_api_keys"("keyHash");
