/**
 * POST /api/bookings/migrate-deposit-paid-player1
 * Migración opcional: para cada reserva con paymentStatus = DEPOSIT_PAID que no tenga
 * jugador en posición 1 con hasPaid = true, crea o actualiza ese jugador (titular) como pagado.
 * Solo Super Admin. Idempotente.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'

export async function POST(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Se requieren permisos de Super Administrador' },
        { status: 403 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: { paymentStatus: 'DEPOSIT_PAID' },
      select: {
        id: true,
        totalPrice: true,
        depositAmount: true,
        user: { select: { name: true } },
      },
    })

    let updated = 0
    let created = 0
    const errors: string[] = []

    for (const booking of bookings) {
      const player1 = await prisma.bookingPlayer.findFirst({
        where: { bookingId: booking.id, position: 1 },
      })

      const paidAmountCents =
        (booking.depositAmount ?? 0) > 0
          ? booking.depositAmount!
          : Math.round((booking.totalPrice ?? 0) / 4)
      const titularName = booking.user?.name ?? 'Titular'

      if (player1) {
        if (player1.hasPaid) continue
        try {
          await prisma.bookingPlayer.update({
            where: { id: player1.id },
            data: { hasPaid: true, paidAmount: paidAmountCents, updatedAt: new Date() },
          })
          updated++
        } catch (e) {
          errors.push(`${booking.id}: ${e instanceof Error ? e.message : String(e)}`)
        }
      } else {
        try {
          await prisma.bookingPlayer.create({
            data: {
              bookingId: booking.id,
              position: 1,
              playerName: titularName,
              hasPaid: true,
              paidAmount: paidAmountCents,
            },
          })
          created++
        } catch (e) {
          errors.push(`${booking.id}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalDepositPaid: bookings.length,
        updated,
        created,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/bookings/migrate-deposit-paid-player1:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
