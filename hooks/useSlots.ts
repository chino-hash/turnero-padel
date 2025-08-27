import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Court } from '@/types/types'

interface Slot {
  id: string
  startTime: string
  endTime: string
  timeRange: string
  isAvailable: boolean
  price: number
  courtId: string
  date: string
}

interface SlotsSummary {
  total: number
  open: number
  rate: number
  date: string
  courtName: string
}

interface SlotsResponse {
  slots: Slot[]
  summary: SlotsSummary
  courtName: string
  courtId: string
  cached: boolean
  responseTime: number
}

interface CacheStats {
  totalEntries: number
  validEntries: number
  expiredEntries: number
  cacheHitRate: number
}

interface SlotsState {
  slots: Slot[] | null
  summary: SlotsSummary | null
  loading: boolean
  error: string | null
  retry: () => void
  clearCache: () => Promise<void>
  courtName: string
  courtId: string
  cached: boolean
  responseTime: number
  // Funciones de utilidad
  getSlotByTime: (startTime: string) => Slot | undefined
  getAvailableSlots: () => Slot[]
  getUnavailableSlots: () => Slot[]
  // Estadísticas calculadas
  hasSlots: boolean
  availableCount: number
  totalCount: number
  availabilityRate: number
}

// Cache global para evitar peticiones repetitivas
const slotsCache = new Map<string, { data: SlotsResponse; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 segundos

export const useSlots = (courtId: string, date: Date): SlotsState => {
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [summary, setSummary] = useState<SlotsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courtName, setCourtName] = useState<string>('')
  const [courtIdState, setCourtIdState] = useState<string>('')
  const [cached, setCached] = useState<boolean>(false)
  const [responseTime, setResponseTime] = useState<number>(0)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoizar la función ymd para evitar recreaciones
  const ymd = useCallback((d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }, [])
  
  // Estabilizar la fecha para evitar re-renderizados
  const stableDate = useMemo(() => {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    return newDate
  }, [date.getTime()])

  const fetchSlots = useCallback(async () => {
    // Limpiar timeout anterior si existe
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    const cacheKey = `${courtId}-${ymd(stableDate)}`
    const cached = slotsCache.get(cacheKey)
    const now = Date.now()

    // Verificar si hay datos en caché válidos
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      setSlots(cached.data.slots)
      setSummary(cached.data.summary)
      setCourtName(cached.data.courtName)
      setCourtIdState(cached.data.courtId)
      setCached(true)
      setResponseTime(cached.data.responseTime)
      setLoading(false)
      setError(null)
      return
    }

    // Debounce la petición para evitar múltiples llamadas
    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      
      try {
        const res = await fetch(`/api/slots?courtId=${courtId}&date=${ymd(stableDate)}`)
        
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`)
        }
        
        const data: SlotsResponse = await res.json()
        
        // Guardar en caché
        slotsCache.set(cacheKey, { data, timestamp: now })
        
        setSlots(data.slots)
        setSummary(data.summary)
        setCourtName(data.courtName)
        setCourtIdState(data.courtId)
        setCached(data.cached)
        setResponseTime(data.responseTime)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los horarios'
        setError(errorMessage)
        setSlots(null)
        setSummary(null)
        setCached(false)
        setResponseTime(0)
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce de 300ms
  }, [courtId, stableDate, ymd])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  // Cleanup effect para limpiar timeout
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  const retry = useCallback(() => {
    fetchSlots()
  }, [fetchSlots])

  // Función para limpiar cache específico
  const clearCache = useCallback(async () => {
    try {
      const params = new URLSearchParams({ courtId, date: ymd(stableDate) })
      const response = await fetch(`/api/slots?${params}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Limpiar cache local también
      const cacheKey = `${courtId}-${ymd(stableDate)}`
      slotsCache.delete(cacheKey)
      
      // Refrescar datos
      await fetchSlots()
    } catch (err) {
      console.error('❌ Error clearing cache:', err)
      throw err
    }
  }, [courtId, stableDate, ymd, fetchSlots])

  // Funciones de utilidad
  const getSlotByTime = useCallback((startTime: string): Slot | undefined => {
    return slots?.find(slot => slot.startTime === startTime)
  }, [slots])

  const getAvailableSlots = useCallback((): Slot[] => {
    return slots?.filter(slot => slot.isAvailable) || []
  }, [slots])

  const getUnavailableSlots = useCallback((): Slot[] => {
    return slots?.filter(slot => !slot.isAvailable) || []
  }, [slots])

  // Estadísticas calculadas
  const hasSlots = (slots?.length || 0) > 0
  const availableCount = summary?.open || 0
  const totalCount = summary?.total || 0
  const availabilityRate = summary?.rate || 0

  return { 
    slots, 
    summary,
    loading, 
    error, 
    retry,
    clearCache,
    courtName,
    courtId: courtIdState,
    cached,
    responseTime,
    getSlotByTime,
    getAvailableSlots,
    getUnavailableSlots,
    hasSlots,
    availableCount,
    totalCount,
    availabilityRate
  }
}

interface MultipleSlotsState {
  slotsByCourt: Record<string, Slot[]>
  summariesByCourt: Record<string, SlotsSummary>
  loading: boolean
  error: string | null
  retry: () => void
  clearAllCache: () => Promise<void>
  clearCacheForCourt: (courtId: string) => Promise<void>
  getCacheStats: () => Promise<CacheStats>
}

