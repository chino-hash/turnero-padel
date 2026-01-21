/* eslint-disable no-console */
/**
 * Fix programático para agregar `tenantId` a la tabla "Venta" en la DB actual.
 *
 * Útil cuando el proyecto corre con `.env.local` (Next) pero Prisma CLI usa `.env`.
 *
 * Ejecutar:
 *   node scripts/fix-venta-tenantid.js
 */

const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['error'],
})

async function main() {
  const [{ venta_exists }] = await prisma.$queryRaw`
    SELECT to_regclass('public."Venta"')::text AS venta_exists
  `

  if (!venta_exists) {
    throw new Error('No existe la tabla public."Venta". No hay nada para migrar.')
  }

  const defaultTenant = await prisma.$queryRaw`
    SELECT id
    FROM "Tenant"
    ORDER BY "createdAt" ASC, id ASC
    LIMIT 1
  `

  if (!defaultTenant || defaultTenant.length === 0) {
    throw new Error('No hay registros en "Tenant". Creá un tenant antes de migrar "Venta".')
  }

  const defaultTenantId = defaultTenant[0].id

  console.log('Aplicando fix de tenantId en "Venta"...')

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`ALTER TABLE "Venta" ADD COLUMN IF NOT EXISTS "tenantId" TEXT`

    await tx.$executeRaw`
      UPDATE "Venta"
      SET "tenantId" = ${defaultTenantId}
      WHERE "tenantId" IS NULL
    `

    await tx.$executeRaw`ALTER TABLE "Venta" ALTER COLUMN "tenantId" SET NOT NULL`

    const fkExists = await tx.$queryRaw`
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'Venta_tenantId_fkey'
      LIMIT 1
    `

    if (!fkExists || fkExists.length === 0) {
      await tx.$executeRaw`
        ALTER TABLE "Venta"
        ADD CONSTRAINT "Venta_tenantId_fkey"
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
      `
    }

    await tx.$executeRaw`CREATE INDEX IF NOT EXISTS "Venta_tenantId_idx" ON "Venta" ("tenantId")`
    await tx.$executeRaw`CREATE INDEX IF NOT EXISTS "Venta_tenantId_createdAt_idx" ON "Venta" ("tenantId", "createdAt")`
  })

  console.log('✅ Listo. La tabla "Venta" ya tiene tenantId.')
}

main()
  .catch((err) => {
    console.error('❌ Error aplicando fix:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

