/**
 * Bootstrap idempotente de un tenant (sin depender de Next).
 *
 * Uso:
 *   node scripts/bootstrap-tenant.js prueba agustinlucero@soyastor.com "Club prueba"
 *
 * Requisitos:
 * - DATABASE_URL configurada
 * - (Opcional) CREDENTIAL_ENCRYPTION_KEY para encriptar credenciales MP si vienen desde env
 * - (Opcional) MERCADOPAGO_ACCESS_TOKEN / MERCADOPAGO_PUBLIC_KEY / MERCADOPAGO_WEBHOOK_SECRET
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

// Cargar variables de entorno desde .env/.env.local (Node no las carga automáticamente como Next)
try {
  require('dotenv').config({ path: '.env.local' })
} catch {}
try {
  require('dotenv').config({ path: '.env' })
} catch {}
// Fallback: si las credenciales estaban en la app antigua `turnero-padel/`
try {
  require('dotenv').config({ path: 'turnero-padel/.env.local' })
} catch {}
try {
  require('dotenv').config({ path: 'turnero-padel/.env' })
} catch {}

const prisma = new PrismaClient();

const DEFAULTS = {
  operatingStart: '08:00',
  operatingEnd: '23:00',
  slotDurationMinutes: 90,
  bookingExpirationMinutes: 15,
  basePrice: 24000,
};

function normalizeSlug(slug) {
  return String(slug || '').trim().toLowerCase();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getEncryptionKey() {
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) throw new Error('CREDENTIAL_ENCRYPTION_KEY no está configurada');
  if (!/^[0-9a-fA-F]{64}$/.test(key)) throw new Error('CREDENTIAL_ENCRYPTION_KEY debe ser hex de 64 chars');
  return Buffer.from(key, 'hex');
}

function encryptCredential(plaintext) {
  const ALGORITHM = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function looksEncrypted(value) {
  return typeof value === 'string' && value.includes(':') && value.split(':').length === 3;
}

function safeEncryptMaybe(plaintext) {
  try {
    return encryptCredential(plaintext);
  } catch (e) {
    console.warn('[bootstrap-tenant] No se pudo encriptar (se guarda en claro):', e.message || e);
    return String(plaintext);
  }
}

async function getMercadoPagoSource() {
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || null,
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || null,
    };
  }

  const def = await prisma.tenant.findUnique({
    where: { slug: 'default' },
    select: {
      mercadoPagoAccessToken: true,
      mercadoPagoPublicKey: true,
      mercadoPagoWebhookSecret: true,
    },
  });

  return {
    accessToken: def?.mercadoPagoAccessToken || null,
    publicKey: def?.mercadoPagoPublicKey ?? null,
    webhookSecret: def?.mercadoPagoWebhookSecret ?? null,
  };
}

async function main() {
  const slug = normalizeSlug(process.argv[2] || 'prueba');
  const ownerEmail = normalizeEmail(process.argv[3] || 'agustinlucero@soyastor.com');
  const name = String(process.argv[4] || `Club ${slug}`).trim();

  console.log('[bootstrap-tenant] Iniciando...', { slug, ownerEmail, name });

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  const createdTenant = !existingTenant;

  const tenant = existingTenant
    ? await prisma.tenant.update({
        where: { id: existingTenant.id },
        data: { isActive: true, name: existingTenant.name || name },
      })
    : await prisma.tenant.create({
        data: {
          name,
          slug,
          isActive: true,
          settings: JSON.stringify({ description: `Tenant bootstrap: ${slug}` }),
          mercadoPagoEnabled: false,
          mercadoPagoEnvironment: 'sandbox',
        },
      });

  const tenantId = tenant.id;

  // AdminWhitelist
  const wl = await prisma.adminWhitelist.findFirst({
    where: { tenantId, email: ownerEmail },
    select: { id: true, isActive: true },
  });
  if (!wl) {
    await prisma.adminWhitelist.create({
      data: { tenantId, email: ownerEmail, role: 'ADMIN', isActive: true, notes: 'Bootstrap tenant: owner admin' },
    });
  } else if (!wl.isActive) {
    await prisma.adminWhitelist.update({ where: { id: wl.id }, data: { isActive: true, role: 'ADMIN' } });
  }

  // System settings
  const systemSettings = [
    { key: 'operating_hours_start', value: DEFAULTS.operatingStart, description: 'Horario de apertura por defecto', category: 'booking', isPublic: true },
    { key: 'operating_hours_end', value: DEFAULTS.operatingEnd, description: 'Horario de cierre por defecto', category: 'booking', isPublic: true },
    { key: 'default_slot_duration', value: String(DEFAULTS.slotDurationMinutes), description: 'Duración de turno por defecto (minutos)', category: 'booking', isPublic: true },
    { key: 'booking_expiration_minutes', value: String(DEFAULTS.bookingExpirationMinutes), description: 'Tiempo límite para completar el pago (minutos)', category: 'payments', isPublic: false },
    { key: 'home_card_settings', value: JSON.stringify({
        labelCourtName: 'Canchas',
        locationName: name,
        mapUrl: '',
        sessionText: `${DEFAULTS.slotDurationMinutes} min por turno`,
        descriptionText: 'Visualiza la disponibilidad del día actual para las canchas. Selecciona una para ver sus horarios y características.',
        iconImage: ''
      }), description: 'Configuración de la tarjeta principal del home', category: 'ui', isPublic: true },
  ];

  for (const s of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key_tenantId: { key: s.key, tenantId } },
      create: { ...s, tenantId },
      update: { value: s.value, description: s.description, category: s.category, isPublic: s.isPublic },
    });
  }

  // Courts
  for (const n of [1, 2, 3]) {
    const nameCourt = `Cancha ${n}`;
    const existing = await prisma.court.findFirst({ where: { tenantId, name: nameCourt }, select: { id: true } });
    const data = {
      tenantId,
      name: nameCourt,
      description: nameCourt,
      basePrice: DEFAULTS.basePrice,
      priceMultiplier: 1.0,
      features: JSON.stringify([]),
      operatingHours: JSON.stringify({ start: DEFAULTS.operatingStart, end: DEFAULTS.operatingEnd, slot_duration: DEFAULTS.slotDurationMinutes }),
      isActive: true,
    };
    if (!existing) await prisma.court.create({ data });
    else await prisma.court.update({ where: { id: existing.id }, data });
  }

  // Productos mínimos
  const products = [
    { nombre: 'Pelota de Pádel', precio: 1500, stock: 50, categoria: 'pelotas', activo: true },
    { nombre: 'Grip', precio: 800, stock: 100, categoria: 'accesorios', activo: true },
    { nombre: 'Agua', precio: 1200, stock: 60, categoria: 'bebidas', activo: true },
    { nombre: 'Gaseosa', precio: 1800, stock: 40, categoria: 'bebidas', activo: true },
  ];
  for (const p of products) {
    const existing = await prisma.producto.findFirst({ where: { tenantId, nombre: p.nombre }, select: { id: true } });
    if (!existing) await prisma.producto.create({ data: { tenantId, ...p } });
    else await prisma.producto.update({ where: { id: existing.id }, data: { precio: p.precio, stock: p.stock, categoria: p.categoria, activo: p.activo } });
  }

  // Mercado Pago
  const mp = await getMercadoPagoSource();
  const updateMpData = { mercadoPagoEnabled: true, mercadoPagoEnvironment: 'sandbox' };

  if (!tenant.mercadoPagoAccessToken && mp.accessToken) {
    updateMpData.mercadoPagoAccessToken = looksEncrypted(mp.accessToken) ? mp.accessToken : safeEncryptMaybe(mp.accessToken);
  }
  if (!tenant.mercadoPagoPublicKey && mp.publicKey) {
    updateMpData.mercadoPagoPublicKey = looksEncrypted(mp.publicKey) ? mp.publicKey : safeEncryptMaybe(mp.publicKey);
  }
  if (!tenant.mercadoPagoWebhookSecret && mp.webhookSecret) {
    updateMpData.mercadoPagoWebhookSecret = looksEncrypted(mp.webhookSecret) ? mp.webhookSecret : safeEncryptMaybe(mp.webhookSecret);
  }

  await prisma.tenant.update({ where: { id: tenantId }, data: updateMpData });

  console.log('[bootstrap-tenant] OK', { tenantId, slug, createdTenant });
}

main()
  .catch((e) => {
    console.error('[bootstrap-tenant] ERROR', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

