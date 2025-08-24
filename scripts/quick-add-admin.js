const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function addAdminQuick() {
  try {
    console.log('🚀 Agregando administrador: agustinagus05@gmail.com')
    
    const result = await prisma.adminWhitelist.upsert({
      where: { email: 'agustinagus05@gmail.com' },
      update: { 
        isActive: true,
        notes: 'Administrador agregado por solicitud',
        updatedAt: new Date()
      },
      create: {
        email: 'agustinagus05@gmail.com',
        isActive: true,
        addedBy: 'system',
        notes: 'Administrador agregado por solicitud'
      }
    })
    
    console.log('✅ Administrador agregado exitosamente!')
    console.log('📧 Email:', result.email)
    console.log('🔐 Estado:', result.isActive ? 'Activo' : 'Inactivo')
    console.log('📝 Notas:', result.notes)
    console.log('')
    console.log('🎉 El usuario agustinagus05@gmail.com ahora puede:')
    console.log('   - Acceder al panel de administración')
    console.log('   - Gestionar reservas y pagos')
    console.log('   - Agregar/remover otros administradores')
    console.log('   - Configurar el sistema')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addAdminQuick()