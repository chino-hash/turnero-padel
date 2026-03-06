-- CreateTable
CREATE TABLE "public"."Consumible" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Consumible_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Consumible" ADD CONSTRAINT "Consumible_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Consumible_tenantId_idx" ON "public"."Consumible"("tenantId");

-- CreateIndex
CREATE INDEX "Consumible_tenantId_isActive_idx" ON "public"."Consumible"("tenantId", "isActive");
