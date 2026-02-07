const { PrismaClient } = require('@prisma/client')

async function checkCourts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando canchas en la base de datos...')
    
    const courts = await prisma.court.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        basePrice: true
      }
    })
    
    console.log(`📊 Total de canchas encontradas: ${courts.length}`)
    
    if (courts.length === 0) {
      console.log('❌ No se encontraron canchas en la base de datos')
    } else {
      console.log('\n📋 Lista de canchas:')
      courts.forEach(court => {
        console.log(`  - ID: ${court.id}, Nombre: ${court.name}, Activa: ${court.isActive}, Precio: ${court.basePrice}`)
      })
    }
    
    // Verificar específicamente las canchas que están causando error
    const problematicCourts = ['court-a', 'court-b', 'court-c']
    console.log('\n🔍 Verificando canchas problemáticas:')
    
    for (const courtId of problematicCourts) {
      const court = await prisma.court.findUnique({
        where: { id: courtId }
      })
      
      if (court) {
        console.log(`  ✅ ${courtId}: Encontrada - ${court.name} (Activa: ${court.isActive})`)
      } else {
        console.log(`  ❌ ${courtId}: NO ENCONTRADA`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCourts()