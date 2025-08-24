const { PrismaClient } = require('@prisma/client')

async function verifyAdmin() {
  const prisma = new PrismaClient()
  
  try {
    const email = 'agustinagus05@gmail.com'
    
    console.log('🔍 Verificando permisos de administrador...')
    console.log(`Email a verificar: ${email}`)
    console.log('')
    
    // Verificar en la base de datos directamente
    console.log('📊 Consulta directa a la base de datos:')
    const adminRecord = await prisma.adminWhitelist.findUnique({
      where: { email: email.toLowerCase().trim() }
    })
    
    if (adminRecord) {
      console.log('✅ Registro encontrado en adminWhitelist:')
      console.log(`   Email: ${adminRecord.email}`)
      console.log(`   Activo: ${adminRecord.isActive}`)
      console.log(`   Agregado por: ${adminRecord.addedBy}`)
      console.log(`   Fecha creación: ${adminRecord.createdAt}`)
      console.log(`   Notas: ${adminRecord.notes}`)
    } else {
      console.log('❌ No se encontró registro en adminWhitelist')
    }
    
    console.log('')
    
    // Obtener lista completa de administradores desde la base de datos
    console.log('📋 Lista completa de administradores:')
    const allAdmins = await prisma.adminWhitelist.findMany({
      where: { isActive: true },
      select: {
        email: true,
        addedBy: true,
        createdAt: true,
        notes: true
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`   Total de administradores activos: ${allAdmins.length}`)
    
    if (allAdmins.length > 0) {
      console.log('   Administradores activos:')
      allAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (agregado por: ${admin.addedBy})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la verificación
verifyAdmin()
  .then(() => {
    console.log('\n🎉 Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en la verificación:', error)
    process.exit(1)
  })