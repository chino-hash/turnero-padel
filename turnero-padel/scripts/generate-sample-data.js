const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function generateSampleData() {
  try {
    console.log('🚀 Generando datos de ejemplo...')

    // Crear usuarios de ejemplo
    const users = []
    for (let i = 1; i <= 20; i++) {
      const user = await prisma.user.upsert({
        where: { email: `usuario${i}@example.com` },
        update: {},
        create: {
          name: `Usuario ${i}`,
          email: `usuario${i}@example.com`,
          fullName: `Usuario Completo ${i}`,
          role: 'USER',
          phone: `+54911${String(i).padStart(7, '0')}`,
          isActive: true,
          emailVerified: new Date(),
          lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Último login en los últimos 7 días
        }
      })
      users.push(user)
    }
    console.log(`✅ Creados ${users.length} usuarios`)

    // Crear canchas de ejemplo
    const courts = []
    for (let i = 1; i <= 4; i++) {
      const court = await prisma.court.create({
        data: {
          name: `Cancha ${i}`,
          description: `Cancha de pádel número ${i} con iluminación LED y césped sintético de alta calidad`,
          basePrice: 3000 + (i * 500), // Precios variables
          priceMultiplier: 1.0 + (i * 0.1),
          features: JSON.stringify({
            lighting: true,
            roof: i <= 2, // Solo las primeras 2 tienen techo
            heating: i === 1, // Solo la cancha 1 tiene calefacción
            sound_system: i <= 3,
            lockers: true
          }),
          isActive: true,
          operatingHours: JSON.stringify({
            start: '08:00',
            end: '23:00',
            slot_duration: 90
          })
        }
      })
      courts.push(court)
    }
    console.log(`✅ Creadas ${courts.length} canchas`)

    // Crear reservas de ejemplo para los últimos 30 días
    const bookings = []
    const today = new Date()
    const usedSlots = new Set() // Para evitar duplicados
    
    for (let day = 0; day < 30; day++) {
      const date = new Date(today)
      date.setDate(date.getDate() - day)
      
      // Generar entre 3-8 reservas por día
      const bookingsPerDay = Math.floor(Math.random() * 6) + 3
      
      for (let b = 0; b < bookingsPerDay; b++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomCourt = courts[Math.floor(Math.random() * courts.length)]
        
        // Horarios típicos de pádel (8:00 - 23:00)
        const hour = Math.floor(Math.random() * 15) + 8
        const startTimeStr = `${hour.toString().padStart(2, '0')}:00`
        const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:30`
        
        // Crear clave única para evitar duplicados
        const slotKey = `${randomCourt.id}-${date.toISOString().split('T')[0]}-${startTimeStr}-${endTimeStr}`
        
        // Si ya existe esta combinación, saltar
        if (usedSlots.has(slotKey)) {
          continue
        }
        usedSlots.add(slotKey)
        
        // Precio variable según horario (horarios pico más caros)
        let price = randomCourt.basePrice
        if (hour >= 18 && hour <= 21) {
          price = price * 1.3 // 30% más caro en horario pico
        }
        
        const booking = await prisma.booking.create({
          data: {
            userId: randomUser.id,
            courtId: randomCourt.id,
            bookingDate: date,
            startTime: startTimeStr,
            endTime: endTimeStr,
            durationMinutes: 90,
            totalPrice: Math.round(price),
            depositAmount: Math.round(price * 0.3), // 30% de depósito
            status: Math.random() > 0.1 ? 'CONFIRMED' : 'CANCELLED', // 90% confirmadas
            paymentStatus: Math.random() > 0.05 ? 'FULLY_PAID' : 'PENDING', // 95% pagadas
            paymentMethod: Math.random() > 0.5 ? 'CARD' : 'CASH',
            notes: `Reserva generada automáticamente - ${randomUser.name}`,
            players: {
              create: [
                {
                  playerName: randomUser.name || `Usuario ${randomUser.id}`,
                  playerEmail: randomUser.email,
                  playerPhone: randomUser.phone || '+5491100000000',
                  hasPaid: Math.random() > 0.1,
                  paidAmount: Math.round(price * 0.5),
                  position: 1
                },
                {
                  playerName: `Compañero de ${randomUser.name || 'Usuario'}`,
                  playerEmail: `companero${randomUser.id}@example.com`,
                  playerPhone: '+5491100000001',
                  hasPaid: Math.random() > 0.2,
                  paidAmount: Math.round(price * 0.5),
                  position: 2
                }
              ]
            }
          }
        })
        bookings.push(booking)
      }
    }
    console.log(`✅ Creadas ${bookings.length} reservas`)

    // Crear algunos productos de ejemplo
    const productos = [
      {
        nombre: 'Pelota de Pádel Wilson',
        precio: 2500,
        stock: 50,
        categoria: 'PELOTAS',
        activo: true
      },
      {
        nombre: 'Raqueta Head Delta Pro',
        precio: 45000,
        stock: 15,
        categoria: 'RAQUETAS',
        activo: true
      },
      {
        nombre: 'Grip Bullpadel',
        precio: 800,
        stock: 100,
        categoria: 'ACCESORIOS',
        activo: true
      },
      {
        nombre: 'Zapatillas Asics Gel-Padel',
        precio: 28000,
        stock: 25,
        categoria: 'CALZADO',
        activo: true
      }
    ]

    for (const producto of productos) {
      await prisma.producto.create({
        data: producto
      })
    }
    console.log(`✅ Creados ${productos.length} productos`)

    // Crear configuraciones del sistema
    const systemSettings = [
      { key: 'site_name', value: 'Turnero Pádel Pro' },
      { key: 'booking_advance_days', value: '30' },
      { key: 'cancellation_hours', value: '24' },
      { key: 'default_booking_duration', value: '90' },
      { key: 'peak_hours_start', value: '18' },
      { key: 'peak_hours_end', value: '21' },
      { key: 'peak_hours_multiplier', value: '1.3' }
    ]

    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      })
    }
    console.log(`✅ Creadas ${systemSettings.length} configuraciones del sistema`)

    console.log('\n🎉 Datos de ejemplo generados exitosamente!')
    console.log('📊 Resumen:')
    console.log(`   - ${users.length} usuarios`)
    console.log(`   - ${courts.length} canchas`)
    console.log(`   - ${bookings.length} reservas`)
    console.log(`   - ${productos.length} productos`)
    console.log(`   - ${systemSettings.length} configuraciones`)
    
  } catch (error) {
    console.error('❌ Error generando datos de ejemplo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateSampleData()
}

module.exports = { generateSampleData }