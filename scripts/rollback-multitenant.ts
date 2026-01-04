/**
 * Script de Rollback para la Migración Multitenant
 * 
 * ⚠️ ADVERTENCIA: Este script revierte los cambios de la migración multitenant.
 * Esto incluye:
 * - Eliminar el campo tenantId de las tablas
 * - Eliminar la tabla Tenant
 * - Eliminar el rol SUPER_ADMIN del enum Role
 * - Restaurar constraints únicos anteriores
 * 
 * ⚠️ IMPORTANTE: Este script NO incluye restauración de datos desde backup.
 * Asegúrate de tener un backup antes de ejecutar este script.
 * 
 * Uso:
 *   npx tsx scripts/rollback-multitenant.ts [--dry-run] [--confirm]
 */

import { PrismaClient } from '@prisma/client'
import { prisma } from '../lib/database/neon-config'

const DRY_RUN = process.argv.includes('--dry-run')
const CONFIRMED = process.argv.includes('--confirm')

async function rollbackMultitenant() {
  console.log('🔄 Iniciando rollback de migración multitenant...\n')

  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN: No se realizarán cambios reales\n')
  }

  if (!DRY_RUN && !CONFIRMED) {
    console.log('❌ ERROR: Debes confirmar el rollback con --confirm')
    console.log('   Ejemplo: npx tsx scripts/rollback-multitenant.ts --confirm')
    console.log('\n⚠️  ADVERTENCIA: Este script eliminará:')
    console.log('   - La tabla Tenant y todos sus datos')
    console.log('   - El campo tenantId de todas las tablas')
    console.log('   - El rol SUPER_ADMIN del enum Role')
    console.log('   - Constraints y índices relacionados con multitenancy')
    console.log('\n💾 Asegúrate de tener un backup antes de continuar\n')
    process.exit(1)
  }

  try {
    console.log('📋 Plan de rollback:')
    console.log('   1. Eliminar relaciones y constraints')
    console.log('   2. Eliminar campos tenantId de las tablas')
    console.log('   3. Eliminar tabla Tenant')
    console.log('   4. Eliminar rol SUPER_ADMIN del enum (requiere recrear enum)')
    console.log('   5. Restaurar constraints únicos originales')
    console.log('')

    // Paso 1: Eliminar relaciones y constraints de foreign keys
    console.log('1️⃣  Eliminando foreign keys y constraints...')
    
    const dropFkQueries = [
      // Eliminar foreign keys de Tenant
      `ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey"`,
      `ALTER TABLE "Court" DROP CONSTRAINT IF EXISTS "Court_tenantId_fkey"`,
      `ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_tenantId_fkey"`,
      `ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_tenantId_fkey"`,
      `ALTER TABLE "SystemSetting" DROP CONSTRAINT IF EXISTS "SystemSetting_tenantId_fkey"`,
      `ALTER TABLE "Producto" DROP CONSTRAINT IF EXISTS "Producto_tenantId_fkey"`,
      `ALTER TABLE "RecurringBooking" DROP CONSTRAINT IF EXISTS "RecurringBooking_tenantId_fkey"`,
      `ALTER TABLE "AdminWhitelist" DROP CONSTRAINT IF EXISTS "AdminWhitelist_tenantId_fkey"`,
    ]

    for (const query of dropFkQueries) {
      if (DRY_RUN) {
        console.log(`   [DRY-RUN] ${query}`)
      } else {
        await prisma.$executeRawUnsafe(query)
        console.log(`   ✅ ${query.split(' ')[5].replace(/"/g, '')}`)
      }
    }

    // Paso 2: Eliminar índices relacionados con tenantId
    console.log('\n2️⃣  Eliminando índices relacionados con tenantId...')
    
    const dropIndexQueries = [
      `DROP INDEX IF EXISTS "User_tenantId_idx"`,
      `DROP INDEX IF EXISTS "User_email_tenantId_idx"`,
      `DROP INDEX IF EXISTS "Court_tenantId_idx"`,
      `DROP INDEX IF EXISTS "Court_tenantId_isActive_idx"`,
      `DROP INDEX IF EXISTS "Court_tenantId_name_idx"`,
      `DROP INDEX IF EXISTS "Booking_tenantId_idx"`,
      `DROP INDEX IF EXISTS "Booking_tenantId_courtId_bookingDate_idx"`,
      `DROP INDEX IF EXISTS "Booking_tenantId_userId_bookingDate_idx"`,
      `DROP INDEX IF EXISTS "Booking_tenantId_status_bookingDate_idx"`,
      `DROP INDEX IF EXISTS "Booking_tenantId_courtId_status_bookingDate_idx"`,
      `DROP INDEX IF EXISTS "Booking_tenantId_expiresAt_idx"`,
      `DROP INDEX IF EXISTS "Payment_tenantId_idx"`,
      `DROP INDEX IF EXISTS "Payment_tenantId_createdAt_idx"`,
      `DROP INDEX IF EXISTS "SystemSetting_tenantId_idx"`,
      `DROP INDEX IF EXISTS "SystemSetting_tenantId_key_idx"`,
      `DROP INDEX IF EXISTS "SystemSetting_tenantId_category_idx"`,
      `DROP INDEX IF EXISTS "Tenant_slug_idx"`,
      `DROP INDEX IF EXISTS "Tenant_isActive_idx"`,
      `DROP INDEX IF EXISTS "Tenant_mercadoPagoEnabled_idx"`,
    ]

    for (const query of dropIndexQueries) {
      if (DRY_RUN) {
        console.log(`   [DRY-RUN] ${query}`)
      } else {
        await prisma.$executeRawUnsafe(query)
        const indexName = query.match(/IF EXISTS "([^"]+)"/)?.[1] || 'index'
        console.log(`   ✅ ${indexName}`)
      }
    }

    // Paso 3: Eliminar campos tenantId (y constraints únicos relacionados)
    console.log('\n3️⃣  Eliminando campos tenantId de las tablas...')
    
    const dropColumnQueries = [
      `ALTER TABLE "User" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "Court" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "Booking" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "Payment" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "SystemSetting" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "Producto" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "RecurringBooking" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "RecurringBookingException" DROP COLUMN IF EXISTS "tenantId"`,
      `ALTER TABLE "AdminWhitelist" DROP COLUMN IF EXISTS "tenantId"`,
    ]

    // Eliminar constraints únicos que incluyen tenantId primero
    const dropUniqueConstraints = [
      `ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_tenantId_key"`,
      `ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_tenantId_courtId_bookingDate_startTime_endTime_key"`,
      `ALTER TABLE "SystemSetting" DROP CONSTRAINT IF EXISTS "SystemSetting_key_tenantId_key"`,
    ]

    for (const query of dropUniqueConstraints) {
      if (DRY_RUN) {
        console.log(`   [DRY-RUN] ${query}`)
      } else {
        await prisma.$executeRawUnsafe(query)
        const constraintName = query.match(/IF EXISTS "([^"]+)"/)?.[1] || 'constraint'
        console.log(`   ✅ Eliminado constraint: ${constraintName}`)
      }
    }

    for (const query of dropColumnQueries) {
      if (DRY_RUN) {
        console.log(`   [DRY-RUN] ${query}`)
      } else {
        await prisma.$executeRawUnsafe(query)
        const tableName = query.match(/TABLE "([^"]+)"/)?.[1] || 'table'
        console.log(`   ✅ ${tableName}`)
      }
    }

    // Paso 4: Eliminar tabla Tenant
    console.log('\n4️⃣  Eliminando tabla Tenant...')
    const dropTenantTable = `DROP TABLE IF EXISTS "Tenant" CASCADE`
    
    if (DRY_RUN) {
      console.log(`   [DRY-RUN] ${dropTenantTable}`)
    } else {
      await prisma.$executeRawUnsafe(dropTenantTable)
      console.log(`   ✅ Tabla Tenant eliminada`)
    }

    // Paso 5: Recrear enum Role sin SUPER_ADMIN
    console.log('\n5️⃣  Recreando enum Role sin SUPER_ADMIN...')
    console.log('   ⚠️  Este paso requiere recrear el enum completo')
    
    // Nota: PostgreSQL no permite eliminar valores de enum directamente
    // Necesitamos recrear el enum. Esto es complejo y requiere:
    // 1. Crear nuevo enum
    // 2. Alterar columnas para usar nuevo enum
    // 3. Eliminar enum viejo
    // 4. Renombrar nuevo enum
    
    const recreateRoleEnum = [
      // Crear nuevo enum
      `CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN')`,
      // Actualizar columnas
      `ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING "role"::text::"Role_new"`,
      `ALTER TABLE "AdminWhitelist" ALTER COLUMN "role" TYPE "Role_new" USING "role"::text::"Role_new"`,
      // Eliminar enum viejo
      `DROP TYPE IF EXISTS "Role"`,
      // Renombrar nuevo enum
      `ALTER TYPE "Role_new" RENAME TO "Role"`,
    ]

    for (const query of recreateRoleEnum) {
      if (DRY_RUN) {
        console.log(`   [DRY-RUN] ${query}`)
      } else {
        try {
          await prisma.$executeRawUnsafe(query)
          console.log(`   ✅ ${query.substring(0, 50)}...`)
        } catch (error: any) {
          // Si el enum ya no tiene SUPER_ADMIN, puede fallar silenciosamente
          if (error.message.includes('does not exist') || error.message.includes('already exists')) {
            console.log(`   ⚠️  ${query.substring(0, 50)}... (ya procesado o no necesario)`)
          } else {
            throw error
          }
        }
      }
    }

    // Paso 6: Restaurar constraints únicos originales (sin tenantId)
    console.log('\n6️⃣  Restaurando constraints únicos originales...')
    console.log('   ⚠️  NOTA: Los constraints únicos originales deben restaurarse manualmente')
    console.log('   según el schema que tenías antes de la migración multitenant.')
    console.log('   Este script no puede inferir los constraints originales automáticamente.')

    console.log('\n✅ Rollback completado exitosamente!')
    console.log('\n📝 Próximos pasos:')
    console.log('   1. Ejecutar: npx prisma generate')
    console.log('   2. Verificar que la aplicación funciona correctamente')
    console.log('   3. Si es necesario, restaurar datos desde backup')
    console.log('   4. Actualizar código para eliminar referencias a tenantId')
    console.log('')

  } catch (error) {
    console.error('\n❌ Error durante el rollback:', error)
    console.error('\n⚠️  El rollback puede haber dejado la base de datos en estado inconsistente.')
    console.error('   Se recomienda restaurar desde backup.')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar rollback
rollbackMultitenant()
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
  })