export const useMultipleSlots = (courts: Court[], date: Date): MultipleSlotsState => {
  const [slotsByCourt, setSlotsByCourt] = useState<Record<string, Slot[]>>({})
  const [summariesByCourt, setSummariesByCourt] = useState<Record<string, SlotsSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeRequestsRef = useRef<Set<string>>(new Set())

  // Memoizar la función ymd para evitar recreaciones
  const ymd = useCallback((d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }, [])
  
  // Estabilizar el array de courts para evitar re-renderizados
  const courtsIds = useMemo(() => courts.map(c => c.id), [courts])
  const stableCourts = useMemo(() => courts, [courtsIds.join(',')])
  
  // Estabilizar la fecha para evitar re-renderizados
  const stableDate = useMemo(() => {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    return newDate
  }, [date.getTime()])

  // Función para obtener slots para una cancha específica
  const fetchSlotsForCourt = useCallback(async (court: {id: string}) => {
    const cacheKey = `${court.id}-${ymd(stableDate)}`
    const cached = slotsCache.get(cacheKey)
    const now = Date.now()

    // Verificar si hay datos en caché válidos
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return [court.id, cached.data.slots, cached.data.summary] as const
    }

    // Evitar peticiones duplicadas
    if (activeRequestsRef.current.has(cacheKey)) {
      // Esperar un poco y verificar caché nuevamente
      await new Promise(resolve => setTimeout(resolve, 100))
      const updatedCache = slotsCache.get(cacheKey)
      if (updatedCache && (Date.now() - updatedCache.timestamp) < CACHE_DURATION) {
        return [court.id, updatedCache.data.slots, updatedCache.data.summary] as const
      }
    }

    activeRequestsRef.current.add(cacheKey)

    try {
      const res = await fetch(`/api/slots?courtId=${court.id}&date=${ymd(stableDate)}`)
      if (!res.ok) {
        console.warn(`Error loading slots for court ${court.id}: ${res.status}`)
        const emptySummary: SlotsSummary = {
          total: 0,
          open: 0,
          rate: 0,
          date: ymd(stableDate),
          courtName: court.id
        }
        return [court.id, [], emptySummary] as const
      }
      const data: SlotsResponse = await res.json()
      
      // Guardar en caché
      slotsCache.set(cacheKey, { data, timestamp: now })
      
      return [court.id, data.slots, data.summary] as const
    } catch (err) {
      console.warn(`Error loading slots for court ${court.id}:`, err)
      const emptySummary: SlotsSummary = {
        total: 0,
        open: 0,
        rate: 0,
        date: ymd(stableDate),
        courtName: court.id
      }
      return [court.id, [], emptySummary] as const
    } finally {
      activeRequestsRef.current.delete(cacheKey)
    }
  }, [stableDate, ymd])

  const fetchAllSlots = useCallback(async () => {
    // Limpiar timeout anterior si existe
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    // Debounce la petición para evitar múltiples llamadas
    fetchTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      
      try {
        const entries = await Promise.all(
          stableCourts.map(fetchSlotsForCourt)
        )
        
        const slotsMap: Record<string, Slot[]> = {}
        const summariesMap: Record<string, SlotsSummary> = {}
        
        for (const [courtId, slots, summary] of entries) {
          slotsMap[courtId] = [...slots] // Convertir readonly array a mutable array
          summariesMap[courtId] = summary
        }
        
        setSlotsByCourt(slotsMap)
        setSummariesByCourt(summariesMap)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los horarios'
        setError(errorMessage)
        setSlotsByCourt({})
        setSummariesByCourt({})
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce de 300ms
  }, [stableCourts, fetchSlotsForCourt])

  useEffect(() => {
    fetchAllSlots()
  }, [fetchAllSlots])

  // Cleanup effect para limpiar timeout
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  const retry = useCallback(() => {
    fetchAllSlots()
  }, [fetchAllSlots])

  // Función para limpiar todo el cache
  const clearAllCache = useCallback(async () => {
    try {
      const response = await fetch('/api/slots?action=clear-all', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Limpiar cache local también
      slotsCache.clear()
      
      // Refrescar datos
      await fetchAllSlots()
    } catch (err) {
      console.error('❌ Error clearing all cache:', err)
      throw err
    }
  }, [fetchAllSlots])

  // Función para limpiar cache de una cancha específica
  const clearCacheForCourt = useCallback(async (courtId: string) => {
    try {
      const params = new URLSearchParams({ courtId })
      const response = await fetch(`/api/slots?${params}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Limpiar cache local también
      const cacheKey = `${courtId}-${ymd(stableDate)}`
      slotsCache.delete(cacheKey)
      
      // Refrescar datos
      await fetchAllSlots()
    } catch (err) {
      console.error(`❌ Error clearing cache for court ${courtId}:`, err)
      throw err
    }
  }, [stableDate, ymd, fetchAllSlots])

  // Función para obtener estadísticas del cache
  const getCacheStats = useCallback(async (): Promise<CacheStats> => {
    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'cache-stats' })
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      return response.json()
    } catch (err) {
      console.error('❌ Error getting cache stats:', err)
      throw err
    }
  }, [])

  return { 
    slotsByCourt, 
    summariesByCourt, 
    loading, 
    error,
    retry,
    clearAllCache,
    clearCacheForCourt,
    getCacheStats
  }
}