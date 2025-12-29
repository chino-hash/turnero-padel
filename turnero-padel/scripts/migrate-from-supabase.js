/**
 * Script para migrar datos de Supabase a PostgreSQL con Prisma
 * 
 * IMPORTANTE: Este script es opcional y solo necesario si tienes datos existentes en Supabase
 * 
 * Pasos:
 * 1. Exportar datos de Supabase
 * 2. Transformar estructura de datos
 * 3. Importar a nueva base de datos con Prisma
 */

const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')

const prisma = new PrismaClient()

// Configuración de Supabase (temporal para migración)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateData() {
  try {
    console.log('🚀 Iniciando migración de datos...')

    // 1. Migrar perfiles de usuarios
    console.log('📊 Migrando perfiles...')
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')

    for (const profile of profiles || []) {
      await prisma.user.upsert({
        where: { email: profile.email || `user-${profile.id}@temp.com` },
        update: {
          name: profile.full_name,
          role: profile.role?.toUpperCase() || 'USER',
          phone: profile.phone,
          isActive: profile.is_active ?? true,
          lastLogin: profile.last_login ? new Date(profile.last_login) : null,
          preferences: profile.preferences || {},
        },
        create: {
          id: profile.id,
          email: profile.email || `user-${profile.id}@temp.com`,
          name: profile.full_name,
          role: profile.role?.toUpperCase() || 'USER',
          phone: profile.phone,
          isActive: profile.is_active ?? true,
          lastLogin: profile.last_login ? new Date(profile.last_login) : null,
          preferences: profile.preferences || {},
        }
      })
    }

    // 2. Migrar canchas
    console.log('🏟️ Migrando canchas...')
    const { data: courts } = await supabase
      .from('courts')
      .select('*')

    for (const court of courts || []) {
      await prisma.court.create({
        data: {
          id: court.id,
          name: court.name,
          description: court.description,
          basePrice: court.base_price,
          priceMultiplier: court.price_multiplier || 1.0,
          features: court.features || [],
          isActive: court.is_active ?? true,
          operatingHours: court.operating_hours || {
            start: "00:00",
            end: "23:00",
            slot_duration: 90
          },
          createdAt: new Date(court.created_at),
          updatedAt: new Date(court.updated_at),
        }
      })
    }

    // 3. Migrar reservas
    console.log('📅 Migrando reservas...')
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')

    for (const booking of bookings || []) {
      await prisma.booking.create({
        data: {
          id: booking.id,
          courtId: booking.court_id,
          userId: booking.user_id,
          bookingDate: new Date(booking.booking_date),
          startTime: booking.start_time,
          endTime: booking.end_time,
          durationMinutes: booking.duration_minutes || 90,
          totalPrice: booking.total_price,
          depositAmount: booking.deposit_amount || 0,
          status: booking.status?.toUpperCase() || 'PENDING',
          paymentStatus: booking.payment_status?.toUpperCase().replace('_', '_') || 'PENDING',
          paymentMethod: booking.payment_method?.toUpperCase().replace('_', '_'),
          notes: booking.notes,
          cancelledAt: booking.cancelled_at ? new Date(booking.cancelled_at) : null,
          cancellationReason: booking.cancellation_reason,
          createdAt: new Date(booking.created_at),
          updatedAt: new Date(booking.updated_at),
        }
      })
    }

    console.log('✅ Migración completada exitosamente!')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  migrateData()
}

module.exports = { migrateData }
