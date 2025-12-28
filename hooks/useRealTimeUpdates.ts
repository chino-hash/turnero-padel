'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { EventType, SSEEvent } from '../lib/sse-events'

interface UseRealTimeUpdatesOptions {
  onCourtsUpdated?: (data: any) => void
  onBookingsUpdated?: (data: any) => void
  onSlotsUpdated?: (data: any) => void
  onAdminChange?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  enabled?: boolean // Permite deshabilitar la conexión
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const { data: session, status } = useSession()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000
  const isAuthenticated = status === 'authenticated' && !!session?.user?.id
  const enabled = options.enabled !== false // Por defecto true, a menos que se especifique false
  
  // Usar refs para que las variables estén disponibles en los callbacks
  const isAuthenticatedRef = useRef(isAuthenticated)
  const enabledRef = useRef(enabled)
  
  // Actualizar refs cuando cambian los valores
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated
    enabledRef.current = enabled
  }, [isAuthenticated, enabled])

  const connect = useCallback(() => {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      console.log('EventSource no disponible en este entorno')
      return
    }

    // No conectar si no está autenticado o está deshabilitado
    if (!enabledRef.current || !isAuthenticatedRef.current) {
      console.log('SSE no conectado: usuario no autenticado o conexión deshabilitada')
      return
    }

    // Evitar múltiples conexiones simultáneas
    if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CONNECTING) {
      console.log('Conexión SSE ya en progreso, evitando duplicado')
      return
    }

    // Limpiar conexión anterior si existe
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    try {
      console.log('Estableciendo conexión SSE...')
      
      // Crear EventSource - las cookies se envían automáticamente en el mismo dominio
      const eventSource = new EventSource('/api/events')
      eventSourceRef.current = eventSource
      
      eventSource.onopen = () => {
        console.log('Conexión SSE establecida exitosamente')
        reconnectAttemptsRef.current = 0 // Reset contador de reintentos
        options.onConnect?.()
      }

        eventSource.onmessage = (event) => {
          try {
            const sseEvent: SSEEvent = JSON.parse(event.data)
            
            // Ignorar eventos de heartbeat
            if (sseEvent.type === 'heartbeat') {
              return
            }

            console.log('Evento SSE recibido:', sseEvent)
            
            // Manejar diferentes tipos de eventos
            switch (sseEvent.type) {
              case 'courts_updated':
                options.onCourtsUpdated?.(sseEvent.data)
                break
              case 'bookings_updated':
                options.onBookingsUpdated?.(sseEvent.data)
                break
              case 'slots_updated':
                options.onSlotsUpdated?.(sseEvent.data)
                break
              case 'admin_change':
                options.onAdminChange?.(sseEvent.data)
                break
              default:
                console.log('Tipo de evento desconocido:', sseEvent.type)
            }
          } catch (error) {
            console.error('Error al parsear evento SSE:', error)
          }
        }

        eventSource.onerror = (error) => {
          const state = eventSource.readyState
          if (state === EventSource.CONNECTING) {
            // Durante la fase de conexión algunos navegadores disparan error; no contaminar consola
            console.debug('SSE aún conectando, ignorando error transitorio')
          } else if (state === EventSource.CLOSED) {
            // Si el estado es CLOSED, podría ser un 401 (no autenticado)
            // No intentar reconectar si no está autenticado
            if (!isAuthenticatedRef.current) {
              console.log('Conexión SSE cerrada: usuario no autenticado')
              eventSourceRef.current = null
              return
            }
            console.error('Error en conexión SSE:', error, 'ReadyState:', state)
            options.onError?.(error)
          } else {
            console.error('Error en conexión SSE:', error, 'ReadyState:', state)
            options.onError?.(error)
          }

          if (reconnectTimeoutRef.current) return

          // No intentar reconectar si no está autenticado
          if (!isAuthenticatedRef.current) {
            eventSourceRef.current = null
            options.onDisconnect?.()
            return
          }

          const shouldReconnect = state !== EventSource.OPEN
          if (shouldReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000)
            reconnectTimeoutRef.current = setTimeout(() => {
              // Verificar nuevamente la autenticación antes de reconectar
              if (!isAuthenticatedRef.current) {
                eventSourceRef.current = null
                options.onDisconnect?.()
                return
              }
              reconnectAttemptsRef.current++
              try {
                eventSource.close()
              } catch {}
              connect()
            }, delay)
          } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            eventSourceRef.current = null
            options.onDisconnect?.()
          }
        }

    } catch (error) {
      console.error('Error al crear EventSource:', error)
      options.onError?.(error as Event)
    }
  }, [options])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      console.log('Conexión SSE cerrada')
      options.onDisconnect?.()
    }
  }, [options])

  // Conectar al montar el componente o cuando cambia la autenticación
  useEffect(() => {
    // Solo conectar si estamos en el navegador, está habilitado y autenticado
    if (typeof window !== 'undefined' && enabled && isAuthenticated) {
      connect()
    } else {
      // Desconectar si no está autenticado o está deshabilitado
      disconnect()
    }

    // Limpiar al desmontar
    return () => {
      disconnect()
    }
  }, [connect, disconnect, enabled, isAuthenticated])

  // Manejar visibilidad de la página para reconectar cuando sea necesario
  useEffect(() => {
    // Solo agregar listeners si estamos en el navegador
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !eventSourceRef.current && enabledRef.current && isAuthenticatedRef.current) {
        connect()
      } else if (document.visibilityState === 'hidden') {
        disconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connect, disconnect, enabled, isAuthenticated])

  return {
    connect,
    disconnect,
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN
  }
}

