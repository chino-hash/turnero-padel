const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearSessions() {
  try {
    const result = await prisma.session.deleteMany({})
    console.log(`Eliminadas ${result.count} sesiones`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearSessions()
