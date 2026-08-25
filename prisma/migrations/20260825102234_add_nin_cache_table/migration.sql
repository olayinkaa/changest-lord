-- CreateTable
CREATE TABLE "nin_caches" (
    "id" TEXT NOT NULL,
    "nin" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "dob" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nin_caches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nin_caches_nin_key" ON "nin_caches"("nin");
