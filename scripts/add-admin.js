/**
 * Script para agregar un nuevo administrador
 * Uso: node scripts/add-admin.js <email> [admin-que-agrega] [notas]
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

// Función para verificar si un email es administrador (versión simplificada)
async function isAdminEmail(email) {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Verificar en variable de entorno
  const envAdmins = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  if (envAdmins.includes(normalizedEmail)) {
    return true
  }
  
  // Verificar en base de datos
  const dbAdmin = await prisma.adminWhitelist.findUnique({
    where: { email: normalizedEmail }
  })
  
  return dbAdmin && dbAdmin.isActive
}

// Función para agregar administrador
async function addAdmin(newAdminEmail, addedByEmail = 'system', notes = 'Agregado por script') {
  try {
    const normalizedEmail = newAdminEmail.toLowerCase().trim()
    
    // Si no es system, verificar que quien agrega sea administrador
    if (addedByEmail !== 'system') {
      const isAuthorized = await isAdminEmail(addedByEmail)
      if (!isAuthorized) {
        return { success: false, message: 'No tienes permisos para agregar administradores' }
      }
    }
    
    // Verificar que el email no esté ya en la lista
    const existing = await prisma.adminWhitelist.findUnique({
      where: { email: normalizedEmail }
    })
    
    if (existing) {
      if (existing.isActive) {
        return { success: false, message: 'Este email ya es administrador' }
      } else {
        // Reactivar administrador existente
        await prisma.adminWhitelist.update({
          where: { email: normalizedEmail },
          data: { 
            isActive: true, 
            addedBy: addedByEmail,
            notes: notes || 'Reactivado',
            updatedAt: new Date()
          }
        })
        
        return { success: true, message: 'Administrador reactivado exitosamente' }
      }
    }
    
    // Crear nuevo administrador
    await prisma.adminWhitelist.create({
      data: {
        email: normalizedEmail,
        addedBy: addedByEmail,
        notes: notes || 'Agregado por script',
        isActive: true
      }
    })
    
    return { success: true, message: 'Administrador agregado exitosamente' }
    
  } catch (error) {
    console.error('Error:', error)
    return { success: false, message: `Error: ${error.message}` }
  }
}

async function main() {
  try {
    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2)
    
    if (args.length === 0) {
      console.log('❌ Uso: node scripts/add-admin.js <email> [admin-que-agrega] [notas]')
      console.log('   Ejemplo: node scripts/add-admin.js agustinagus05@gmail.com system "Nuevo administrador"')
      process.exit(1)
    }
    
    const newAdminEmail = args[0]
    const addedByEmail = args[1] || 'system'
    const notes = args[2] || 'Agregado por script'
    
    console.log('🚀 Agregando nuevo administrador...')
    console.log(`   Email: ${newAdminEmail}`)
    console.log(`   Agregado por: ${addedByEmail}`)
    console.log(`   Notas: ${notes}`)
    console.log('')
    
    const result = await addAdmin(newAdminEmail, addedByEmail, notes)
    
    if (result.success) {
      console.log('✅', result.message)
      console.log('')
      console.log('🔐 El usuario ahora puede:')
      console.log('   - Acceder al panel de administración')
      console.log('   - Gestionar reservas y pagos')
      console.log('   - Agregar/remover otros administradores')
      console.log('   - Configurar el sistema')
    } else {
      console.log('❌', result.message)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Error durante la ejecución:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main()
}

module.exports = { addAdmin }