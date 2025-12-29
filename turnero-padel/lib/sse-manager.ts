// Singleton SSE Manager para centralizar la conexión EventSource
// Esto evita múltiples conexiones simultáneas desde diferentes hooks

import { SSEEvent } from './sse-events'

type EventHandler = (data: any) => void
type ConnectionHandler = () => void
type ErrorHandler = (error: Event) => void

interface Subscription {
  id: string
  onCourtsUpdated?: EventHandler
  onBookingsUpdated?: EventHandler
  onSlotsUpdated?: EventHandler
  onAdminChange?: EventHandler
  onConnect?: ConnectionHandler
  onDisconnect?: ConnectionHandler
  onError?: ErrorHandler
}

class SSEManager {
  private eventSource: EventSource | null = null
  private subscriptions = new Map<string, Subscription>()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 10
  private readonly baseReconnectDelay = 1000
  private connectionId = 0

  private constructor() {
    // Singleton - solo se puede instanciar una vez
  }

  private static instance: SSEManager | null = null

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager()
    }
    return SSEManager.instance
  }

  private connect() {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      console.log('[SSE Manager] EventSource no disponible en este entorno')
      return
    }

    // Evitar múltiples conexiones simultáneas
    if (this.eventSource?.readyState === EventSource.CONNECTING) {
      console.debug('[SSE Manager] Conexión ya en progreso')
      return
    }

    // Si ya hay una conexión abierta, no crear otra
    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.debug('[SSE Manager] Ya hay una conexión abierta')
      return
    }

    // Cerrar conexión anterior si existe
    if (this.eventSource) {
      try {
        this.eventSource.close()
      } catch (e) {
        // Ignorar errores al cerrar
      }
      this.eventSource = null
    }

    // Limpiar timeout de reconexión
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    try {
      console.log('[SSE Manager] Estableciendo conexión SSE...')
      
      const eventSource = new EventSource('/api/events', {
        withCredentials: false
      })
      
      this.eventSource = eventSource
      this.connectionId++

      eventSource.onopen = () => {
        console.log('[SSE Manager] Conexión SSE establecida exitosamente')
        this.reconnectAttempts = 0
        
        // Notificar a todos los suscriptores
        this.subscriptions.forEach((sub) => {
          sub.onConnect?.()
        })
      }

      eventSource.onmessage = (event) => {
        try {
          const sseEvent: SSEEvent = JSON.parse(event.data)
          
          // Ignorar eventos de heartbeat
          if (sseEvent.type === 'heartbeat') {
            return
          }

          // Ignorar eventos de conexión (solo para logging)
          if (sseEvent.type === 'connection') {
            console.debug('[SSE Manager] Evento de conexión recibido')
            return
          }

          console.debug('[SSE Manager] Evento SSE recibido:', sseEvent.type)
          
          // Distribuir eventos a todos los suscriptores
          this.subscriptions.forEach((sub) => {
            try {
              switch (sseEvent.type) {
                case 'courts_updated':
                  sub.onCourtsUpdated?.(sseEvent.data)
                  break
                case 'bookings_updated':
                  sub.onBookingsUpdated?.(sseEvent.data)
                  break
                case 'slots_updated':
                  sub.onSlotsUpdated?.(sseEvent.data)
                  break
                case 'admin_change':
                  sub.onAdminChange?.(sseEvent.data)
                  break
              }
            } catch (error) {
              console.error(`[SSE Manager] Error en handler del suscriptor ${sub.id}:`, error)
            }
          })
        } catch (error) {
          console.error('[SSE Manager] Error al parsear evento SSE:', error)
        }
      }

      eventSource.onerror = (error) => {
        const state = eventSource.readyState
        
        if (state === EventSource.CONNECTING) {
          // Durante la fase de conexión, algunos navegadores disparan errores transitorios
          // No los reportamos como errores críticos
          console.debug('[SSE Manager] SSE aún conectando (error transitorio)')
          return
        }

        // Solo reportar errores si la conexión está cerrada o hay un problema real
        if (state === EventSource.CLOSED) {
          // Esto puede ser normal durante reconexión o cuando el servidor se reinicia
          console.warn('[SSE Manager] Conexión SSE cerrada, intentando reconectar...')
        } else {
          console.error('[SSE Manager] Error en conexión SSE:', error, 'ReadyState:', state)
        }

        // Notificar errores a los suscriptores
        this.subscriptions.forEach((sub) => {
          sub.onError?.(error)
        })

        // Manejar reconexión
        if (this.reconnectTimeout) {
          return // Ya hay una reconexión programada
        }

        const shouldReconnect = state !== EventSource.OPEN
        
        if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(
            this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
            30000
          )
          
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++
            this.reconnectTimeout = null
            try {
              eventSource.close()
            } catch (e) {
              // Ignorar errores al cerrar
            }
            this.connect()
          }, delay)
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[SSE Manager] Máximo de intentos de reconexión alcanzado')
          this.eventSource = null
          
          // Notificar desconexión a todos los suscriptores
          this.subscriptions.forEach((sub) => {
            sub.onDisconnect?.()
          })
        }
      }

    } catch (error) {
      console.error('[SSE Manager] Error al crear EventSource:', error)
      
      // Notificar errores a los suscriptores
      this.subscriptions.forEach((sub) => {
        sub.onError?.(error as Event)
      })
    }
  }

  subscribe(subscription: Omit<Subscription, 'id'>): () => void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.subscriptions.set(id, { ...subscription, id })

    // Si no hay conexión y tenemos suscriptores, conectar
    if (!this.eventSource || this.eventSource.readyState !== EventSource.OPEN) {
      this.connect()
    }

    // Retornar función para cancelar suscripción
    return () => {
      this.subscriptions.delete(id)
      
      // Si no hay más suscriptores, desconectar
      if (this.subscriptions.size === 0) {
        this.disconnect()
      }
    }
  }

  private disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.eventSource) {
      try {
        this.eventSource.close()
      } catch (e) {
        // Ignorar errores al cerrar
      }
      this.eventSource = null
    }

    this.reconnectAttempts = 0
    console.log('[SSE Manager] Conexión SSE cerrada')
  }

  getConnectionState(): 'connecting' | 'open' | 'closed' | null {
    if (!this.eventSource) return null
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING:
        return 'connecting'
      case EventSource.OPEN:
        return 'open'
      case EventSource.CLOSED:
        return 'closed'
      default:
        return null
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

export const sseManager = SSEManager.getInstance()











