/* eslint-disable no-console */
/**
 * Inspecciona la tabla Venta/venta y sus columnas en la DB actual.
 *
 * Ejecutar:
 *   node scripts/inspect-venta.js
 */

const path = require('path')
const dotenv = require('dotenv')

// Cargar .env y luego .env.local (si existe) para sobreescribir en local
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['error'],
})

async function main() {
  const exists = await prisma.$queryRaw`
    SELECT
      to_regclass('public."Venta"')::text AS venta_camelcase,
      to_regclass('public.venta')::text   AS venta_lowercase
  `

  const columns = await prisma.$queryRaw`
    SELECT
      table_name,
      column_name,
      ordinal_position,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('Venta', 'venta')
    ORDER BY table_name, ordinal_position
  `

  console.log('Tabla(s) detectada(s):', exists)
  console.log('Columnas:', columns)
}

main()
  .catch((err) => {
    console.error('Error inspeccionando Venta:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

