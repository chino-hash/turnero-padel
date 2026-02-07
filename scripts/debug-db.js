const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testDatabase() {
  console.log('🔍 Iniciando diagnóstico de base de datos...')
  
  try {
    // Test 1: Conexión básica
    console.log('\n1. Probando conexión básica...')
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Conexión básica exitosa')
    
    // Test 2: Verificar tablas
    console.log('\n2. Verificando tablas existentes...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('📋 Tablas encontradas:', tables)
    
    // Test 3: Verificar canchas específicas
    console.log('\n3. Verificando canchas específicas...')
    const courts = await prisma.court.findMany()
    console.log('🏟️ Canchas encontradas:', courts.length)
    courts.forEach(court => {
      console.log(`   - ${court.id}: ${court.name} (activa: ${court.isActive})`)
    })
    
    // Test 4: Probar las canchas problemáticas
    const problematicCourtIds = [
      'cmew6nvsd0001u2jcngxgt8au',
      'cmew6nvsd0002u2jcc24nirbn', 
      'cmew6nvi40000u2jcmer3av60'
    ]
    
    console.log('\n4. Probando canchas problemáticas...')
    for (const courtId of problematicCourtIds) {
      try {
        const court = await prisma.court.findUnique({
          where: { id: courtId }
        })
        if (court) {
          console.log(`✅ Cancha ${courtId}: ${court.name} encontrada`)
        } else {
          console.log(`❌ Cancha ${courtId}: NO ENCONTRADA`)
        }
      } catch (error) {
        console.log(`❌ Error al buscar cancha ${courtId}:`, error.message)
      }
    }
    
    // Test 5: Probar consulta de disponibilidad
    console.log('\n5. Probando consulta de disponibilidad...')
    const testDate = new Date()
    const testCourtId = problematicCourtIds[0]
    
    try {
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          courtId: testCourtId,
          bookingDate: testDate,
          status: {
            not: 'CANCELLED'
          }
        }
      })
      console.log(`✅ Consulta de disponibilidad exitosa para ${testCourtId}`)
      console.log(`   Reservas conflictivas: ${conflictingBooking ? 1 : 0}`)
    } catch (error) {
      console.log(`❌ Error en consulta de disponibilidad:`, error.message)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Conexión cerrada')
  }
}

testDatabase()
  .then(() => {
    console.log('\n✅ Diagnóstico completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })