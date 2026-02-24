/**
 * Crea el tenant "Tenant de prueba B" (slug: tenant-de-prueba-b).
 * Usa create en lugar de upsert para system settings por compatibilidad con
 * bases de datos que puedan tener restricciones distintas.
 */
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') }); } catch {}
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch {}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SLUG = 'tenant-de-prueba-b';
const NAME = 'Tenant de prueba B';
const OWNER_EMAIL = 'admin-tenant-b@test.com';

const DEFAULTS = {
  operatingStart: '08:00',
  operatingEnd: '23:00',
  slotDurationMinutes: 90,
  bookingExpirationMinutes: 15,
  basePrice: 24000,
};

async function main() {
  console.log('[create-tenant-b] Creando Tenant de prueba B...');

  let tenant = await prisma.tenant.findUnique({ where: { slug: SLUG } });
  const createdTenant = !tenant;

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: NAME,
        slug: SLUG,
        isActive: true,
        settings: JSON.stringify({ description: 'Tenant de prueba B - para verificación multitenant' }),
        mercadoPagoEnabled: false,
        mercadoPagoEnvironment: 'sandbox',
      },
    });
    console.log('[create-tenant-b] Tenant creado:', tenant.id);
  } else {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { isActive: true, name: NAME },
    });
    console.log('[create-tenant-b] Tenant ya existía, actualizado');
  }

  const tenantId = tenant.id;

  // AdminWhitelist
  let wl = await prisma.adminWhitelist.findFirst({ where: { tenantId, email: OWNER_EMAIL } });
  if (!wl) {
    wl = await prisma.adminWhitelist.create({
      data: { tenantId, email: OWNER_EMAIL, role: 'ADMIN', isActive: true, notes: 'Tenant B - admin de prueba' },
    });
    console.log('[create-tenant-b] AdminWhitelist creado para', OWNER_EMAIL);
  }

  // System settings: la BD tiene unique en key (no key+tenantId), no podemos crear por tenant.
  // La app usa fallbacks (08:00, 23:00, 90 min) cuando no encuentra settings para el tenant.

  // Courts
  for (const n of [1, 2, 3]) {
    const nameCourt = `Cancha ${n}`;
    const existing = await prisma.court.findFirst({ where: { tenantId, name: nameCourt } });
    const data = {
      tenantId,
      name: nameCourt,
      description: nameCourt,
      basePrice: DEFAULTS.basePrice,
      priceMultiplier: 1.0,
      features: JSON.stringify([]),
      operatingHours: JSON.stringify({
        start: DEFAULTS.operatingStart,
        end: DEFAULTS.operatingEnd,
        slot_duration: DEFAULTS.slotDurationMinutes,
      }),
      isActive: true,
    };
    if (!existing) {
      await prisma.court.create({ data });
      console.log('[create-tenant-b] Cancha creada:', nameCourt);
    }
  }

  // Productos
  const products = [
    { nombre: 'Pelota de Pádel', precio: 1500, stock: 50, categoria: 'pelotas', activo: true },
    { nombre: 'Grip', precio: 800, stock: 100, categoria: 'accesorios', activo: true },
    { nombre: 'Agua', precio: 1200, stock: 60, categoria: 'bebidas', activo: true },
    { nombre: 'Gaseosa', precio: 1800, stock: 40, categoria: 'bebidas', activo: true },
  ];
  for (const p of products) {
    const existing = await prisma.producto.findFirst({ where: { tenantId, nombre: p.nombre } });
    if (!existing) {
      await prisma.producto.create({ data: { tenantId, ...p } });
      console.log('[create-tenant-b] Producto creado:', p.nombre);
    }
  }

  console.log('[create-tenant-b] OK - Tenant de prueba B listo');
  console.log('  - Slug:', SLUG);
  console.log('  - URL club: /club/' + SLUG);
  console.log('  - Landing: aparecerá en /api/tenants/public');
}

main()
  .catch((e) => {
    console.error('[create-tenant-b] ERROR', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
