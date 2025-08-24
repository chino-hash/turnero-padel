import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { addConnection, removeConnection, type SSEEvent } from '@/lib/sse-events'

export async function GET(request: NextRequest) {
  // Verificar autenticación
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Configurar headers para SSE
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Crear stream para eventos de canchas
  let streamController: ReadableStreamDefaultController
  const stream = new ReadableStream({
    start(controller) {
      streamController = controller
      // Agregar conexión al set
      addConnection(controller)
      
      // Enviar evento inicial
      const initialEvent: SSEEvent = {
        type: 'courts_updated',
        data: { message: 'Conectado a eventos de canchas' },
        timestamp: Date.now()
      }
      
      const message = `data: ${JSON.stringify(initialEvent)}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
    },
    
    cancel() {
      // Limpiar conexión cuando se cancela
      removeConnection(streamController)
    }
  })

  return new Response(stream, { headers: responseHeaders })
}