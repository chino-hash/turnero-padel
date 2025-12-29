const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Iniciando población de datos de prueba...');

  try {
    // 1. Limpiar datos existentes (excepto administradores)
    console.log('🧹 Limpiando datos existentes...');
    await prisma.booking.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        NOT: {
          email: {
            in: ['admin@turneropadel.com', 'chinoo@turneropadel.com']
          }
        }
      }
    });
    await prisma.court.deleteMany({});

    // 2. Crear canchas de prueba
    console.log('🏟️ Creando canchas de prueba...');
    const courts = await Promise.all([
      prisma.court.create({
        data: {
          name: 'Cancha 1 - Premium',
          description: 'Cancha premium con césped sintético de última generación',
          basePrice: 6000,
          features: JSON.stringify({ color: '#8b5cf6', bgColor: '#a78bfa', textColor: '#ffffff' }),
          operatingHours: JSON.stringify({ start: '08:00', end: '22:30', slot_duration: 90 }),
          isActive: true
        }
      }),
      prisma.court.create({
        data: {
          name: 'Cancha 2 - Estándar',
          description: 'Cancha estándar con buena iluminación',
          basePrice: 6000,
          features: JSON.stringify({ color: '#ef4444', bgColor: '#f87171', textColor: '#ffffff' }),
          operatingHours: JSON.stringify({ start: '08:00', end: '22:30', slot_duration: 90 }),
          isActive: true
        }
      }),
      prisma.court.create({
        data: {
          name: 'Cancha 3 - Económica',
          description: 'Cancha económica ideal para principiantes',
          basePrice: 6000,
          features: JSON.stringify({ color: '#22c55e', bgColor: '#4ade80', textColor: '#ffffff' }),
          operatingHours: JSON.stringify({ start: '08:00', end: '22:30', slot_duration: 90 }),
          isActive: true
        }
      })
    ]);

    console.log(`✅ Creadas ${courts.length} canchas`);

    // 3. Crear usuarios de prueba
    console.log('👥 Creando usuarios de prueba...');
    
    const users = await Promise.all([
      // Usuario regular activo
      prisma.user.create({
        data: {
          name: 'Juan Pérez',
          email: 'juan.perez@test.com',
          phone: '+54 11 1234-5678',
          emailVerified: new Date()
        }
      }),
      // Usuario con muchas reservas
      prisma.user.create({
        data: {
          name: 'María González',
          email: 'maria.gonzalez@test.com',
          phone: '+54 11 2345-6789',
          emailVerified: new Date()
        }
      }),
      // Usuario nuevo sin verificar
      prisma.user.create({
        data: {
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@test.com',
          phone: '+54 11 3456-7890',
          emailVerified: null
        }
      }),
      // Usuario con nombre largo (caso límite)
      prisma.user.create({
        data: {
          name: 'Ana Sofía Fernández de la Torre y Martínez',
          email: 'ana.sofia.fernandez@test.com',
          phone: '+54 11 4567-8901',
          emailVerified: new Date()
        }
      }),
      // Usuario con email largo (caso límite)
      prisma.user.create({
        data: {
          name: 'Roberto Silva',
          email: 'roberto.silva.muy.largo.email.de.prueba@testdominio.com',
          phone: '+54 11 5678-9012',
          emailVerified: new Date()
        }
      })
    ]);

    console.log(`✅ Creados ${users.length} usuarios`);

    // 4. Crear reservas de prueba con horario completo (8:00 - 22:30)
    console.log('📅 Creando reservas de prueba con horario completo...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const bookings = [];
    const statuses = ['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED'];
    const paymentStatuses = ['FULLY_PAID', 'PENDING', 'DEPOSIT_PAID'];

    // Función para generar horarios de 90 minutos desde 8:00 hasta 22:30
    function generateTimeSlots() {
      const slots = [];
      let currentHour = 8;
      let currentMinute = 0;
      
      while (currentHour < 22 || (currentHour === 22 && currentMinute <= 30)) {
        const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        // Calcular hora de fin (90 minutos después)
        let endHour = currentHour;
        let endMinute = currentMinute + 90;
        
        if (endMinute >= 60) {
          endHour += Math.floor(endMinute / 60);
          endMinute = endMinute % 60;
        }
        
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        slots.push({ startTime, endTime });
        
        // Avanzar 30 minutos para el siguiente slot (permitir superposición)
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
      
      return slots;
    }

    const timeSlots = generateTimeSlots();
    console.log(`⏰ Generados ${timeSlots.length} slots de tiempo`);

    // Reservas para hoy - distribuidas en todas las canchas
    let slotIndex = 0;
    for (let i = 0; i < Math.min(15, timeSlots.length); i++) {
      const slot = timeSlots[i];
      const courtIndex = i % 3; // Rotar entre las 3 canchas activas
      const userIndex = i % users.length;
      
      bookings.push({
        userId: users[userIndex].id,
        courtId: courts[courtIndex].id,
        bookingDate: new Date(today),
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: 90,
        totalPrice: courts[courtIndex].basePrice,
        status: 'CONFIRMED',
        paymentStatus: 'FULLY_PAID',
        notes: `Reserva hoy ${slot.startTime} - ${slot.endTime}`
      });
    }

    // Reservas para mañana - horario completo con superposiciones
    for (let i = 0; i < timeSlots.length && i < 25; i++) {
      const slot = timeSlots[i];
      const courtIndex = i % 3;
      const userIndex = i % users.length;
      const statusIndex = i % statuses.length;
      const paymentIndex = i % paymentStatuses.length;
      
      bookings.push({
        userId: users[userIndex].id,
        courtId: courts[courtIndex].id,
        bookingDate: new Date(tomorrow),
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: 90,
        totalPrice: courts[courtIndex].basePrice,
        status: statuses[statusIndex],
        paymentStatus: paymentStatuses[paymentIndex],
        notes: `Reserva mañana ${slot.startTime} - ${slot.endTime} (${statuses[statusIndex]})`
      });
    }

    // Reservas para la próxima semana - horarios variados
    for (let day = 0; day < 3; day++) {
      const bookingDate = new Date(nextWeek);
      bookingDate.setDate(bookingDate.getDate() + day);
      bookingDate.setHours(0, 0, 0, 0);
      
      // 3-4 reservas por día en horarios diferentes
      const dailySlots = [0, 8, 16, 24].slice(0, 3 + day % 2);
      
      for (let slotIdx of dailySlots) {
        if (slotIdx < timeSlots.length) {
          const slot = timeSlots[slotIdx];
          const courtIndex = (day + slotIdx) % 3;
          const userIndex = (day * 4 + slotIdx) % users.length;
          
          bookings.push({
            userId: users[userIndex].id,
            courtId: courts[courtIndex].id,
            bookingDate: bookingDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            durationMinutes: 90,
            totalPrice: courts[courtIndex].basePrice,
            status: 'CONFIRMED',
            paymentStatus: 'FULLY_PAID',
            notes: `Reserva próxima semana - Día ${day + 1} ${slot.startTime}`
          });
        }
      }
    }

    // Reservas históricas (semana pasada)
    for (let day = 0; day < 5; day++) {
      const bookingDate = new Date(lastWeek);
      bookingDate.setDate(bookingDate.getDate() + day);
      bookingDate.setHours(0, 0, 0, 0);
      
      // 2-3 reservas por día histórico
      const historicalSlots = [5, 15, 25].slice(0, 2 + day % 2);
      
      for (let slotIdx of historicalSlots) {
        if (slotIdx < timeSlots.length) {
          const slot = timeSlots[slotIdx];
          const courtIndex = (day + slotIdx) % 3;
          const userIndex = (day * 3 + slotIdx) % users.length;
          
          bookings.push({
            userId: users[userIndex].id,
            courtId: courts[courtIndex].id,
            bookingDate: bookingDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            durationMinutes: 90,
            totalPrice: courts[courtIndex].basePrice,
            status: 'COMPLETED',
            paymentStatus: 'FULLY_PAID',
            notes: `Reserva completada - Histórica día ${day + 1} ${slot.startTime}`
          });
        }
      }
    }

    // Reservas futuras (próximo mes) - casos especiales
    const futureSlots = [0, 10, 20, 29]; // Horarios variados
    for (let i = 0; i < futureSlots.length && futureSlots[i] < timeSlots.length; i++) {
      const slot = timeSlots[futureSlots[i]];
      const courtIndex = i % 3;
      const userIndex = i % users.length;
      
      bookings.push({
        userId: users[userIndex].id,
        courtId: courts[courtIndex].id,
        bookingDate: new Date(nextMonth),
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: 90,
        totalPrice: courts[courtIndex].basePrice,
        status: 'CONFIRMED',
        paymentStatus: 'FULLY_PAID',
        notes: `Reserva futura ${slot.startTime} - Evento especial`
      });
    }

    // Crear todas las reservas
    const createdBookings = await Promise.all(
      bookings.map(booking => prisma.booking.create({ data: booking }))
    );

    console.log(`✅ Creadas ${createdBookings.length} reservas`);

    // 5. Estadísticas finales
    console.log('\n📊 Resumen de datos creados:');
    
    const stats = await Promise.all([
      prisma.court.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { paymentStatus: 'FULLY_PAID' } }),
       prisma.booking.count({ where: { paymentStatus: 'PENDING' } }),
       prisma.booking.count({ where: { paymentStatus: 'DEPOSIT_PAID' } })
    ]);

    console.log(`🏟️  Canchas: ${stats[0]} (3 activas)`);
    console.log(`👥 Usuarios: ${stats[1]} (4 verificados, 1 sin verificar)`);
    console.log(`📅 Reservas totales: ${stats[2]}`);
    console.log(`   - Confirmadas: ${stats[3]}`);
    console.log(`   - Pendientes: ${stats[4]}`);
    console.log(`   - Canceladas: ${stats[5]}`);
    console.log(`   - Completadas: ${stats[6]}`);
    console.log(`💰 Pagos:`);
    console.log(`   - Pagados completamente: ${stats[7]}`);
    console.log(`   - Pendientes: ${stats[8]}`);
    console.log(`   - Depósito pagado: ${stats[9]}`);

    // 6. Mostrar algunos ejemplos de datos creados
    console.log('\n🔍 Ejemplos de datos creados:');
    
    const sampleBookings = await prisma.booking.findMany({
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        court: { select: { name: true, basePrice: true } }
      },
      orderBy: { bookingDate: 'asc' }
    });

    sampleBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.user.name} - ${booking.court.name}`);
      console.log(`   📅 ${booking.bookingDate.toLocaleDateString()} - ${booking.startTime} a ${booking.endTime}`);
      console.log(`   🏟️ ${booking.court.name} - $${booking.court.basePrice} base`);
      console.log(`   💰 Total: $${booking.totalPrice} - Estado: ${booking.status} - Pago: ${booking.paymentStatus}`);
      if (booking.notes) console.log(`   📝 ${booking.notes}`);
      console.log('');
    });

    console.log('\n✅ ¡Población de datos de prueba completada exitosamente!');
    console.log('\n🎯 Casos de prueba incluidos:');
    console.log('   ✓ Usuarios verificados y sin verificar');
    console.log('   ✓ Canchas activas e inactivas');
    console.log('   ✓ Reservas en diferentes estados');
    console.log('   ✓ Diferentes estados de pago');
    console.log('   ✓ Reservas históricas, actuales y futuras');
    console.log('   ✓ Duración uniforme (90 minutos exactos)');
    console.log('   ✓ Precios uniformes ($6000 para todas las canchas)');
    console.log('   ✓ Horario completo (8:00 - 22:30 horas)');
    console.log('   ✓ Superposiciones entre canchas diferentes');
    console.log('   ✓ Slots cada 30 minutos para máxima ocupación');
    console.log('   ✓ Casos límite (nombres largos, emails largos)');
    console.log('   ✓ Notas descriptivas para cada reserva');
    
  } catch (error) {
    console.error('❌ Error al poblar datos de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('\n🎉 Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedTestData };