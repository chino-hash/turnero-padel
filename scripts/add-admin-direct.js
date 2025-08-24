const { PrismaClient } = require('@prisma/client')

async function addAdminDirect() {
  const prisma = new PrismaClient()
  
  try {
    const email = 'agustinagus05@gmail.com'
    const normalizedEmail = email.toLowerCase().trim()
    
    console.log(`Agregando administrador: ${normalizedEmail}`)
    
    // Verificar si ya existe
    const existing = await prisma.adminWhitelist.findUnique({
      where: { email: normalizedEmail }
    })
    
    if (existing) {
      if (existing.isActive) {
        console.log('✅ El email ya está registrado como administrador activo')
        return
      } else {
        // Reactivar administrador
        await prisma.adminWhitelist.update({
          where: { email: normalizedEmail },
          data: {
            isActive: true,
            updatedAt: new Date()
          }
        })
        console.log('✅ Administrador reactivado exitosamente')
        return
      }
    }
    
    // Crear nuevo administrador
    const newAdmin = await prisma.adminWhitelist.create({
      data: {
        email: normalizedEmail,
        addedBy: 'Sistema',
        notes: 'Administrador agregado por solicitud del usuario',
        isActive: true
      }
    })
    
    console.log('✅ Administrador agregado exitosamente:')
    console.log(`   Email: ${newAdmin.email}`)
    console.log(`   Agregado por: ${newAdmin.addedBy}`)
    console.log(`   Fecha: ${newAdmin.createdAt}`)
    console.log(`   Activo: ${newAdmin.isActive}`)
    
  } catch (error) {
    console.error('❌ Error al agregar administrador:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la función
addAdminDirect()
  .then(() => {
    console.log('\n🎉 Proceso completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en el proceso:', error)
    process.exit(1)
  })