const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedProductos() {
  try {
    console.log('🌱 Iniciando seed de productos...')

    // Productos sincronizados con el modal de extras de AdminTurnos
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
      
      // Otros productos adicionales
      { nombre: 'Otro', precio: 5000, stock: 20, categoria: 'Otros', activo: true },
      { nombre: 'Grip Antideslizante', precio: 6000, stock: 30, categoria: 'Otros', activo: true },
      { nombre: 'Protector de Paletas', precio: 10000, stock: 20, categoria: 'Otros', activo: true },
      { nombre: 'Muñequeras', precio: 7000, stock: 25, categoria: 'Otros', activo: true }
    ]

    // Limpiar productos existentes
    await prisma.producto.deleteMany({})
    console.log('🗑️  Productos existentes eliminados')

    // Crear productos
    for (const producto of productos) {
      await prisma.producto.create({
        data: producto
      })
      console.log(`✅ Producto creado: ${producto.nombre} - $${producto.precio}`)
    }

    console.log(`🎉 Seed completado! ${productos.length} productos creados.`)
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProductos()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })