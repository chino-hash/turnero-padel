import { NextRequest } from 'next/server'
import { addConnection, removeConnection, type SSEEvent } from '../../../lib/sse-events'
import { auth } from '../../../lib/auth'
import { getAuthConfig } from '../../../lib/config/env'
import { getUserTenantIdSafe, isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Endpoint GET para establecer conexión SSE
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
  }

  // Construir usuario para validación de permisos
  const user: PermissionsUser = {
    id: session.user.id,
    email: session.user.email || null,
    role: session.user.role || 'USER',
    isAdmin: session.user.isAdmin || false,
    isSuperAdmin: session.user.isSuperAdmin || false,
    tenantId: session.user.tenantId || null,
  }

  const isSuperAdmin = await isSuperAdminUser(user)
  const userTenantId = await getUserTenantIdSafe(user)
  // Configurar headers para SSE con mejores prácticas
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': getAuthConfig().url,
    'Access-Control-Allow-Headers': 'Cache-Control, Last-Event-ID',
    'Access-Control-Allow-Methods': 'GET',
    'X-Accel-Buffering': 'no', // Nginx: deshabilitar buffering
  })

  // Crear stream para mantener la conexión abierta
  const stream = new ReadableStream({
    start(controller) {
      try {
        // Enviar evento inicial de conexión con ID único
        const connectionId = Math.random().toString(36).substr(2, 9)
        controller.enqueue(new TextEncoder().encode(`id: ${connectionId}\n`))
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
          type: 'connection', 
          message: 'Conectado al servidor SSE',
          connectionId,
          timestamp: Date.now()
        })}\n\n`))
        
        // Heartbeat periódico para mantener viva la conexión
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: Date.now(),
              connectionId
            })}\n\n`))
          } catch (error) {
            clearInterval(heartbeatInterval)
          }
        }, 20000)
        
        // Agregar esta conexión a la lista de conexiones activas con información de tenant
        addConnection(controller, userTenantId, isSuperAdmin, session.user.id)
        
        // Limpiar al cerrar la conexión
        const cleanup = () => {
          clearInterval(heartbeatInterval)
          removeConnection(controller)
          console.log(`Conexión SSE cerrada: ${connectionId}`)
        }
        
        request.signal.addEventListener('abort', cleanup)
        
        // Cleanup adicional para casos edge
        setTimeout(() => {
          if (request.signal.aborted) {
            cleanup()
          }
        }, 100)
        
      } catch (error) {
        console.error('Error inicializando conexión SSE:', error)
        controller.error(error)
      }
    },
    
    cancel() {
      console.log('Stream SSE cancelado por el cliente')
    }
  })

  return new Response(stream, {
    headers: responseHeaders,
  })
}