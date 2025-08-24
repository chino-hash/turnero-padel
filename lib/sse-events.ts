// Almacenar conexiones activas
const connections = new Set<ReadableStreamDefaultController>()

// Tipos de eventos que se pueden emitir
export type EventType = 'courts_updated' | 'bookings_updated' | 'slots_updated' | 'admin_change' | 'heartbeat'

export interface SSEEvent {
  type: EventType
  data: any
  timestamp: number
}

// Función para emitir eventos a todas las conexiones activas
export function emitEvent(event: SSEEvent) {
  const message = `data: ${JSON.stringify(event)}\n\n`
  
  connections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch (error) {
      // Remover conexiones cerradas
      connections.delete(controller)
    }
  })
}

// Función para agregar una nueva conexión
export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller)
}

// Función para remover una conexión
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller)
}

// Función helper para emitir eventos específicos
export const eventEmitters = {
  courtsUpdated: (data: any) => emitEvent({
    type: 'courts_updated',
    data,
    timestamp: Date.now()
  }),
  
  bookingsUpdated: (data: any) => emitEvent({
    type: 'bookings_updated', 
    data,
    timestamp: Date.now()
  }),
  
  slotsUpdated: (data: any) => emitEvent({
    type: 'slots_updated',
    data,
    timestamp: Date.now()
  }),
  
  adminChange: (data: any) => emitEvent({
    type: 'admin_change',
    data,
    timestamp: Date.now()
  })
}