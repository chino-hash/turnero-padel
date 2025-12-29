const { PrismaClient } = require('@prisma/client')

async function clearCourts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🗑️ Eliminando canchas existentes...')
    const result = await prisma.court.deleteMany()
    console.log(`✅ ${result.count} canchas eliminadas`)
  } catch (error) {
    console.error('❌ Error eliminando canchas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearCourts()