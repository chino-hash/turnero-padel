import { useEffect, useRef, useCallback } from 'react'
import { sseManager } from '../lib/sse-manager'

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
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const optionsRef = useRef(options)
  
  // Mantener las opciones actualizadas
  optionsRef.current = options

  // Conectar al montar el componente usando el SSEManager singleton
  useEffect(() => {
    // Solo suscribirse si estamos en el navegador
    if (typeof window === 'undefined') {
      return
    }

    // Suscribirse al manager SSE centralizado
    unsubscribeRef.current = sseManager.subscribe({
      onCourtsUpdated: (data) => optionsRef.current.onCourtsUpdated?.(data),
      onBookingsUpdated: (data) => optionsRef.current.onBookingsUpdated?.(data),
      onSlotsUpdated: (data) => optionsRef.current.onSlotsUpdated?.(data),
      onAdminChange: (data) => optionsRef.current.onAdminChange?.(data),
      onConnect: () => optionsRef.current.onConnect?.(),
      onDisconnect: () => optionsRef.current.onDisconnect?.(),
      onError: (error) => optionsRef.current.onError?.(error)
    })

    // Limpiar suscripción al desmontar
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, []) // Solo ejecutar una vez al montar

  const connect = useCallback(() => {
    // El SSEManager maneja la conexión automáticamente
    // Esta función se mantiene por compatibilidad
    if (!unsubscribeRef.current && typeof window !== 'undefined') {
      unsubscribeRef.current = sseManager.subscribe({
        onCourtsUpdated: (data) => optionsRef.current.onCourtsUpdated?.(data),
        onBookingsUpdated: (data) => optionsRef.current.onBookingsUpdated?.(data),
        onSlotsUpdated: (data) => optionsRef.current.onSlotsUpdated?.(data),
        onAdminChange: (data) => optionsRef.current.onAdminChange?.(data),
        onConnect: () => optionsRef.current.onConnect?.(),
        onDisconnect: () => optionsRef.current.onDisconnect?.(),
        onError: (error) => optionsRef.current.onError?.(error)
      })
    }
  }, [])

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
      optionsRef.current.onDisconnect?.()
    }
  }, [])

  return {
    connect,
    disconnect,
    isConnected: sseManager.isConnected()
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
    // Los errores de reconexión son esperados y se manejan automáticamente
    // Solo loguear como warning, no como error crítico
    console.warn('[SSE] Error en conexión de tiempo real (reconexión automática en curso):', error)
    // No mostrar notificación al usuario para errores de reconexión automática
    // Solo se mostrará si hay un problema persistente
  }, [])
  
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