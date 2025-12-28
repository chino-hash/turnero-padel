const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function debugCourtData() {
  console.log('🔍 Analizando datos de las canchas problemáticas...')
  
  const problematicCourts = [
    'cmew6nvsd0001u2jcngxgt8au',
    'cmew6nvsd0002u2jcc24nirbn', 
    'cmew6nvi40000u2jcmer3av60'
  ]
  
  for (const courtId of problematicCourts) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`🏓 Analizando cancha: ${courtId}`)
    
    try {
      const court = await prisma.court.findUnique({
        where: { id: courtId }
      })
      
      if (!court) {
        console.log('❌ Cancha no encontrada')
        continue
      }
      
      console.log(`✅ Cancha encontrada: ${court.name}`)
      console.log(`   ID: ${court.id}`)
      console.log(`   Active: ${court.isActive}`)
      console.log(`   Base Price: ${court.basePrice}`)
      console.log(`   Price Multiplier: ${court.priceMultiplier}`)
      console.log(`   Created: ${court.createdAt}`)
      console.log(`   Updated: ${court.updatedAt}`)
      
      // Analizar operating hours
      console.log(`\n📅 Operating Hours (raw):`, court.operatingHours)
      console.log(`   Tipo: ${typeof court.operatingHours}`)
      
      let parsedHours
      try {
        parsedHours = typeof court.operatingHours === 'string' 
          ? JSON.parse(court.operatingHours) 
          : court.operatingHours
        console.log(`   Parsed:`, parsedHours)
      } catch (parseError) {
        console.log(`   ❌ Error parseando:`, parseError.message)
        parsedHours = null
      }
      
      // Analizar features
      console.log(`\n🎯 Features (raw):`, court.features)
      console.log(`   Tipo: ${typeof court.features}`)
      
      let parsedFeatures
      try {
        parsedFeatures = typeof court.features === 'string' 
          ? JSON.parse(court.features) 
          : court.features
        console.log(`   Parsed:`, parsedFeatures)
      } catch (parseError) {
        console.log(`   ❌ Error parseando:`, parseError.message)
        parsedFeatures = null
      }
      
      // Simular la lógica de la API
      console.log(`\n🧮 Simulando lógica de API...`)
      
      const operatingHours = parsedHours || { start: "08:00", end: "23:00", slot_duration: 90 }
      console.log(`   Operating hours finales:`, operatingHours)
      
      // Función helper
      function hhmmToHour(hhmm) {
        const [h, m] = hhmm.split(':').map(Number)
        return h + (m || 0) / 60
      }
      
      const startHour = hhmmToHour(operatingHours.start || "08:00")
      const endHour = hhmmToHour(operatingHours.end || "23:00")
      const slotDuration = (operatingHours.slot_duration || 90) / 60
      
      console.log(`   Start Hour: ${startHour}`)
      console.log(`   End Hour: ${endHour}`)
      console.log(`   Slot Duration: ${slotDuration} hours`)
      
      // Verificar si los valores son válidos
      if (isNaN(startHour) || isNaN(endHour) || isNaN(slotDuration)) {
        console.log(`   ❌ PROBLEMA: Valores NaN detectados!`)
        console.log(`      startHour: ${startHour} (${typeof startHour})`)
        console.log(`      endHour: ${endHour} (${typeof endHour})`)
        console.log(`      slotDuration: ${slotDuration} (${typeof slotDuration})`)
      }
      
      if (startHour >= endHour) {
        console.log(`   ❌ PROBLEMA: Start hour >= End hour`)
      }
      
      if (slotDuration <= 0) {
        console.log(`   ❌ PROBLEMA: Slot duration <= 0`)
      }
      
      // Calcular cuántos slots se generarían
      let slotCount = 0
      for (let h = startHour; h + slotDuration <= endHour; h += slotDuration) {
        slotCount++
        if (slotCount <= 3) {
          function hourToHHMM(hour) {
            const total = Math.round(hour * 60)
            const hh = Math.floor(total / 60) % 24
            const mm = total % 60
            return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
          }
          console.log(`   Slot ${slotCount}: ${hourToHHMM(h)} - ${hourToHHMM(h + slotDuration)}`)
        }
      }
      console.log(`   Total slots que se generarían: ${slotCount}`)
      
    } catch (error) {
      console.log(`❌ Error analizando cancha:`, error.message)
      console.log(`   Stack:`, error.stack)
    }
  }
}

debugCourtData()
  .catch(error => {
    console.error('💥 Error fatal:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n🔌 Conexión cerrada')
    process.exit(0)
  })