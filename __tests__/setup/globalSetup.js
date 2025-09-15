// Global setup for Jest tests
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

module.exports = async () => {
  console.log('🚀 Configurando entorno de testing...')
  
  // Crear directorios necesarios
  const dirs = [
    'test-reports',
    'coverage',
    '.jest-cache'
  ]
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`📁 Creado directorio: ${dir}`)
    }
  })
  
  // Configurar variables de entorno para testing
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/turnero_test'
  
  // Verificar que Prisma esté configurado
  try {
    console.log('🔧 Verificando configuración de Prisma...')
    execSync('npx prisma generate', { stdio: 'pipe' })
    console.log('✅ Prisma configurado correctamente')
  } catch (error) {
    console.warn('⚠️  Advertencia: Error al configurar Prisma:', error.message)
  }
  
  // Limpiar cache anterior si existe
  const cacheDir = path.join(process.cwd(), '.jest-cache')
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true })
      fs.mkdirSync(cacheDir, { recursive: true })
      console.log('🧹 Cache de Jest limpiado')
    } catch (error) {
      console.warn('⚠️  Advertencia: No se pudo limpiar el cache:', error.message)
    }
  }
  
  console.log('✅ Configuración de testing completada')
}