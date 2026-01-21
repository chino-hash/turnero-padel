/**
 * Inspecciona un tenant sin imprimir secretos.
 *
 * Uso:
 *   node scripts/inspect-tenant.js prueba
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function looksEncrypted(v) {
  if (!v) return false
  const parts = String(v).split(':')
  return parts.length === 3
}

async function main() {
  const slug = String(process.argv[2] || '').trim().toLowerCase()
  if (!slug) {
    console.error('Uso: node scripts/inspect-tenant.js <slug>')
    process.exitCode = 1
    return
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      mercadoPagoEnabled: true,
      mercadoPagoEnvironment: true,
      mercadoPagoAccessToken: true,
      mercadoPagoPublicKey: true,
      mercadoPagoWebhookSecret: true,
      _count: {
        select: {
          courts: true,
          products: true,
          systemSettings: true,
          users: true,
          admins: true,
        },
      },
    },
  })

  if (!tenant) {
    console.log({ found: false, slug })
    return
  }

  console.log({
    found: true,
    tenantId: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    isActive: tenant.isActive,
    counts: tenant._count,
    mercadoPago: {
      enabled: tenant.mercadoPagoEnabled,
      env: tenant.mercadoPagoEnvironment,
      hasAccessToken: Boolean(tenant.mercadoPagoAccessToken),
      accessTokenLooksEncrypted: looksEncrypted(tenant.mercadoPagoAccessToken),
      hasPublicKey: Boolean(tenant.mercadoPagoPublicKey),
      publicKeyLooksEncrypted: looksEncrypted(tenant.mercadoPagoPublicKey),
      hasWebhookSecret: Boolean(tenant.mercadoPagoWebhookSecret),
      webhookSecretLooksEncrypted: looksEncrypted(tenant.mercadoPagoWebhookSecret),
    },
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

