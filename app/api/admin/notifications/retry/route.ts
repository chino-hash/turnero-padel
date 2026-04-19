import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/validations/common'
import { retryFailedTournamentCancellationNotifications } from '@/lib/services/notifications/TournamentCancellationNotificationService'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || (!session.user.isAdmin && !session.user.isSuperAdmin)) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const parsedLimit = Number(limitParam || 50)
    const limit = Number.isFinite(parsedLimit) ? Math.min(200, Math.max(1, parsedLimit)) : 50

    const result = await retryFailedTournamentCancellationNotifications(limit)
    return NextResponse.json(
      createSuccessResponse('Reintento de notificaciones ejecutado', result),
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/admin/notifications/retry', error)
    return NextResponse.json(
      createErrorResponse('No se pudo ejecutar el reintento de notificaciones'),
      { status: 500 }
    )
  }
}
