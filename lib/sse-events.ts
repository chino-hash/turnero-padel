// Interfaz para información de conexión SSE
interface SSEConnection {
  controller: ReadableStreamDefaultController
  tenantId: string | null
  isSuperAdmin: boolean
  userId: string
}

// Almacenar conexiones activas con información de tenant
const connections = new Map<ReadableStreamDefaultController, SSEConnection>()

// Tipos de eventos que se pueden emitir
export type EventType = 'courts_updated' | 'bookings_updated' | 'slots_updated' | 'admin_change' | 'heartbeat' | 'connection'

export interface SSEEvent {
  type: EventType
  data: any
  timestamp: number
  tenantId?: string | null // TenantId del evento (opcional para eventos globales)
}

// Función para emitir eventos a conexiones activas filtradas por tenantId
export function emitEvent(event: SSEEvent) {
  const message = `data: ${JSON.stringify(event)}\n\n`
  const eventTenantId = event.tenantId ?? null
  
  connections.forEach((conn, controller) => {
    try {
      // Super admin recibe todos los eventos
      // Usuarios normales solo reciben eventos de su tenant
      const shouldReceive = conn.isSuperAdmin || 
                          (eventTenantId !== null && conn.tenantId === eventTenantId) ||
                          (eventTenantId === null) // Eventos globales (sin tenantId)
      
      if (shouldReceive) {
        controller.enqueue(new TextEncoder().encode(message))
      }
    } catch (error) {
      // Remover conexiones cerradas
      connections.delete(controller)
    }
  })
}

// Función para agregar una nueva conexión con información de tenant
export function addConnection(
  controller: ReadableStreamDefaultController, 
  tenantId: string | null, 
  isSuperAdmin: boolean,
  userId: string
) {
  connections.set(controller, { controller, tenantId, isSuperAdmin, userId })
}

// Función para remover una conexión
export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller)
}

// Función helper para emitir eventos específicos con tenantId
export const eventEmitters = {
  courtsUpdated: (data: any, tenantId?: string | null) => emitEvent({
    type: 'courts_updated',
    data,
    timestamp: Date.now(),
    tenantId
  }),
  
  bookingsUpdated: (data: any, tenantId?: string | null) => emitEvent({
    type: 'bookings_updated', 
    data,
    timestamp: Date.now(),
    tenantId
  }),
  
  slotsUpdated: (data: any, tenantId?: string | null) => emitEvent({
    type: 'slots_updated',
    data,
    timestamp: Date.now(),
    tenantId
  }),
  
  adminChange: (data: any, tenantId?: string | null) => emitEvent({
    type: 'admin_change',
    data,
    timestamp: Date.now(),
    tenantId
  })
}