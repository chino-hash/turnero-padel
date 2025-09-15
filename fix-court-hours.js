const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function fixCourtHours() {
  console.log('🔧 Corrigiendo horarios de operación de las canchas...')
  
  const problematicCourts = [
    'cmew6nvsd0001u2jcngxgt8au',
    'cmew6nvsd0002u2jcc24nirbn', 
    'cmew6nvi40000u2jcmer3av60'
  ]
  
  // Horarios correctos para una cancha de pádel
  const correctOperatingHours = {
    start: "08:00",
    end: "23:00", 
    slot_duration: 90
  }
  
  console.log('✅ Horarios correctos a aplicar:', correctOperatingHours)
  
  for (const courtId of problematicCourts) {
    console.log(`\n🏓 Actualizando cancha: ${courtId}`)
    
    try {
      // Primero verificar el estado actual
      const currentCourt = await prisma.court.findUnique({
        where: { id: courtId },
        select: { name: true, operatingHours: true }
      })
      
      if (!currentCourt) {
        console.log('❌ Cancha no encontrada')
        continue
      }
      
      console.log(`   Cancha: ${currentCourt.name}`)
      console.log(`   Horarios actuales: ${currentCourt.operatingHours}`)
      
      // Actualizar los horarios
      const updatedCourt = await prisma.court.update({
        where: { id: courtId },
        data: {
          operatingHours: JSON.stringify(correctOperatingHours)
        },
        select: { name: true, operatingHours: true }
      })
      
      console.log(`   ✅ Actualizado exitosamente`)
      console.log(`   Nuevos horarios: ${updatedCourt.operatingHours}`)
      
      // Verificar que se parseó correctamente
      const parsed = JSON.parse(updatedCourt.operatingHours)
      console.log(`   Verificación - Start: ${parsed.start}, End: ${parsed.end}, Duration: ${parsed.slot_duration}min`)
      
    } catch (error) {
      console.log(`❌ Error actualizando cancha ${courtId}:`, error.message)
    }
  }
  
  console.log('\n🧪 Verificando que los cambios funcionan...')
  
  // Probar la lógica con los nuevos datos
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
  
  const startHour = hhmmToHour(correctOperatingHours.start)
  const endHour = hhmmToHour(correctOperatingHours.end)
  const slotDuration = correctOperatingHours.slot_duration / 60
  
  console.log(`\n📊 Simulación con horarios corregidos:`)
  console.log(`   Start: ${correctOperatingHours.start} (${startHour}h)`)
  console.log(`   End: ${correctOperatingHours.end} (${endHour}h)`)
  console.log(`   Duration: ${correctOperatingHours.slot_duration}min (${slotDuration}h)`)
  
  console.log(`\n🎯 Primeros slots que se generarían:`)
  let count = 0
  for (let h = startHour; h + slotDuration <= endHour && count < 5; h += slotDuration) {
    const start = hourToHHMM(h)
    const end = hourToHHMM(h + slotDuration)
    console.log(`   ${start} - ${end}`)
    count++
  }
}

fixCourtHours()
  .then(() => {
    console.log('\n✅ Corrección de horarios completada')
  })
  .catch(error => {
    console.error('💥 Error fatal:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('\n🔌 Conexión cerrada')
    process.exit(0)
  })