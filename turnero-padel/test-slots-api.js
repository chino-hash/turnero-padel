const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Funciones helper copiadas de la API
function hhmmToHour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h + (m || 0) / 60
}

function hourToHHMM(hour) {
  const total = Math.round(hour * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// Función para verificar disponibilidad
async function checkCourtAvailability(courtId, date, startTime, endTime) {
  try {
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        courtId,
        bookingDate: date,
        status: {
          not: 'CANCELLED'
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    })

    return !conflictingBooking
  } catch (error) {
    console.error('Error verificando disponibilidad:', error)
    throw new Error('Error al verificar disponibilidad')
  }
}

// Función principal de prueba
async function testSlotsAPI() {
  console.log('🧪 Probando API de slots...')
  
  const courtId = 'cmew6nvsd0001u2jcngxgt8au'
  const dateStr = '2024-12-19'
  const requestedDate = new Date(dateStr + 'T00:00:00.000Z')
  
  console.log(`\n📋 Parámetros de prueba:`)
  console.log(`   Court ID: ${courtId}`)
  console.log(`   Date: ${dateStr}`)
  console.log(`   Requested Date: ${requestedDate}`)
  
  try {
    // 1. Verificar que la cancha existe
    console.log('\n1. Verificando cancha...')
    const court = await prisma.court.findUnique({
      where: { id: courtId }
    })
    
    if (!court) {
      throw new Error(`Cancha ${courtId} no encontrada`)
    }
    
    console.log(`✅ Cancha encontrada: ${court.name}`)
    console.log(`   Base Price: ${court.basePrice}`)
    console.log(`   Price Multiplier: ${court.priceMultiplier}`)
    console.log(`   Active: ${court.isActive}`)
    
    // 2. Parsear operating hours
    console.log('\n2. Parseando horarios de operación...')
    let operatingHours
    try {
      operatingHours = typeof court.operatingHours === 'string' 
        ? JSON.parse(court.operatingHours) 
        : court.operatingHours
    } catch (parseError) {
      console.log('⚠️ Error parseando operating hours, usando valores por defecto')
      operatingHours = { start: "08:00", end: "23:00", slot_duration: 90 }
    }
    
    console.log(`   Operating Hours:`, operatingHours)
    
    // 3. Calcular parámetros de slots
    const startHour = hhmmToHour(operatingHours.start || "08:00")
    const endHour = hhmmToHour(operatingHours.end || "23:00")
    const slotDuration = (operatingHours.slot_duration || 90) / 60
    const basePrice = court.basePrice / 100
    const multiplier = court.priceMultiplier || 1
    const finalPrice = Math.round(basePrice * multiplier * 100) / 100
    
    console.log(`\n3. Parámetros calculados:`)
    console.log(`   Start Hour: ${startHour}`)
    console.log(`   End Hour: ${endHour}`)
    console.log(`   Slot Duration: ${slotDuration} hours`)
    console.log(`   Final Price: $${finalPrice}`)
    
    // 4. Generar slots
    console.log('\n4. Generando slots...')
    const slots = []
    const availabilityPromises = []
    
    for (let h = startHour; h + slotDuration <= endHour; h += slotDuration) {
      const startTime = hourToHHMM(h)
      const endTime = hourToHHMM(h + slotDuration)
      
      console.log(`   Generando slot: ${startTime} - ${endTime}`)
      
      availabilityPromises.push(
        checkCourtAvailability(courtId, requestedDate, startTime, endTime)
          .then(isAvailable => ({
            id: `${courtId}-${dateStr}-${startTime}`,
            startTime,
            endTime,
            timeRange: `${startTime} - ${endTime}`,
            isAvailable,
            price: finalPrice,
            courtId,
            date: dateStr
          }))
          .catch(error => {
            console.error(`❌ Error en slot ${startTime}-${endTime}:`, error)
            throw error
          })
      )
    }
    
    console.log(`   Total de promesas de disponibilidad: ${availabilityPromises.length}`)
    
    // 5. Ejecutar consultas de disponibilidad
    console.log('\n5. Ejecutando consultas de disponibilidad...')
    const slotsResults = await Promise.all(availabilityPromises)
    slots.push(...slotsResults)
    
    console.log(`✅ Slots generados exitosamente: ${slots.length}`)
    
    // 6. Mostrar resultados
    const open = slots.filter(s => s.isAvailable).length
    const total = slots.length
    const rate = total > 0 ? Math.round((open / total) * 100) : 0
    
    console.log(`\n📊 Estadísticas:`)
    console.log(`   Total slots: ${total}`)
    console.log(`   Slots disponibles: ${open}`)
    console.log(`   Tasa de disponibilidad: ${rate}%`)
    
    console.log(`\n🎯 Primeros 3 slots:`)
    slots.slice(0, 3).forEach(slot => {
      console.log(`   ${slot.timeRange}: ${slot.isAvailable ? 'Disponible' : 'Ocupado'} - $${slot.price}`)
    })
    
    return {
      success: true,
      slots,
      summary: { total, open, rate }
    }
    
  } catch (error) {
    console.error('❌ Error en testSlotsAPI:', error)
    console.error('Stack:', error.stack)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}

// Ejecutar prueba
testSlotsAPI()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Prueba de API de slots completada exitosamente')
    } else {
      console.log('\n❌ Prueba de API de slots falló')
      console.log('Error:', result.error)
    }
  })
  .catch(error => {
    console.error('\n💥 Error fatal en prueba:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n🔌 Conexión cerrada')
    process.exit(0)
  })