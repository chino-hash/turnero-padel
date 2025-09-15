import { NextRequest } from 'next/server'
import { addConnection, removeConnection, type SSEEvent } from '../../../lib/sse-events'

// Endpoint GET para establecer conexión SSE
export async function GET(request: NextRequest) {
  // Configurar headers para SSE con mejores prácticas
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
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
        
        // Configurar heartbeat cada 25 segundos (menor que timeout típico de 30s)
        const heartbeatInterval = setInterval(() => {
          try {
            if (!controller.desiredSize || controller.desiredSize <= 0) {
              console.log('Cliente desconectado, limpiando heartbeat')
              clearInterval(heartbeatInterval)
              return
            }
            
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: Date.now(),
              connectionId
            })}\n\n`))
          } catch (error) {
            console.error('Error enviando heartbeat:', error)
            clearInterval(heartbeatInterval)
          }
        }, 25000)
        
        // Agregar esta conexión a la lista de conexiones activas
        addConnection(controller)
        
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