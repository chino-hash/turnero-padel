/**
 * Pobla el tenant por defecto (slug 'default') con datos para visualizar
 * la sección de Estadísticas: reservas, ingresos, canchas, horarios pico, etc.
 *
 * Uso: node scripts/seed-estadisticas-default-tenant.js
 *
 * Requisitos: DATABASE_URL en .env o .env.local
 */

const path = require('path');
const { PrismaClient } = require('@prisma/client');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
} catch {}
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {}

const prisma = new PrismaClient();

const SLUG_DEFAULT = 'default';
const OPERATING_HOURS = JSON.stringify({
  start: '08:00',
  end: '23:00',
  slot_duration: 90,
});

function addDays(d, days) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function startOfDay(d) {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

async function seedEstadisticasDefaultTenant() {
  console.log('🌱 Poblando tenant por defecto para Estadísticas...\n');

  let tenant = await prisma.tenant.findUnique({
    where: { slug: SLUG_DEFAULT },
  });

  if (!tenant) {
    console.log('📌 Creando tenant con slug "default"...');
    tenant = await prisma.tenant.create({
      data: {
        name: 'Club Default',
        slug: SLUG_DEFAULT,
        isActive: true,
        settings: JSON.stringify({}),
      },
    });
    console.log('   OK:', tenant.id);
  } else {
    console.log('📌 Tenant por defecto encontrado:', tenant.id, tenant.name);
  }

  const tenantId = tenant.id;

  // Canchas
  const courtNames = ['Cancha 1 - Premium', 'Cancha 2 - Estándar', 'Cancha 3 - Económica'];
  const courts = [];
  for (const name of courtNames) {
    let court = await prisma.court.findFirst({
      where: { tenantId, name },
    });
    if (!court) {
      court = await prisma.court.create({
        data: {
          tenantId,
          name,
          description: `Cancha ${name}`,
          basePrice: 8000,
          priceMultiplier: 1,
          features: JSON.stringify({ color: '#8b5cf6', bgColor: '#a78bfa', textColor: '#ffffff' }),
          operatingHours: OPERATING_HOURS,
          isActive: true,
        },
      });
      console.log('   Cancha creada:', court.name);
    }
    courts.push(court);
  }
  console.log('✅ Canchas:', courts.length);

  // Usuarios (1 admin para poder entrar al panel, varios usuarios para reservas)
  const usersData = [
    { email: 'admin@default.com', name: 'Admin Default', role: 'ADMIN' },
    { email: 'juan@default.com', name: 'Juan Pérez', role: 'USER' },
    { email: 'maria@default.com', name: 'María González', role: 'USER' },
    { email: 'carlos@default.com', name: 'Carlos López', role: 'USER' },
    { email: 'ana@default.com', name: 'Ana Martínez', role: 'USER' },
    { email: 'pedro@default.com', name: 'Pedro Sánchez', role: 'USER' },
  ];
  const users = [];
  for (const u of usersData) {
    let user = await prisma.user.findFirst({
      where: { tenantId, email: u.email },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: true,
        },
      });
      console.log('   Usuario creado:', user.email);
    }
    users.push(user);
  }
  console.log('✅ Usuarios:', users.length);

  // Horarios de 90 min para generar reservas (variedad para "horarios pico")
  const timeSlots = [
    '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30',
  ];

  const today = startOfDay(new Date());
  const existingBookings = await prisma.booking.count({
    where: { tenantId, bookingDate: { gte: addDays(today, -35) } },
  });

  if (existingBookings > 50) {
    console.log('\n📊 Ya existen muchas reservas para este tenant. No se agregan más.');
    console.log('   Para regenerar desde cero, borra reservas y pagos del tenant y vuelve a ejecutar.\n');
    return;
  }

  console.log('\n📅 Creando reservas para los últimos 30 días (y hoy)...');

  const bookingsToCreate = [];
  let bookingDate = addDays(today, -30);

  // endTime = startTime + 90 min
  function add90Min(startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + 90;
    const eh = Math.floor(totalMin / 60);
    const em = totalMin % 60;
    return `${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
  }

  while (bookingDate <= today) {
    const dayOfWeek = bookingDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const slotsPerDay = isWeekend ? 6 : 10;

    for (let i = 0; i < slotsPerDay; i++) {
      const courtIndex = i % courts.length;
      const userIndex = i % users.length;
      const timeIndex = i % timeSlots.length;
      const startTime = timeSlots[timeIndex];
      const endTime = add90Min(startTime);
      if (endTime >= '23:00') continue;

      const statuses = ['COMPLETED', 'COMPLETED', 'CONFIRMED', 'CONFIRMED', 'PENDING', 'CANCELLED'];
      const paymentStatuses = ['FULLY_PAID', 'FULLY_PAID', 'DEPOSIT_PAID', 'PENDING'];
      const status = bookingDate < today ? statuses[i % statuses.length] : (i % 3 === 0 ? 'CONFIRMED' : 'PENDING');
      const paymentStatus = status === 'CANCELLED' ? 'PENDING' : paymentStatuses[i % paymentStatuses.length];

      const court = courts[courtIndex];
      const totalPrice = Math.round(court.basePrice * (0.9 + Math.random() * 0.3));

      bookingsToCreate.push({
        tenantId,
        courtId: court.id,
        userId: users[userIndex].id,
        bookingDate: new Date(bookingDate),
        startTime,
        endTime,
        durationMinutes: 90,
        totalPrice,
        depositAmount: 0,
        status,
        paymentStatus,
        paymentMethod: 'CASH',
      });
    }
    bookingDate = addDays(bookingDate, 1);
  }

  let created = 0;
  for (const b of bookingsToCreate) {
    try {
      await prisma.booking.create({ data: b });
      created++;
    } catch (e) {
      if (e.code !== 'P2002') throw e;
    }
  }
  console.log('✅ Reservas creadas/ya existentes en rango:', created, 'de', bookingsToCreate.length);

  // Pagos (Payment) para que "Total recaudado" tenga valor
  const paidBookings = await prisma.booking.findMany({
    where: {
      tenantId,
      bookingDate: { gte: addDays(today, -30) },
      paymentStatus: { in: ['FULLY_PAID', 'DEPOSIT_PAID'] },
      status: { not: 'CANCELLED' },
    },
    take: 80,
  });

  const existingPayments = await prisma.payment.count({
    where: { tenantId, paymentType: 'PAYMENT' },
  });

  if (existingPayments < 20) {
    const adminUser = users.find((u) => u.role === 'ADMIN') || users[0];
    let paymentsCreated = 0;
    for (const booking of paidBookings.slice(0, 40)) {
      const existing = await prisma.payment.findFirst({
        where: { bookingId: booking.id, paymentType: 'PAYMENT' },
      });
      if (!existing) {
        await prisma.payment.create({
          data: {
            tenantId,
            bookingId: booking.id,
            amount: booking.totalPrice,
            paymentMethod: 'CASH',
            paymentType: 'PAYMENT',
            status: 'COMPLETED',
            processedById: adminUser.id,
          },
        });
        paymentsCreated++;
      }
    }
    console.log('✅ Pagos creados:', paymentsCreated);
  } else {
    console.log('✅ Pagos ya existentes para el tenant');
  }

  const totalBookings = await prisma.booking.count({
    where: { tenantId, deletedAt: null },
  });
  const totalPayments = await prisma.payment.count({
    where: {
      tenantId,
      paymentType: 'PAYMENT',
      status: { in: ['COMPLETED', 'completed'] },
    },
  });

  console.log('\n📊 Resumen tenant por defecto:');
  console.log('   Tenant:', tenant.name, '(' + tenant.slug + ')');
  console.log('   Canchas:', courts.length);
  console.log('   Usuarios:', users.length);
  console.log('   Reservas totales:', totalBookings);
  console.log('   Pagos completados:', totalPayments);
  console.log('\n✅ Listo. Entra al admin con un usuario de este tenant y abre Estadísticas.');
  console.log('   (Asegúrate de tener el tenant "default" seleccionado en sesión.)\n');
}

seedEstadisticasDefaultTenant()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
