const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedCourts() {
  try {
    console.log('🌱 Creando canchas de prueba...')
    
    // Verificar si ya existen canchas
    const existingCourts = await prisma.court.count()
    
    if (existingCourts > 0) {
      console.log(`✅ Ya existen ${existingCourts} canchas en la base de datos`)
      return
    }
    
    // Crear canchas de prueba
    const courts = [
      {
        id: 'court-a',
        name: 'Cancha 1',
        description: 'Professional court with LED lighting',
        basePrice: 6000,
        priceMultiplier: 1.0,
        features: JSON.stringify(['LED Lighting', 'Premium Surface', 'Climate Control']),
        operatingHours: JSON.stringify({
          start: '08:00',
          end: '22:00',
          slot_duration: 90
        }),
        isActive: true
      },
      {
        id: 'court-b',
        name: 'Cancha 2',
        description: 'Standard court with quality surface',
        basePrice: 6000,
        priceMultiplier: 0.9,
        features: JSON.stringify(['Premium Surface', 'Synthetic Grass']),
        operatingHours: JSON.stringify({
          start: '08:00',
          end: '22:00',
          slot_duration: 90
        }),
        isActive: true
      },
      {
        id: 'court-c',
        name: 'Cancha 3',
        description: 'Premium court with enhanced features',
        basePrice: 6000,
        priceMultiplier: 1.2,
        features: JSON.stringify(['Air Conditioning', 'Premium Surface', 'Sound System']),
        operatingHours: JSON.stringify({
          start: '08:00',
          end: '22:00',
          slot_duration: 90
        }),
        isActive: true
      }
    ]
    
    for (const court of courts) {
      await prisma.court.create({
        data: court
      })
      console.log(`✅ Cancha creada: ${court.name}`)
    }
    
    console.log('🎉 Canchas de prueba creadas exitosamente!')
    
  } catch (error) {
    console.error('❌ Error creando canchas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCourts()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })