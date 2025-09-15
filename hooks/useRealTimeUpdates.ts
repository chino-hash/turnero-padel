import { useEffect, useRef, useCallback } from 'react'
import { EventType, SSEEvent } from '../lib/sse-events'

interface UseRealTimeUpdatesOptions {
  onCourtsUpdated?: (data: any) => void
  onBookingsUpdated?: (data: any) => void
  onSlotsUpdated?: (data: any) => void
  onAdminChange?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000 // 1 segundo

  const connect = useCallback(() => {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      console.log('EventSource no disponible en este entorno')
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
      
      // Crear EventSource con configuración mejorada
      const eventSource = new EventSource('/api/events', {
        withCredentials: false // Evitar problemas CORS
      })
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
          console.error('Error en conexión SSE:', error, 'ReadyState:', eventSource.readyState)
          options.onError?.(error)
          
          // Mejorar lógica de reconexión basada en el estado
          const shouldReconnect = 
            eventSource.readyState === EventSource.CLOSED || 
            (eventSource.readyState === EventSource.CONNECTING && reconnectAttemptsRef.current === 0)
          
          if (shouldReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(
              baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
              30000 // Máximo 30 segundos
            )
            
            console.log(`Programando reconexión SSE en ${delay}ms (intento ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              console.log(`Reintentando conexión SSE (intento ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
              connect()
            }, delay)
          } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error('Máximo número de reintentos alcanzado para conexión SSE')
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

  // Conectar al montar el componente
  useEffect(() => {
    // Solo conectar si estamos en el navegador
    if (typeof window !== 'undefined') {
      connect()
    }

    // Limpiar al desmontar
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Manejar visibilidad de la página para reconectar cuando sea necesario
  useEffect(() => {
    // Solo agregar listeners si estamos en el navegador
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !eventSourceRef.current) {
        connect()
      } else if (document.visibilityState === 'hidden') {
        disconnect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connect, disconnect])

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