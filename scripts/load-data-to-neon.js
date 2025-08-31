/**
 * Script maestro para cargar todos los datos iniciales a la base de datos Neon
 * 
 * Este script ejecuta en orden:
 * 1. Inicialización de administradores
 * 2. Creación de canchas
 * 3. Carga de productos
 * 4. Configuraciones del sistema
 * 
 * Uso:
 * node scripts/load-data-to-neon.js
 */

const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

// Función para inicializar administradores
async function initializeAdmins() {
  console.log('👥 Inicializando administradores...')
  
  const envAdmins = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
  
  if (envAdmins.length === 0) {
    console.log('⚠️  No se encontraron administradores en ADMIN_EMAILS')
    console.log('   Agregando administrador por defecto: admin@turnero.com')
    envAdmins.push('admin@turnero.com')
  }

  for (const email of envAdmins) {
    if (!email || email.length === 0) continue

    try {
      await prisma.adminWhitelist.upsert({
        where: { email: email.toLowerCase() },
        update: { 
          isActive: true,
          notes: 'Administrador principal (desde env)',
          updatedAt: new Date()
        },
        create: {
          email: email.toLowerCase(),
          isActive: true,
          addedBy: 'system',
          notes: 'Administrador principal (desde env)'
        }
      })
      
      console.log(`✅ Administrador configurado: ${email}`)
    } catch (error) {
      console.error(`❌ Error configurando ${email}:`, error.message)
    }
  }
}

