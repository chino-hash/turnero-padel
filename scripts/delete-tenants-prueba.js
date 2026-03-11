/**
 * Elimina los tenants de prueba (tenant-de-prueba y tenant-de-prueba-b) y todos sus datos.
 * Uso: node scripts/delete-tenants-prueba.js
 */

const path = require('path')
const { PrismaClient } = require('@prisma/client')

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
} catch {}
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
} catch {}

const prisma = new PrismaClient()

const SLUGS_TO_DELETE = ['tenant-de-prueba', 'tenant-de-prueba-b']

async function deleteTenant(tenantId) {
  // Orden de borrado para respetar FKs
  const bookingIds = (await prisma.booking.findMany({ where: { tenantId }, select: { id: true } })).map((b) => b.id)
  const courtIds = (await prisma.court.findMany({ where: { tenantId }, select: { id: true } })).map((c) => c.id)
  const tournamentIds = (await prisma.tournament.findMany({ where: { tenantId }, select: { id: true } })).map((t) => t.id)
  const userIds = (await prisma.user.findMany({ where: { tenantId }, select: { id: true } })).map((u) => u.id)

  if (bookingIds.length) {
    await prisma.bookingExtra.deleteMany({ where: { bookingId: { in: bookingIds } } })
    await prisma.bookingPlayer.deleteMany({ where: { bookingId: { in: bookingIds } } })
  }
  await prisma.payment.deleteMany({ where: { tenantId } })
  await prisma.recurringBookingException.deleteMany({
    where: { recurringBooking: { tenantId } },
  })
  await prisma.recurringBooking.deleteMany({ where: { tenantId } })
  await prisma.booking.deleteMany({ where: { tenantId } })
  if (courtIds.length) {
    await prisma.courtBlock.deleteMany({ where: { courtId: { in: courtIds } } })
  }
  if (tournamentIds.length) {
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: { in: tournamentIds } } })
  }
  await prisma.consumible.deleteMany({ where: { tenantId } })
  await prisma.court.deleteMany({ where: { tenantId } })
  await prisma.tournament.deleteMany({ where: { tenantId } })
  await prisma.producto.deleteMany({ where: { tenantId } })
  await prisma.systemSetting.deleteMany({ where: { tenantId } })
  await prisma.adminWhitelist.deleteMany({ where: { tenantId } })
  await prisma.venta.deleteMany({ where: { tenantId } })
  if (userIds.length) {
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } })
  }
  await prisma.user.deleteMany({ where: { tenantId } })
  await prisma.tenant.delete({ where: { id: tenantId } })
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { slug: { in: SLUGS_TO_DELETE } },
    select: { id: true, slug: true, name: true },
  })
  if (tenants.length === 0) {
    console.log('No se encontraron tenants con slug tenant-de-prueba o tenant-de-prueba-b.')
    return
  }
  console.log('Se eliminarán los siguientes tenants:', tenants.map((t) => ({ slug: t.slug, name: t.name })))
  for (const t of tenants) {
    await prisma.$transaction(async (tx) => {
      const bookingIds = (await tx.booking.findMany({ where: { tenantId: t.id }, select: { id: true } })).map((b) => b.id)
      const courtIds = (await tx.court.findMany({ where: { tenantId: t.id }, select: { id: true } })).map((c) => c.id)
      const tournamentIds = (await tx.tournament.findMany({ where: { tenantId: t.id }, select: { id: true } })).map((x) => x.id)
      const userIds = (await tx.user.findMany({ where: { tenantId: t.id }, select: { id: true } })).map((u) => u.id)

      if (bookingIds.length) {
        await tx.bookingExtra.deleteMany({ where: { bookingId: { in: bookingIds } } })
        await tx.bookingPlayer.deleteMany({ where: { bookingId: { in: bookingIds } } })
      }
      await tx.payment.deleteMany({ where: { tenantId: t.id } })
      await tx.recurringBookingException.deleteMany({ where: { recurring: { tenantId: t.id } } })
      await tx.recurringBooking.deleteMany({ where: { tenantId: t.id } })
      await tx.booking.deleteMany({ where: { tenantId: t.id } })
      if (courtIds.length) await tx.courtBlock.deleteMany({ where: { courtId: { in: courtIds } } })
      if (tournamentIds.length) {
        await tx.tournamentMatch.deleteMany({ where: { tournamentId: { in: tournamentIds } } })
        await tx.tournamentRegistration.deleteMany({ where: { tournamentId: { in: tournamentIds } } })
        await tx.tournamentSchedule.deleteMany({ where: { tournamentId: { in: tournamentIds } } })
      }
      await tx.consumible.deleteMany({ where: { tenantId: t.id } })
      await tx.court.deleteMany({ where: { tenantId: t.id } })
      await tx.tournament.deleteMany({ where: { tenantId: t.id } })
      await tx.producto.deleteMany({ where: { tenantId: t.id } })
      await tx.systemSetting.deleteMany({ where: { tenantId: t.id } })
      await tx.adminWhitelist.deleteMany({ where: { tenantId: t.id } })
      await tx.venta.deleteMany({ where: { tenantId: t.id } })
      if (userIds.length) {
        await tx.session.deleteMany({ where: { userId: { in: userIds } } })
        await tx.account.deleteMany({ where: { userId: { in: userIds } } })
      }
      await tx.user.deleteMany({ where: { tenantId: t.id } })
      await tx.tenant.delete({ where: { id: t.id } })
    })
    console.log('Eliminado:', t.slug, t.name)
  }
  console.log('Listo.')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