// Hook específico para el dashboard que maneja todas las actualizaciones
export function useDashboardRealTimeUpdates({
  enabled = true,
  onDataUpdate,
  onNotification
}: {
  enabled?: boolean
  onDataUpdate?: () => void
  onNotification?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
} = {}) {
  // Si está deshabilitado o no estamos en el navegador, retornar estado desconectado
  if (!enabled || typeof window === 'undefined') {
    return { isConnected: false, disconnect: () => {} }
  }
  
  // Memoizamos las funciones de callback para evitar recreaciones innecesarias
  const handleCourtsUpdated = useCallback((data: any) => {
    console.log('Canchas actualizadas:', data)
    onDataUpdate?.()
    onNotification?.('Las canchas han sido actualizadas', 'info')
  }, [onDataUpdate, onNotification])
  
  const handleBookingsUpdated = useCallback((data: any) => {
    console.log('Reservas actualizadas:', data)
    onDataUpdate?.()
    onNotification?.('Las reservas han sido actualizadas', 'info')
  }, [onDataUpdate, onNotification])
  
  const handleSlotsUpdated = useCallback((data: any) => {
    console.log('Horarios actualizados:', data)
    onDataUpdate?.()
    onNotification?.('Los horarios han sido actualizados', 'info')
  }, [onDataUpdate, onNotification])
  
  const handleAdminChange = useCallback((data: any) => {
    console.log('Cambio administrativo:', data)
    onDataUpdate?.()
    onNotification?.(data.message || 'Se han realizado cambios administrativos', 'success')
  }, [onDataUpdate, onNotification])
  
  const handleConnect = useCallback(() => {
    console.log('Conectado a actualizaciones en tiempo real')
  }, [])
  
  const handleDisconnect = useCallback(() => {
    console.log('Desconectado de actualizaciones en tiempo real')
  }, [])
  
  const handleError = useCallback((error: Event) => {
    console.error('Error en conexión de tiempo real:', error)
    onNotification?.('Error en la conexión de actualizaciones automáticas', 'warning')
  }, [onNotification])
  
  // Usamos las funciones memoizadas
  return useRealTimeUpdates({
    onCourtsUpdated: handleCourtsUpdated,
    onBookingsUpdated: handleBookingsUpdated,
    onSlotsUpdated: handleSlotsUpdated,
    onAdminChange: handleAdminChange,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError
  })
}