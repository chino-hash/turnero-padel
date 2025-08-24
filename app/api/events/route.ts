import { NextRequest } from 'next/server'
import { addConnection, removeConnection, type SSEEvent } from '@/lib/sse-events'

// Endpoint GET para establecer conexión SSE
export async function GET(request: NextRequest) {
  // Configurar headers para SSE
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Crear stream para mantener la conexión abierta
  const stream = new ReadableStream({
    start(controller) {
      // Agregar conexión al set
      addConnection(controller)
      
      // Enviar evento inicial de conexión
      const initialEvent: SSEEvent = {
        type: 'admin_change',
        data: { message: 'Conectado al sistema de notificaciones en tiempo real' },
        timestamp: Date.now()
      }
      
      const message = `data: ${JSON.stringify(initialEvent)}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
      
      // Configurar heartbeat cada 30 segundos
      const heartbeat = setInterval(() => {
        try {
          const heartbeatEvent = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
          controller.enqueue(new TextEncoder().encode(heartbeatEvent))
        } catch (error) {
          clearInterval(heartbeat)
          removeConnection(controller)
        }
      }, 30000)
      
      // Limpiar cuando se cierre la conexión
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        removeConnection(controller)
        controller.close()
      })
    },
    
    cancel() {
      // Limpiar conexión cuando se cancele
    }
  })

  return new Response(stream, {
    headers: responseHeaders,
  })
}