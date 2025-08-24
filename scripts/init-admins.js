/**
 * Script para inicializar administradores en la base de datos
 * 
 * Este script:
 * 1. Crea la base de datos si no existe
 * 2. Ejecuta las migraciones de Prisma
 * 3. Inicializa administradores desde variables de entorno
 * 4. Crea datos de ejemplo para desarrollo
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function initializeAdmins() {
  try {
    console.log('🚀 Inicializando sistema de administradores...')

    // 1. Obtener administradores desde variable de entorno
    const envAdmins = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
    
    if (envAdmins.length === 0) {
      console.log('⚠️  No se encontraron administradores en ADMIN_EMAILS')
      console.log('   Agregando administrador por defecto: admin@turnero.com')
      envAdmins.push('admin@turnero.com')
    }

    // 2. Agregar administradores a la base de datos (como respaldo)
    for (const email of envAdmins) {
      if (!email || email.length === 0) continue

      try {
        await prisma.adminWhitelist.upsert({
          where: { email: email.toLowerCase() },
          update: { 
            isActive: true,
            notes: 'Administrador principal (desde env)',
            updatedAt: new Date()
          },
          create: {
            email: email.toLowerCase(),
            isActive: true,
            addedBy: 'system',
            notes: 'Administrador principal (desde env)'
          }
        })
        
        console.log(`✅ Administrador configurado: ${email}`)
      } catch (error) {
        console.error(`❌ Error configurando ${email}:`, error.message)
      }
    }

    // 3. Crear canchas de ejemplo si no existen
    const courtCount = await prisma.court.count()
    if (courtCount === 0) {
      console.log('🏟️ Creando canchas de ejemplo...')
      
      await prisma.court.createMany({
        data: [
          {
            name: 'Cancha 1',
            description: 'Cancha principal con iluminación LED',
            basePrice: 600000, // $6000 en centavos
            features: ['Iluminación LED', 'Césped sintético', 'Vestuarios'],
            isActive: true
          },
          {
            name: 'Cancha 2', 
            description: 'Cancha secundaria',
            basePrice: 500000, // $5000 en centavos
            features: ['Césped sintético', 'Vestuarios'],
            isActive: true
          }
        ]
      })
      
      console.log('✅ Canchas de ejemplo creadas')
    }

    // 4. Crear configuraciones del sistema
    const settingsCount = await prisma.systemSetting.count()
    if (settingsCount === 0) {
      console.log('⚙️ Creando configuraciones del sistema...')
      
      await prisma.systemSetting.createMany({
        data: [
          {
            key: 'booking_advance_days',
            value: '30',
            description: 'Días de anticipación máxima para reservas',
            category: 'booking',
            isPublic: true
          },
          {
            key: 'default_slot_duration',
            value: '90',
            description: 'Duración por defecto de slots en minutos',
            category: 'booking',
            isPublic: true
          },
          {
            key: 'deposit_percentage',
            value: '50',
            description: 'Porcentaje de depósito requerido',
            category: 'payment',
            isPublic: true
          },
          {
            key: 'app_name',
            value: 'Turnero de Padel',
            description: 'Nombre de la aplicación',
            category: 'general',
            isPublic: true
          }
        ]
      })
      
      console.log('✅ Configuraciones del sistema creadas')
    }

    console.log('🎉 Inicialización completada exitosamente!')
    console.log('')
    console.log('📋 Resumen:')
    console.log(`   👑 Administradores: ${envAdmins.join(', ')}`)
    console.log(`   🏟️ Canchas: ${await prisma.court.count()}`)
    console.log(`   ⚙️ Configuraciones: ${await prisma.systemSetting.count()}`)
    console.log('')
    console.log('🔐 Los administradores pueden:')
    console.log('   - Acceder al panel de administración')
    console.log('   - Gestionar reservas y pagos')
    console.log('   - Agregar/remover otros administradores')
    console.log('   - Configurar el sistema')

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  initializeAdmins()
}

module.exports = { initializeAdmins }
