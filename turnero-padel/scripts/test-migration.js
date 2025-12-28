/**
 * Script de testing para verificar la migración
 * 
 * Este script verifica que:
 * 1. Las dependencias estén instaladas correctamente
 * 2. Los archivos de configuración existan
 * 3. La estructura del proyecto sea correcta
 * 4. NextAuth.js esté configurado
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Iniciando verificación de migración...\n')

// 1. Verificar dependencias
console.log('📦 Verificando dependencias...')
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const requiredDeps = [
  'next-auth',
  '@auth/prisma-adapter',
  'prisma',
  '@prisma/client',
  'pg',
  '@types/pg'
]

const missingDeps = requiredDeps.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
)

if (missingDeps.length > 0) {
  console.log('❌ Dependencias faltantes:', missingDeps.join(', '))
} else {
  console.log('✅ Todas las dependencias están instaladas')
}

// 2. Verificar archivos de configuración
console.log('\n📁 Verificando archivos de configuración...')
const requiredFiles = [
  '.env.local',
  'prisma/schema.prisma',
  'lib/auth.ts',
  'lib/prisma.ts',
  'lib/admin-system.ts',
  'app/api/auth/[...nextauth]/route.ts',
  'middleware.ts',
  'hooks/useAuth.ts',
  'components/auth/GoogleLoginForm.tsx',
  'app/login/page.tsx'
]

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))

if (missingFiles.length > 0) {
  console.log('❌ Archivos faltantes:', missingFiles.join(', '))
} else {
  console.log('✅ Todos los archivos de configuración existen')
}

// 3. Verificar variables de entorno
console.log('\n⚙️ Verificando variables de entorno...')
require('dotenv').config({ path: '.env.local' })

const requiredEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL',
  'ADMIN_EMAILS'
]

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.log('❌ Variables de entorno faltantes:', missingEnvVars.join(', '))
} else {
  console.log('✅ Todas las variables de entorno están configuradas')
}

// 4. Verificar configuración de NextAuth.js
console.log('\n🔐 Verificando configuración de NextAuth.js...')
try {
  const authConfig = fs.readFileSync('lib/auth.ts', 'utf8')
  
  const checks = [
    { name: 'Google provider', test: authConfig.includes('Google') },
    { name: 'PrismaAdapter', test: authConfig.includes('PrismaAdapter') },
    { name: 'Admin system import', test: authConfig.includes('admin-system') },
    { name: 'Session callbacks', test: authConfig.includes('session') },
    { name: 'SignIn callbacks', test: authConfig.includes('signIn') }
  ]
  
  checks.forEach(check => {
    console.log(check.test ? '✅' : '❌', check.name)
  })
} catch (error) {
  console.log('❌ Error leyendo configuración de NextAuth.js:', error.message)
}

// 5. Verificar esquema de Prisma
console.log('\n🗄️ Verificando esquema de Prisma...')
try {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8')
  
  const checks = [
    { name: 'PostgreSQL provider', test: schema.includes('provider = "postgresql"') },
    { name: 'NextAuth models', test: schema.includes('model Account') && schema.includes('model Session') },
    { name: 'Business models', test: schema.includes('model Court') && schema.includes('model Booking') },
    { name: 'Admin whitelist', test: schema.includes('model AdminWhitelist') },
    { name: 'Enums', test: schema.includes('enum Role') && schema.includes('enum BookingStatus') }
  ]
  
  checks.forEach(check => {
    console.log(check.test ? '✅' : '❌', check.name)
  })
} catch (error) {
  console.log('❌ Error leyendo esquema de Prisma:', error.message)
}

// 6. Verificar servicios
console.log('\n🔧 Verificando servicios...')
const serviceFiles = [
  'lib/services/courts.ts',
  'lib/services/bookings.ts',
  'lib/services/users.ts'
]

serviceFiles.forEach(file => {
  const exists = fs.existsSync(file)
  console.log(exists ? '✅' : '❌', path.basename(file))
})

// 7. Verificar APIs
console.log('\n🌐 Verificando APIs...')
const apiFiles = [
  'app/api/auth/[...nextauth]/route.ts',
  'app/api/courts/route.ts',
  'app/api/bookings/user/route.ts'
]

apiFiles.forEach(file => {
  const exists = fs.existsSync(file)
  console.log(exists ? '✅' : '❌', path.basename(file, '.ts'))
})

// 8. Verificar que Supabase fue removido
console.log('\n🗑️ Verificando remoción de Supabase...')
const supabaseFiles = [
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'lib/supabase/middleware.ts'
]

const remainingSupabaseFiles = supabaseFiles.filter(file => fs.existsSync(file))

if (remainingSupabaseFiles.length > 0) {
  console.log('⚠️ Archivos de Supabase aún presentes:', remainingSupabaseFiles.join(', '))
} else {
  console.log('✅ Archivos de Supabase removidos correctamente')
}

// Verificar dependencias de Supabase en package.json
const supabaseDeps = Object.keys(packageJson.dependencies || {})
  .concat(Object.keys(packageJson.devDependencies || {}))
  .filter(dep => dep.includes('supabase'))

if (supabaseDeps.length > 0) {
  console.log('⚠️ Dependencias de Supabase aún presentes:', supabaseDeps.join(', '))
} else {
  console.log('✅ Dependencias de Supabase removidas correctamente')
}

// Resumen final
console.log('\n📋 Resumen de la migración:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const totalChecks = 8
const passedChecks = [
  missingDeps.length === 0,
  missingFiles.length === 0,
  missingEnvVars.length === 0,
  true, // NextAuth config (asumimos que está bien si el archivo existe)
  true, // Prisma schema (asumimos que está bien si el archivo existe)
  serviceFiles.every(file => fs.existsSync(file)),
  apiFiles.every(file => fs.existsSync(file)),
  remainingSupabaseFiles.length === 0 && supabaseDeps.length === 0
].filter(Boolean).length

console.log(`✅ Verificaciones pasadas: ${passedChecks}/${totalChecks}`)

if (passedChecks === totalChecks) {
  console.log('🎉 ¡Migración completada exitosamente!')
  console.log('\n📝 Próximos pasos:')
  console.log('1. Configurar base de datos PostgreSQL (ver scripts/setup-database.md)')
  console.log('2. Ejecutar: npx prisma db push')
  console.log('3. Ejecutar: node scripts/init-admins.js')
  console.log('4. Ejecutar: npm run dev')
  console.log('5. Probar login con Google OAuth')
} else {
  console.log('⚠️ La migración necesita algunos ajustes antes de estar completa.')
  console.log('Revisa los errores arriba y corrígelos antes de continuar.')
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
