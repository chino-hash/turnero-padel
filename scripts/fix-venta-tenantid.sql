-- Fix: agregar columna tenantId a la tabla public."Venta"
-- Motivo: el sistema de ventas original (single-tenant) creó "Venta" sin tenantId,
-- pero el schema actual (`prisma/schema.prisma`) requiere `Venta.tenantId`.
--
-- Ejecutar con:
--   npx prisma db execute --schema prisma/schema.prisma --file scripts/fix-venta-tenantid.sql
--
-- Nota: si existen ventas antiguas, se asignan al tenant más viejo (por createdAt).

DO $$
BEGIN
  IF to_regclass('public."Venta"') IS NULL THEN
    RAISE EXCEPTION 'La tabla public."Venta" no existe. No hay nada para migrar.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "Tenant") THEN
    RAISE EXCEPTION 'No hay registros en "Tenant". Creá al menos un tenant antes de migrar "Venta".';
  END IF;
END $$;

-- 1) Agregar columna (si no existe)
ALTER TABLE "Venta"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- 2) Backfill para filas existentes (si las hubiera)
UPDATE "Venta"
SET "tenantId" = (
  SELECT id
  FROM "Tenant"
  ORDER BY "createdAt" ASC, id ASC
  LIMIT 1
)
WHERE "tenantId" IS NULL;

-- 3) Enforce NOT NULL (alineado con Prisma schema)
ALTER TABLE "Venta"
  ALTER COLUMN "tenantId" SET NOT NULL;

-- 4) FK (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Venta_tenantId_fkey'
  ) THEN
    ALTER TABLE "Venta"
      ADD CONSTRAINT "Venta_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 5) Índices recomendados por el schema (si no existen)
CREATE INDEX IF NOT EXISTS "Venta_tenantId_idx" ON "Venta" ("tenantId");
CREATE INDEX IF NOT EXISTS "Venta_tenantId_createdAt_idx" ON "Venta" ("tenantId", "createdAt");

