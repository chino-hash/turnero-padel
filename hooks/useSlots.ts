import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Court } from '@/types/types'

interface Slot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  price: number
}

interface SlotsResponse {
  slots: Slot[]
  summary?: {
    rate: number
  }
  courtName?: string
  courtId?: string
}

interface SlotsState {
  slots: Slot[] | null
  rate: number
  loading: boolean
  error: string | null
  retry: () => void
  courtName?: string
}

// Cache global para evitar peticiones repetitivas
const slotsCache = new Map<string, { data: SlotsResponse; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 segundos

export const useSlots = (courtId: string, date: Date): SlotsState => {
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [rate, setRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courtName, setCourtName] = useState<string | undefined>(undefined)
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
      setRate(cached.data.summary?.rate ?? 0)
      setCourtName(cached.data.courtName)
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
        setRate(data.summary?.rate ?? 0)
        setCourtName(data.courtName)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los horarios'
        setError(errorMessage)
        setSlots(null)
        setRate(0)
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

  return { 
    slots, 
    rate, 
    loading, 
    error, 
    retry,
    courtName 
  }
}

interface MultipleSlotsState {
  slotsByCourt: Record<string, Slot[]>
  ratesByCourt: Record<string, number>
  loading: boolean
  error: string | null
  retry: () => void
}

export const useMultipleSlots = (courts: Court[], date: Date): MultipleSlotsState => {
  const [slotsByCourt, setSlotsByCourt] = useState<Record<string, Slot[]>>({})
  const [ratesByCourt, setRatesByCourt] = useState<Record<string, number>>({})
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
      return [court.id, cached.data.slots, cached.data.summary?.rate ?? 0] as const
    }

    // Evitar peticiones duplicadas
    if (activeRequestsRef.current.has(cacheKey)) {
      // Esperar un poco y verificar caché nuevamente
      await new Promise(resolve => setTimeout(resolve, 100))
      const updatedCache = slotsCache.get(cacheKey)
      if (updatedCache && (Date.now() - updatedCache.timestamp) < CACHE_DURATION) {
        return [court.id, updatedCache.data.slots, updatedCache.data.summary?.rate ?? 0] as const
      }
    }

    activeRequestsRef.current.add(cacheKey)

    try {
      const res = await fetch(`/api/slots?courtId=${court.id}&date=${ymd(stableDate)}`)
      if (!res.ok) {
        console.warn(`Error loading slots for court ${court.id}: ${res.status}`)
        return [court.id, [], 0] as const
      }
      const data: SlotsResponse = await res.json()
      
      // Guardar en caché
      slotsCache.set(cacheKey, { data, timestamp: now })
      
      return [court.id, data.slots, data.summary?.rate ?? 0] as const
    } catch (err) {
      console.warn(`Error loading slots for court ${court.id}:`, err)
      return [court.id, [], 0] as const
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
        const ratesMap: Record<string, number> = {}
        
        for (const [courtId, slots, rate] of entries) {
          slotsMap[courtId] = [...slots] // Convertir readonly array a mutable array
          ratesMap[courtId] = rate
        }
        
        setSlotsByCourt(slotsMap)
        setRatesByCourt(ratesMap)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar los horarios'
        setError(errorMessage)
        setSlotsByCourt({})
        setRatesByCourt({})
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

  return { 
    slotsByCourt, 
    ratesByCourt, 
    loading, 
    error,
    retry
  }
}