// Función para crear canchas
async function seedCourts() {
  console.log('🏟️ Creando canchas...')
  
  const existingCourts = await prisma.court.count()
  
  if (existingCourts > 0) {
    console.log(`✅ Ya existen ${existingCourts} canchas en la base de datos`)
    return
  }
  
  const courts = [
    {
      id: 'court-a',
      name: 'Cancha 1',
      description: 'Cancha profesional con iluminación LED',
      basePrice: 600000, // $6000 en centavos
      priceMultiplier: 1.0,
      features: JSON.stringify(['Iluminación LED', 'Superficie Premium', 'Control de Clima']),
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
      description: 'Cancha estándar con superficie de calidad',
      basePrice: 600000,
      priceMultiplier: 0.9,
      features: JSON.stringify(['Superficie Premium', 'Césped Sintético']),
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
      description: 'Cancha premium con características mejoradas',
      basePrice: 600000,
      priceMultiplier: 1.2,
      features: JSON.stringify(['Aire Acondicionado', 'Superficie Premium', 'Sistema de Sonido']),
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
}

// Función para crear productos
async function seedProductos() {
  console.log('🛍️ Creando productos...')
  
  const existingProducts = await prisma.producto.count()
  
  if (existingProducts > 0) {
    console.log(`✅ Ya existen ${existingProducts} productos en la base de datos`)
    return
  }
  
  const productos = [
    // Alquiler de Raqueta
    { nombre: 'Alquiler de Raqueta', precio: 15000, stock: 10, categoria: 'Alquiler', activo: true },
    { nombre: 'Alquiler de Raqueta Premium', precio: 20000, stock: 5, categoria: 'Alquiler', activo: true },
    
    // Pelotas
    { nombre: 'Pelota de Pádel', precio: 5000, stock: 50, categoria: 'Pelotas', activo: true },
    { nombre: 'Pelotas x2', precio: 9000, stock: 30, categoria: 'Pelotas', activo: true },
    { nombre: 'Pelotas x3', precio: 13000, stock: 25, categoria: 'Pelotas', activo: true },
    
    // Toallas
    { nombre: 'Toalla', precio: 8000, stock: 20, categoria: 'Toallas', activo: true },
    { nombre: 'Toalla Premium', precio: 12000, stock: 15, categoria: 'Toallas', activo: true },
    
    // Bebidas
    { nombre: 'Bebida', precio: 3000, stock: 40, categoria: 'Bebidas', activo: true },
    { nombre: 'Agua Mineral', precio: 2000, stock: 50, categoria: 'Bebidas', activo: true },
    { nombre: 'Gatorade', precio: 4000, stock: 30, categoria: 'Bebidas', activo: true },
    { nombre: 'Coca Cola', precio: 3500, stock: 35, categoria: 'Bebidas', activo: true },
    { nombre: 'Cerveza', precio: 5000, stock: 25, categoria: 'Bebidas', activo: true },
    
    // Snacks
    { nombre: 'Snack', precio: 4000, stock: 30, categoria: 'Snacks', activo: true },
    { nombre: 'Barrita Energética', precio: 3500, stock: 40, categoria: 'Snacks', activo: true },
    { nombre: 'Frutos Secos', precio: 4500, stock: 25, categoria: 'Snacks', activo: true },
    { nombre: 'Sandwich', precio: 8000, stock: 15, categoria: 'Snacks', activo: true },
    
    // Otros productos
    { nombre: 'Otro', precio: 5000, stock: 20, categoria: 'Otros', activo: true },
    { nombre: 'Grip Antideslizante', precio: 6000, stock: 30, categoria: 'Otros', activo: true },
    { nombre: 'Protector de Paletas', precio: 10000, stock: 20, categoria: 'Otros', activo: true },
    { nombre: 'Muñequeras', precio: 7000, stock: 25, categoria: 'Otros', activo: true }
  ]
  
  for (const producto of productos) {
    await prisma.producto.create({
      data: producto
    })
    console.log(`✅ Producto creado: ${producto.nombre} - $${producto.precio}`)
  }
}

// Función para crear configuraciones del sistema
async function seedSystemSettings() {
  console.log('⚙️ Creando configuraciones del sistema...')
  
  const existingSettings = await prisma.systemSetting.count()
  
  if (existingSettings > 0) {
    console.log(`✅ Ya existen ${existingSettings} configuraciones en la base de datos`)
    return
  }
  
  const settings = [
    {
      key: 'booking_advance_days',
      value: '30',
      description: 'Días de anticipación máxima para reservas',
      category: 'booking',
      isPublic: true
    },
    {
      key: 'default_slot_duration',
      value: '90',
      description: 'Duración por defecto de slots en minutos',
      category: 'booking',
      isPublic: true
    },
    {
      key: 'operating_hours_start',
      value: '08:00',
      description: 'Hora de inicio de operaciones',
      category: 'schedule',
      isPublic: true
    },
    {
      key: 'operating_hours_end',
      value: '22:00',
      description: 'Hora de fin de operaciones',
      category: 'schedule',
      isPublic: true
    },
    {
      key: 'deposit_percentage',
      value: '50',
      description: 'Porcentaje de depósito requerido',
      category: 'payment',
      isPublic: false
    },
    {
      key: 'cancellation_hours',
      value: '24',
      description: 'Horas mínimas para cancelación sin penalidad',
      category: 'booking',
      isPublic: true
    }
  ]
  
  for (const setting of settings) {
    await prisma.systemSetting.create({
      data: setting
    })
    console.log(`✅ Configuración creada: ${setting.key} = ${setting.value}`)
  }
}

// Función principal
async function loadDataToNeon() {
  try {
    console.log('🚀 Iniciando carga de datos a Neon...')
    console.log('📊 Base de datos:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'No especificada')
    
    // Verificar conexión
    await prisma.$connect()
    console.log('✅ Conexión a base de datos establecida')
    
    // Ejecutar migraciones si es necesario
    console.log('🔄 Verificando esquema de base de datos...')
    
    // Ejecutar seeds en orden
    await initializeAdmins()
    await seedCourts()
    await seedProductos()
    await seedSystemSettings()
    
    console.log('\n🎉 ¡Carga de datos completada exitosamente!')
    console.log('\n📋 Resumen:')
    
    const adminCount = await prisma.adminWhitelist.count()
    const courtCount = await prisma.court.count()
    const productCount = await prisma.producto.count()
    const settingCount = await prisma.systemSetting.count()
    
    console.log(`   👥 Administradores: ${adminCount}`)
    console.log(`   🏟️ Canchas: ${courtCount}`)
    console.log(`   🛍️ Productos: ${productCount}`)
    console.log(`   ⚙️ Configuraciones: ${settingCount}`)
    
    console.log('\n🌐 Tu aplicación está lista para usar con:')
    console.log('   • Horarios: 08:00 - 22:00 (slots de 90 minutos)')
    console.log('   • Canchas configuradas con precios')
    console.log('   • Productos disponibles para venta')
    console.log('   • Sistema de administración configurado')
    
  } catch (error) {
    console.error('❌ Error durante la carga de datos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  loadDataToNeon()
    .catch((error) => {
      console.error('💥 Error fatal:', error)
      process.exit(1)
    })
}

module.exports = { loadDataToNeon }