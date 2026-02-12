/**
 * Script para agregar un email como superadmin en la base de datos (AdminWhitelist).
 * Uso: node scripts/add-superadmin.js [email]
 * Ejemplo: node scripts/add-superadmin.js gualdafotografia22@gmail.com
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true })

const prisma = new PrismaClient()

const SUPERADMIN_EMAIL = process.argv[2] || 'gualdafotografia22@gmail.com'

async function addSuperAdmin() {
  const normalizedEmail = SUPERADMIN_EMAIL.toLowerCase().trim()

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    console.error('❌ Proporciona un email válido. Uso: node scripts/add-superadmin.js email@ejemplo.com')
    process.exit(1)
  }

  try {
    console.log(`Agregando superadmin: ${normalizedEmail}`)

    const existing = await prisma.adminWhitelist.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: null,
      },
    })

    if (existing) {
      if (existing.isActive && existing.role === 'SUPER_ADMIN') {
        console.log('✅ El email ya está registrado como superadmin activo.')
        return
      }
      await prisma.adminWhitelist.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          role: 'SUPER_ADMIN',
          addedBy: existing.addedBy || 'system',
          notes: existing.notes || 'Superadmin reactivado',
          updatedAt: new Date(),
        },
      })
      console.log('✅ Superadmin reactivado y rol actualizado.')
      return
    }

    await prisma.adminWhitelist.create({
      data: {
        email: normalizedEmail,
        tenantId: null,
        role: 'SUPER_ADMIN',
        isActive: true,
        addedBy: 'system',
        notes: 'Superadmin agregado por script',
      },
    })

    console.log('✅ Superadmin agregado correctamente en la base de datos.')
    console.log(`   Email: ${normalizedEmail}`)
    console.log('   Rol: SUPER_ADMIN')
  } catch (error) {
    console.error('❌ Error al agregar superadmin:', error.message)
    if (error.code === 'P2002') {
      console.error('   (El email ya existe con otro tenantId; para superadmin debe ser tenantId null.)')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addSuperAdmin()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
