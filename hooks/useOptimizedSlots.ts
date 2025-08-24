'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { TimeSlot, SlotsResponse } from '@/types/types'

// Cache para evitar peticiones repetidas
const slotsCache = new Map<string, { data: SlotsResponse; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 segundos

interface OptimizedSlotsState {
  slots: TimeSlot[] | null
  rate: number
  loading: boolean
  error: string | null
  courtName?: string
  refreshSlots: () => Promise<void>
  isRefreshing: boolean
}

/**
 * Hook optimizado para manejar slots que evita recargas de página
 * y proporciona actualización manual de horarios
 */
export const useOptimizedSlots = (courtId: string, date: Date): OptimizedSlotsState => {
  const [slots, setSlots] = useState<TimeSlot[] | null>(null)
  const [rate, setRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courtName, setCourtName] = useState<string | undefined>(undefined)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Función para formatear fecha
  const ymd = useCallback((d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }, [])
  
  // Estabilizar la fecha para evitar re-renderizados
  const stableDate = useCallback(() => {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    return newDate
  }, [date.getTime()])

  // Función principal para obtener slots
  const fetchSlots = useCallback(async (isManualRefresh = false) => {
    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Limpiar timeout anterior si existe
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    const currentDate = stableDate()
    const cacheKey = `${courtId}-${ymd(currentDate)}`
    const cached = slotsCache.get(cacheKey)
    const now = Date.now()

    // Verificar si hay datos en caché válidos (solo si no es refresh manual)
    if (!isManualRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setSlots(cached.data.slots)
      setRate(cached.data.summary?.rate ?? 0)
      setCourtName(cached.data.courtName)
      setLoading(false)
      setError(null)
      return
    }

    // Crear nuevo AbortController para esta petición
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Debounce la petición para evitar múltiples llamadas
    fetchTimeoutRef.current = setTimeout(async () => {
      if (isManualRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      try {
        const res = await fetch(
          `/api/slots?courtId=${courtId}&date=${ymd(currentDate)}`,
          { signal }
        )
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }
        
        const data: SlotsResponse = await res.json()
        
        // Guardar en caché
        slotsCache.set(cacheKey, { data, timestamp: now })
        
        setSlots(data.slots)
        setRate(data.summary?.rate ?? 0)
        setCourtName(data.courtName)
      } catch (err) {
        // Ignorar errores de abort
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los horarios'
        setError(errorMessage)
        setSlots(null)
        setRate(0)
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    }, isManualRefresh ? 0 : 300) // Sin debounce para refresh manual
  }, [courtId, stableDate, ymd])

  // Función para refresh manual
  const refreshSlots = useCallback(async () => {
    await fetchSlots(true)
  }, [fetchSlots])

  // Efecto para carga inicial y cambios de dependencias
  useEffect(() => {
    fetchSlots(false)
  }, [fetchSlots])

  // Cleanup effect para limpiar timeout y abort controller
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return { 
    slots, 
    rate, 
    loading, 
    error, 
    refreshSlots,
    isRefreshing,
    courtName 
  }
}

interface OptimizedMultipleSlotsState {
  slotsByCourt: Record<string, TimeSlot[]>
  ratesByCourt: Record<string, number>
  loading: boolean
  error: string | null
  refreshAllSlots: () => Promise<void>
  refreshCourtSlots: (courtId: string) => Promise<void>
  isRefreshing: boolean
}

/**
 * Hook optimizado para manejar múltiples slots de canchas
 */
export const useOptimizedMultipleSlots = (courts: Array<{id: string}>, date: Date): OptimizedMultipleSlotsState => {
  const [slotsByCourt, setSlotsByCourt] = useState<Record<string, TimeSlot[]>>({})
  const [ratesByCourt, setRatesByCourt] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  // Función para formatear fecha
  const ymd = useCallback((d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }, [])
  
  // Estabilizar la fecha
  const stableDate = useCallback(() => {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    return newDate
  }, [date.getTime()])

  // Función para obtener slots de una cancha específica
  const fetchSlotsForCourt = useCallback(async (court: {id: string}, isManualRefresh = false) => {
    const currentDate = stableDate()
    const cacheKey = `${court.id}-${ymd(currentDate)}`
    const cached = slotsCache.get(cacheKey)
    const now = Date.now()

    // Verificar caché si no es refresh manual
    if (!isManualRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      return [court.id, cached.data.slots, cached.data.summary?.rate ?? 0] as const
    }

    // Cancelar petición anterior para esta cancha
    const existingController = abortControllersRef.current.get(court.id)
    if (existingController) {
      existingController.abort()
    }

    // Crear nuevo controller
    const controller = new AbortController()
    abortControllersRef.current.set(court.id, controller)

    try {
      const res = await fetch(
        `/api/slots?courtId=${court.id}&date=${ymd(currentDate)}`,
        { signal: controller.signal }
      )
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }
      
      const data: SlotsResponse = await res.json()
      
      // Guardar en caché
      slotsCache.set(cacheKey, { data, timestamp: now })
      
      return [court.id, data.slots, data.summary?.rate ?? 0] as const
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err // Re-lanzar para manejo especial
      }
      throw new Error(`Error cargando slots para ${court.id}: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    } finally {
      abortControllersRef.current.delete(court.id)
    }
  }, [ymd, stableDate])

  // Función para obtener todos los slots
  const fetchAllSlots = useCallback(async (isManualRefresh = false) => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      if (isManualRefresh) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      try {
        const entries = await Promise.allSettled(
          courts.map(court => fetchSlotsForCourt(court, isManualRefresh))
        )
        
        const slotsMap: Record<string, TimeSlot[]> = {}
        const ratesMap: Record<string, number> = {}
        const errors: string[] = []
        
        for (const entry of entries) {
          if (entry.status === 'fulfilled') {
            const [courtId, slots, rate] = entry.value
            slotsMap[courtId] = [...slots]
            ratesMap[courtId] = rate
          } else if (entry.reason?.name !== 'AbortError') {
            errors.push(entry.reason?.message || 'Error desconocido')
          }
        }
        
        if (errors.length > 0 && Object.keys(slotsMap).length === 0) {
          throw new Error(errors.join('; '))
        }
        
        setSlotsByCourt(slotsMap)
        setRatesByCourt(ratesMap)
        
        if (errors.length > 0) {
          setError(`Algunos horarios no se pudieron cargar: ${errors.join('; ')}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los horarios'
        setError(errorMessage)
        setSlotsByCourt({})
        setRatesByCourt({})
      } finally {
        setLoading(false)
        setIsRefreshing(false)
      }
    }, isManualRefresh ? 0 : 300)
  }, [courts, fetchSlotsForCourt])

  // Función para refresh manual de todas las canchas
  const refreshAllSlots = useCallback(async () => {
    await fetchAllSlots(true)
  }, [fetchAllSlots])

  // Función para refresh manual de una cancha específica
  const refreshCourtSlots = useCallback(async (courtId: string) => {
    const court = courts.find(c => c.id === courtId)
    if (!court) return

    setIsRefreshing(true)
    try {
      const [, slots, rate] = await fetchSlotsForCourt(court, true)
      setSlotsByCourt(prev => ({ ...prev, [courtId]: [...slots] }))
      setRatesByCourt(prev => ({ ...prev, [courtId]: rate }))
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(`Error actualizando ${courtId}: ${err.message}`)
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [courts, fetchSlotsForCourt])

  useEffect(() => {
    fetchAllSlots(false)
  }, [fetchAllSlots])

  // Cleanup
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      // Cancelar todas las peticiones pendientes
      abortControllersRef.current.forEach(controller => controller.abort())
      abortControllersRef.current.clear()
    }
  }, [])

  return { 
    slotsByCourt, 
    ratesByCourt, 
    loading, 
    error,
    refreshAllSlots,
    refreshCourtSlots,
    isRefreshing
  }
}