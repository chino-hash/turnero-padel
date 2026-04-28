'use client'

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { Sun, Moon, Users, MapPin, Clock, Calendar, Filter, AlertCircle, RefreshCw } from 'lucide-react'
import SlotModal from './SlotModal'

import { TimeSlot, Court } from '../types/types'
import { useAppState } from './providers/AppStateProvider'
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates'
import { getCourtHexForDisplay } from '../lib/court-colors'
import { useTenantSlugFromPath } from '@/lib/tenant/TenantSlugFromPathContext'

const EMPTY_HOME_CARD = {
  labelCourtName: '',
  locationName: '',
  mapUrl: '',
  sessionText: '',
  descriptionText: '',
  iconImage: '',
}

const DEFAULT_HOME_CARD_COPY = {
  labelCourtName: 'Nombre de la cancha',
  locationName: 'Downtown Sports Center',
  mapUrl: '',
  sessionText: '1:30 hour sessions',
  descriptionText:
    'Visualiza la disponibilidad del día actual para las tres canchas. Selecciona una para ver sus horarios y características.',
  iconImage: '',
}

/** Listado de canchas: 2 columnas hasta lg y 3 en lg, con justify-center para centrar la última fila incompleta */
const COURT_CARD_LIST_CELL =
  'w-[calc((100%-0.5rem)/2)] sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)] shrink-0 min-w-0'

interface HomeSectionProps {
  isVisible: boolean
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
  selectedCourt: string
  setSelectedCourt: (courtId: string) => void
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  isUnifiedView: boolean
  setIsUnifiedView: (value: boolean) => void
  showOnlyOpen: boolean
  setShowOnlyOpen: (value: boolean) => void
  courts: Court[]
  ratesByCourt: Record<string, number>
  timeSlots: any[]
  slotsForRender: any[]
  expandedSlot: string | null
  setExpandedSlot: (slotId: string | null) => void
  selectedSlot: TimeSlot | null
  setSelectedSlot: (slot: TimeSlot | null) => void
  scrollToNextAvailable: () => void
  handleSlotClick: (slot: any) => void
  formatDate: (date: string) => string
  getAvailableDays: () => Date[]
  currentCourtName?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  isRefreshingMultipleSlots?: boolean
  isRefreshingSlots?: boolean
  /** Al confirmar reserva desde el modal del slot: crear booking y redirigir a pago */
  onConfirmSlot?: (slot: any) => void | Promise<void>
}

export default function HomeSection({
  isVisible,
  isDarkMode,
  setIsDarkMode,
  selectedCourt,
  setSelectedCourt,
  selectedDate,
  setSelectedDate,
  isUnifiedView,
  setIsUnifiedView,
  showOnlyOpen,
  setShowOnlyOpen,
  courts,
  ratesByCourt,
  timeSlots,
  slotsForRender,
  expandedSlot,
  setExpandedSlot,
  selectedSlot,
  setSelectedSlot,
  scrollToNextAvailable,
  handleSlotClick,
  formatDate,
  getAvailableDays,
  currentCourtName,
  loading = false,
  error = null,
  onRetry,
  isRefreshingMultipleSlots = false,
  isRefreshingSlots = false,
  onConfirmSlot
}: HomeSectionProps) {
  const searchParams = useSearchParams()
  const tenantSlugFromPath = useTenantSlugFromPath()
  const tenantSlug = searchParams?.get('tenantSlug')?.trim() || tenantSlugFromPath || null
  const homeCardStorageKey = useMemo(() => {
    if (!tenantSlug) return 'home_card_settings_latest'
    return `home_card_settings_latest:${tenantSlug}`
  }, [tenantSlug])
  const homeCardUpdatedAtKey = `${homeCardStorageKey}:updated_at`
  const readHomeCardSettingsFromStorage = (): any => {
    if (typeof window === 'undefined') return null
    const keys = tenantSlug
      ? [homeCardStorageKey]
      : [homeCardStorageKey, 'home_card_settings_latest']
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') return parsed
      } catch {}
    }
    return null
  }
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSlotForModal, setSelectedSlotForModal] = useState(null)
  const nextAvailableBtnRef = useRef<HTMLButtonElement | null>(null)
  const [creationModeActive, setCreationModeActive] = useState(false)
  const [creationModeCourtId, setCreationModeCourtId] = useState<string | null>(null)
  const [homeCardSettings, setHomeCardSettings] = useState<{
    labelCourtName: string
    locationName: string
    mapUrl: string
    sessionText: string
    descriptionText: string
    iconImage: string
  }>(() => (tenantSlug ? { ...EMPTY_HOME_CARD } : { ...DEFAULT_HOME_CARD_COPY }))
  const [homeCardHeaderReady, setHomeCardHeaderReady] = useState(() => !tenantSlug)

  // Obtener funciones y datos del contexto
  const { refreshSlots, refreshMultipleSlots, allSlotsForDate } = useAppState()

  // Función para actualizar horarios
  const handleRefreshSlots = async () => {
    try {
      if (isUnifiedView) {
        await refreshMultipleSlots()
      } else {
        await refreshSlots()
      }
    } catch (error) {
      console.error('Error al actualizar horarios:', error)
    }
  }

  // Estado de carga para el botón de refresh
  const isRefreshing = isUnifiedView ? isRefreshingMultipleSlots : isRefreshingSlots

  useRealTimeUpdates({
    onCourtsUpdated: (data: any) => {
      if (data?.action === 'created' && data?.court?.id) {
        setCreationModeActive(true)
        setCreationModeCourtId(String(data.court.id))
        setTimeout(() => {
          setCreationModeActive(false)
          setCreationModeCourtId(null)
        }, 60000)
      }
    },
    onAdminChange: (data: any) => {
      try {
        if (data?.type === 'system_setting_updated' && data?.key === 'home_card_settings') {
          loadHomeCardSettings()
          window.dispatchEvent(new Event('home_card_settings_updated'))
          localStorage.setItem(homeCardUpdatedAtKey, String(Date.now()))
          localStorage.setItem('home_card_settings_updated_at', String(Date.now()))
        }
      } catch {}
    }
  })
  async function loadHomeCardSettings() {
    try {
      if (typeof window !== 'undefined') {
        const parsed = readHomeCardSettingsFromStorage()
        if (parsed) {
          setHomeCardSettings({
            labelCourtName:
              parsed?.labelCourtName || (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.labelCourtName),
            locationName:
              parsed?.locationName || (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.locationName),
            mapUrl: parsed?.mapUrl || '',
            sessionText:
              parsed?.sessionText || (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.sessionText),
            descriptionText:
              parsed?.descriptionText ||
              (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.descriptionText),
            iconImage: parsed?.iconImage || '',
          })
        }
      }
      const params = new URLSearchParams({ key: 'home_card_settings' })
      if (tenantSlug) params.set('tenantSlug', tenantSlug)
      const res = await fetch(`/api/system-settings/public/by-key?${params.toString()}`, {
        cache: 'no-store' as RequestCache,
      })
      const json = await res.json()
      const item = json?.data
      if (item) {
        const valStr = String(item.value || '')
        try {
          const parsed = JSON.parse(valStr)
          const next = {
            labelCourtName:
              parsed?.labelCourtName || (tenantSlug ? 'Cancha' : DEFAULT_HOME_CARD_COPY.labelCourtName),
            locationName:
              parsed?.locationName ||
              (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.locationName),
            mapUrl: parsed?.mapUrl || '',
            sessionText:
              parsed?.sessionText ||
              (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.sessionText),
            descriptionText:
              parsed?.descriptionText ||
              (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.descriptionText),
            iconImage: parsed?.iconImage || '',
          }
          setHomeCardSettings(next)
          if (tenantSlug && typeof window !== 'undefined') {
            try {
              localStorage.setItem(homeCardStorageKey, JSON.stringify(parsed))
            } catch {}
          }
        } catch {}
      }
    } catch {
    } finally {
      if (tenantSlug) {
        setHomeCardHeaderReady(true)
      }
    }
  }

  useEffect(() => {
    if (!tenantSlug) {
      setHomeCardHeaderReady(true)
      return
    }
    setHomeCardHeaderReady(false)
    setHomeCardSettings({ ...EMPTY_HOME_CARD })
  }, [tenantSlug])

  useEffect(() => {
    loadHomeCardSettings()
    const handler = () => loadHomeCardSettings()
    const storageHandler = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key === homeCardUpdatedAtKey || e.key === 'home_card_settings_updated_at') loadHomeCardSettings()
    }
    const visHandler = () => {
      if (document.visibilityState === 'visible') loadHomeCardSettings()
    }
    window.addEventListener('home_card_settings_updated', handler as any)
    window.addEventListener('storage', storageHandler)
    document.addEventListener('visibilitychange', visHandler)
    return () => {
      window.removeEventListener('home_card_settings_updated', handler as any)
      window.removeEventListener('storage', storageHandler)
      document.removeEventListener('visibilitychange', visHandler)
    }
  }, [homeCardUpdatedAtKey, tenantSlug])

  // Fallback seguro para evitar errores mientras aún no cargan las canchas
  const defaultCourt: Court = {
    id: 'unknown',
    name: 'Cancha',
    description: null,
    basePrice: 24000,
    priceMultiplier: 1,
    isActive: true,
    operatingHours: { start: '00:00', end: '23:00', slot_duration: 90 },
    features: { color: '#4b5563', bgColor: 'bg-white', textColor: 'text-gray-900' },
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-white',
    textColor: 'text-gray-900',
  }
  const selectedCourtData = courts.find((court) => court.id === selectedCourt)
  const availableDays = getAvailableDays()
  // Color hex para el ícono/ilustración de la cancha seleccionada en la tarjeta superior
  const getCourtNumber = (name: string, id?: string) => {
    const lower = (name || '').toLowerCase().trim()
    const m = lower.match(/cancha\s*(\d+)/i)
    if (m) return Number(m[1])
    if (id === 'cmew6nvsd0001u2jcngxgt8au' || lower.includes(' a') || lower.startsWith('a')) return 1
    if (id === 'cmew6nvsd0002u2jcc24nirbn' || lower.includes(' b') || lower.startsWith('b')) return 2
    if (id === 'cmew6nvi40000u2jcmer3av60' || lower.includes(' c') || lower.startsWith('c')) return 3
    return 0
  }
  const paletteHex = ['#8b5cf6', '#ef4444', '#008000', '#ff9933', '#f54ea2', '#00c4b4', '#e2e8f0']
  const selectedNumber = getCourtNumber(selectedCourtData?.name || '', selectedCourtData?.id)
  const selectedCourtHex = selectedNumber > 0 ? paletteHex[(selectedNumber - 1) % paletteHex.length] : '#ffffff'

  // Court.color ahora usa clases Tailwind originales (from-... to-...)

  const handleSlotClickWithModal = (slot: any) => {
    setSelectedSlotForModal(slot)
    setIsModalOpen(true)
    handleSlotClick(slot) // Mantener la funcionalidad original
  }

  // Verificación de disponibilidad actual (excluye horarios pasados si es hoy).
  // Usa allSlotsForDate (sin filtrar por showOnlyOpen) para no mostrar "Se acabaron"
  // cuando simplemente hay slots futuros disponibles pero el filtro los oculta.
  const hasAvailableSlots = useMemo(() => {
    try {
      const source = Array.isArray(allSlotsForDate) && allSlotsForDate.length > 0
        ? allSlotsForDate
        : (Array.isArray(slotsForRender) ? slotsForRender : [])
      const isToday = new Date().toDateString() === selectedDate.toDateString()
      const now = new Date()
      const result = source.some((s: any) => {
        const available = s.status === 'available' || s.isAvailable || s.available
        if (!available) return false
        const start = s.startTime || s.time
        if (!start) return false
        if (!isToday) return true
        const [h, m] = String(start).split(':').map(Number)
        const slotDate = new Date(selectedDate)
        slotDate.setHours(h || 0, m || 0, 0, 0)
        return slotDate >= now
      })
      return result
    } catch {
      return false
    }
  }, [allSlotsForDate, slotsForRender, selectedDate])

  // Preseleccionar "Solo disponibles" al cargar y mantenerlo si hay disponibilidad
  useEffect(() => {
    setShowOnlyOpen(true)
  }, [])

  useEffect(() => {
    if (hasAvailableSlots) {
      setShowOnlyOpen(true)
    }
  }, [hasAvailableSlots, setShowOnlyOpen])

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedSlotForModal(null)
    setSelectedSlot(null)
  }

  const showHomeCardSkeleton = Boolean(tenantSlug && !homeCardHeaderReady)
  const displayLabelCourt =
    homeCardSettings.labelCourtName || (tenantSlug ? 'Cancha' : DEFAULT_HOME_CARD_COPY.labelCourtName)
  const displayLocation =
    homeCardSettings.locationName || (tenantSlug ? 'Ubicación' : DEFAULT_HOME_CARD_COPY.locationName)
  const displaySession =
    homeCardSettings.sessionText || (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.sessionText)
  const displayDescription =
    homeCardSettings.descriptionText ||
    (tenantSlug ? '' : DEFAULT_HOME_CARD_COPY.descriptionText)

  return isVisible ? (
    <div
      id="courts-section"
      data-testid="home-section"
      className={`h-full pb-16 sm:pb-20 transition-colors duration-300 overflow-x-hidden ${isDarkMode ? 'bg-transparent' : 'bg-gradient-to-br from-blue-50 to-zinc-100'
        }`}
    >
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 max-w-7xl">

        {/* Header - Removed duplicate title */}
        <div className="text-center mb-6">
          <h1 className={`text-2xl sm:text-3xl mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            <span className="font-extrabold"><span className={isDarkMode ? "text-white" : "text-gray-900"}>Padel</span><span style={{ color: "var(--color-neon-lime)" }}>Book</span></span>
          </h1>
          <p className={`text-sm sm:text-base ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Sistema de reservas para canchas de pádel
          </p>
        </div>



        {/* Court Info Card */}
        <Card
          className={`mb-6 rounded-2xl shadow-lg border transition-colors duration-300 backdrop-blur-[22px] ${
            isDarkMode
              ? 'border-white/20 bg-black/40 text-white'
              : 'border-white/60 bg-white/35 text-slate-900'
          }`}
        >
          <CardContent className="p-6">
            {showHomeCardSkeleton ? (
              <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-6">
                <div className="flex flex-1 gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-3 min-w-0">
                    <Skeleton className="h-7 w-full max-w-md" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                    <Skeleton className="h-16 w-full max-w-xl" />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 lg:border-l lg:border-border lg:pl-6 min-w-[140px]">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            ) : (
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Sección Izquierda - Información general de disponibilidad */}
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={"w-16 h-16 rounded-lg flex items-center justify-center shadow-md flex-shrink-0"}
                  style={{ backgroundColor: '#4b5563' }}
                >
                  {homeCardSettings.iconImage ? (
                    <img src={homeCardSettings.iconImage} alt="icono" className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <Users className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl text-muted-foreground mb-0.5 font-bold">{displayLabelCourt}</div>
                  <h2 className={`text-lg mt-2 mb-1`}>
                    <span className="font-semibold">Disponibilidad de</span>{" "}
                    <span className="font-bold" style={{ color: 'var(--color-neon-lime)' }}>hoy</span>
                  </h2>

                  {/* Barra de disponibilidad combinada / individual */}
                  <div className="mb-3">
                    {courts && courts.length > 0 ? (
                      (() => {
                        const currentSlots = Array.isArray(slotsForRender) ? slotsForRender : []
                        const totalSlots = currentSlots.length
                        const availableSlots = currentSlots.filter((s: any) => s?.available ?? s?.isAvailable).length
                        return (
                          <div>
                            <div className="flex items-center gap-4 mb-1">
                              <span className="text-3xl font-bold" style={{ color: 'var(--color-neon-lime)' }}>
                                {`${availableSlots} de ${totalSlots} horarios disponibles`}
                              </span>
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No se encontraron canchas activas.</div>
                    )}
                  </div>

                  {/* Información Adicional (sin cambios) */}
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-sm text-muted-foreground`}>
                      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      {homeCardSettings.mapUrl ? (
                        <a href={homeCardSettings.mapUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          {displayLocation}
                        </a>
                      ) : (
                        <span>{displayLocation}</span>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 text-sm text-muted-foreground`}>
                      <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span>{displaySession}</span>
                    </div>
                  </div>

                  <p className={`text-sm mt-3 leading-relaxed text-muted-foreground`}>
                    {displayDescription}
                  </p>
                </div>
              </div>

              {/* Sección Derecha - Información de Precio al lado derecho */}
              <div className="text-center lg:text-center lg:flex-shrink-0 lg:pl-6 lg:border-l lg:border-border lg:self-stretch lg:flex lg:flex-col lg:items-center lg:justify-center">
                <div className="p-0 text-center">
                  <div className={"text-3xl font-bold mb-1 transition-colors duration-300 ease-in-out"} style={{ color: selectedCourtHex }}>
                    ${Math.round((((selectedCourtData as any)?.basePrice ?? (selectedCourtData as any)?.base_price ?? 24000) * (selectedCourtData?.priceMultiplier ?? 1)) / 4).toLocaleString()}
                  </div>
                  <div className={`text-sm font-medium mb-2 text-muted-foreground`}>
                    por persona
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground inline-block`}>
                    Total: ${Math.round(((selectedCourtData as any)?.basePrice ?? (selectedCourtData as any)?.base_price ?? 24000) * (selectedCourtData?.priceMultiplier ?? 1)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            )}
            {!showHomeCardSkeleton && (
              <div className="mt-6">
                <Button
                  onClick={() => {
                    scrollToNextAvailable()
                    const btn = nextAvailableBtnRef.current
                    if (btn) {
                      setTimeout(() => {
                        btn.blur()
                      }, 1500)
                    }
                  }}
                  variant="ghost"
                  className="w-full !h-auto min-h-14 px-6 py-5 rounded-xl border border-white/40 hover:border-white/70 bg-transparent transition-all duration-200 transform hover:scale-105 text-[color:var(--color-neon-lime)]"
                  data-testid="next-available-btn"
                  ref={nextAvailableBtnRef}
                >
                  <Calendar className="w-5 h-5 mr-2 text-[color:var(--color-neon-lime)]" />
                  Ir al próximo disponible
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Court Selection Cards — flex + anchos fijos para centrar filas incompletas (p. ej. 5 canchas) */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-3 p-1 -m-1">
          {creationModeActive && (() => {
            const items = [1, 2, 3, 4, 5, 6, 7]
            return (
              <div className={`w-full mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <div className="flex flex-wrap gap-2 items-center">
                  {items.map((n) => {
                    const hex = paletteHex[(n - 1) % paletteHex.length]
                    return (
                      <div key={n} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: hex }}></div>
                        <div className="text-xs">{`Cancha ${n}`}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
          {!creationModeActive && courts.map((court) => {
            const rate = ratesByCourt[court.id] ?? 0
            // Calcular precio final de cancha y precio por persona desde datos de la cancha
            const finalCourtPrice = Math.round((((court as any)?.basePrice ?? (court as any)?.base_price ?? 24000) * (court?.priceMultiplier ?? 1)))
            const pricePerPerson = Math.round(finalCourtPrice / 4)
            // Color hex histórico para que el div de cancha coincida exactamente con el color del nombre
            const num = getCourtNumber(court.name || '', court.id)
            const courtHex = num > 0 ? paletteHex[(num - 1) % paletteHex.length] : '#4b5563'
            const lightenHex = (hex: string, factor = 0.85) => {
              const clean = hex.replace('#', '')
              const r = parseInt(clean.substring(0, 2), 16)
              const g = parseInt(clean.substring(2, 4), 16)
              const b = parseInt(clean.substring(4, 6), 16)
              const lr = Math.round(r + (255 - r) * factor)
              const lg = Math.round(g + (255 - g) * factor)
              const lb = Math.round(b + (255 - b) * factor)
              const toHex = (n: number) => n.toString(16).padStart(2, '0')
              return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`
            }
            const selectedBg = lightenHex(courtHex)
            return (
              <button
                key={court.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedCourt(court.id)
                  setIsUnifiedView(false)
                }}
                data-testid="court-card"
                className={`${COURT_CARD_LIST_CELL} relative rounded-xl sm:rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 p-2.5 sm:p-3 lg:p-4 ${selectedCourt === court.id
                    ? isDarkMode
                      ? 'bg-black/70 border-[#BEF264]/35 shadow-2xl backdrop-blur-[22px]'
                      : `border-border shadow-xl`
                    : `${isDarkMode ? 'bg-black/40 border-white/15 backdrop-blur-[22px]' : 'bg-white/40 border-white/60 backdrop-blur-[22px]'} shadow-md`
                  }`}
                style={selectedCourt === court.id && !isDarkMode ? { backgroundColor: selectedBg } : undefined}
              >
                {/* Availability Badge — compacto en móvil */}
                <div
                  className={`absolute top-1.5 left-1.5 sm:top-3 sm:left-3 backdrop-blur-sm rounded sm:rounded-md md:rounded-lg px-1 py-px sm:px-2 sm:py-1 ${isDarkMode ? 'bg-black/70' : 'bg-white/65'
                    }`}
                >
                  {(() => {
                    const showLoadingRate = loading || isRefreshing
                    const rateText = showLoadingRate ? '—%' : `${rate}%`
                    return (
                      <div
                        className={`tabular-nums text-[9px] sm:text-[11px] md:text-xs font-normal sm:font-medium leading-none ${isDarkMode ? 'text-gray-200' : 'text-gray-700'
                          }`}
                      >
                        {rateText}
                      </div>
                    )
                  })()}
                  <div className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 sm:text-gray-600 leading-none mt-px sm:mt-0.5">
                    Disponible
                  </div>
                </div>

                {/* Court Illustration */}
                <div
                  className={"mx-auto mb-2 sm:mb-3 w-12 h-[4.5rem] sm:w-16 sm:h-24 lg:w-20 lg:h-28 rounded-md sm:rounded-lg border-2 border-white/30 relative"}
                  style={{ backgroundColor: courtHex }}
                >
                  {/* Court lines */}
                  <div className="absolute inset-1 sm:inset-2 border border-white/50 rounded">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50 transform -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-1/2 w-px h-full bg-white/50 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>

                {/* Court Name */}
                <div
                  data-testid="court-name"
                  className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 line-clamp-2 min-h-[2rem] sm:min-h-0 ${isDarkMode ? 'text-white' : 'text-black'
                    }`}
                >
                  {court.name}
                </div>

                {/* Price (una sola línea; en móvil el texto se parte en dos líneas si hace falta) */}
                <div
                  className={`text-sm sm:text-base lg:text-xl font-bold transition-colors duration-300 ease-in-out leading-snug ${isDarkMode ? '' : 'text-black'}`}
                  style={isDarkMode ? { color: courtHex } : undefined}
                >
                  ${pricePerPerson.toLocaleString()}{' '}
                  <span className="text-[10px] sm:text-sm lg:text-base font-semibold sm:font-bold">por persona</span>
                </div>
              </button>
            )
          })}
          {creationModeActive && (
            <>
              <div id="courts-available" className="w-full">
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {courts.filter(c => (ratesByCourt[c.id] ?? 0) > 0).map((court) => {
                    const rate = ratesByCourt[court.id] ?? 0
                    const finalCourtPrice = Math.round((((court as any)?.basePrice ?? (court as any)?.base_price ?? 24000) * (court?.priceMultiplier ?? 1)))
                    const pricePerPerson = Math.round(finalCourtPrice / 4)
                    const num = getCourtNumber(court.name || '', court.id)
                    const courtHex = num > 0 ? paletteHex[(num - 1) % paletteHex.length] : '#4b5563'
                    const lightenHex = (hex: string, factor = 0.85) => {
                      const clean = hex.replace('#', '')
                      const r = parseInt(clean.substring(0, 2), 16)
                      const g = parseInt(clean.substring(2, 4), 16)
                      const b = parseInt(clean.substring(4, 6), 16)
                      const lr = Math.round(r + (255 - r) * factor)
                      const lg = Math.round(g + (255 - g) * factor)
                      const lb = Math.round(b + (255 - b) * factor)
                      const toHex = (n: number) => n.toString(16).padStart(2, '0')
                      return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`
                    }
                    const selectedBg = lightenHex(courtHex)
                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedCourt(court.id)
                          setIsUnifiedView(false)
                        }}
                        data-testid="court-card"
                        className={`${COURT_CARD_LIST_CELL} relative p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 ${isDarkMode ? 'bg-black/40 border-white/15 backdrop-blur-[22px]' : 'bg-white/40 border-white/60 backdrop-blur-[22px]'
                          } shadow-md`}
                        style={!isDarkMode ? { backgroundColor: selectedBg } : undefined}
                      >
                        <div
                          className={`absolute top-1.5 left-1.5 sm:top-3 sm:left-3 backdrop-blur-sm rounded sm:rounded-md md:rounded-lg px-1 py-px sm:px-2 sm:py-1 ${isDarkMode ? 'bg-black/70' : 'bg-white/65'
                            }`}
                        >
                          <div
                            className={`tabular-nums text-[9px] sm:text-[11px] md:text-xs font-normal sm:font-medium leading-none ${isDarkMode ? 'text-gray-200' : 'text-gray-700'
                              }`}
                          >{`${rate}%`}</div>
                          <div className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 sm:text-gray-600 leading-none mt-px sm:mt-0.5">
                            Disponible
                          </div>
                        </div>
                        <div className={"mx-auto mb-2 sm:mb-3 w-12 h-[4.5rem] sm:w-16 sm:h-24 lg:w-20 lg:h-28 rounded-md sm:rounded-lg border-2 border-white/30 relative"} style={{ backgroundColor: courtHex }}></div>
                        <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>{court.name}</div>
                        <div className={"text-xs text-muted-foreground"}>{`Nueva cancha creada`}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div id="courts-other" className="w-full">
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {courts.filter(c => (ratesByCourt[c.id] ?? 0) <= 0).map((court) => {
                    const num = getCourtNumber(court.name || '', court.id)
                    const courtHex = num > 0 ? paletteHex[(num - 1) % paletteHex.length] : '#4b5563'
                    return (
                      <div key={court.id} className={`${COURT_CARD_LIST_CELL} relative p-4 rounded-2xl border ${isDarkMode ? 'bg-black/35 border-white/15 backdrop-blur-[22px]' : 'bg-white/35 border-white/60 backdrop-blur-[22px]'} opacity-70`}>
                        <div className="text-xs">{court.name}</div>
                        <div className={"mx-auto mt-2 w-20 h-8 rounded-lg border relative"} style={{ backgroundColor: courtHex }}></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* View Toggle and Filter Controls - Responsive */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Mobile: Stacked Layout */}
          <div className="flex flex-col gap-3 md:hidden">
            {/* View Toggle - Mobile */}
            <div className={`flex items-center rounded-lg p-1 border ${isDarkMode ? 'bg-black/40 border-white/15 backdrop-blur-[22px]' : 'bg-gray-100 border-gray-200'}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsUnifiedView(false)
                }}
                className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${!isUnifiedView
                    ? 'text-[color:var(--color-neon-lime)] font-bold'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white'}`}
              >
                Por cancha
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsUnifiedView(true)
                  setSelectedCourt('')
                }}
                className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${isUnifiedView
                    ? 'text-[color:var(--color-neon-lime)] font-bold'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white'}`}
              >
                Vista unificada
              </button>
            </div>

            {/* Filter Toggle - Mobile */}
            <div className={`flex items-center rounded-lg p-1 border ${isDarkMode ? 'bg-black/40 border-white/15 backdrop-blur-[22px]' : 'bg-gray-100 border-gray-200'}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowOnlyOpen(false)
                }}
                className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${!showOnlyOpen
                    ? 'text-[color:var(--electric-teal)] font-bold'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white'}`}
                aria-pressed={!showOnlyOpen}
              >
                Todos los horarios
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowOnlyOpen(true)
                }}
                disabled={!hasAvailableSlots}
                aria-disabled={!hasAvailableSlots}
                aria-pressed={showOnlyOpen}
                className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${!hasAvailableSlots
                    ? 'text-gray-400 line-through cursor-not-allowed'
                    : showOnlyOpen
                      ? 'text-[color:var(--electric-teal)] font-bold'
                      : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${!hasAvailableSlots ? '' : (isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white')}`}
              >
                Solo disponibles
              </button>
            </div>

          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex flex-col sm:flex-row justify-center items-center gap-8">
            {/* View Toggle - Desktop */}
            <div className={`flex items-center rounded-lg p-1 border ${isDarkMode ? 'bg-black/40 border-white/15 backdrop-blur-[22px]' : 'bg-gray-100 border-gray-200'}`} data-testid="view-toggle">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsUnifiedView(false)
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!isUnifiedView
                    ? 'text-white shadow-md'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white'} hover:ring-1 hover:ring-[rgba(190,242,100,0.28)]`}
                style={!isUnifiedView ? { backgroundColor: 'var(--accent-green-dark)' } : undefined}
                data-testid="toggle-view-by-court"
              >
                Por cancha
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsUnifiedView(true)
                  setSelectedCourt('')
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isUnifiedView
                    ? 'text-white shadow-md'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white'} hover:ring-1 hover:ring-[rgba(190,242,100,0.28)]`}
                style={isUnifiedView ? { backgroundColor: 'var(--accent-green-dark)' } : undefined}
                data-testid="toggle-view-unified"
              >
                Vista unificada
              </button>
            </div>

            {/* Filter Toggle - Desktop */}
            <div className={`flex items-center rounded-lg p-1 border ${isDarkMode ? 'bg-black/40 border-white/15 backdrop-blur-[22px]' : 'bg-gray-100 border-gray-200'}`} data-testid="filter-toggle">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowOnlyOpen(false)
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!showOnlyOpen
                    ? 'text-white shadow-md'
                    : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white'} hover:ring-1 hover:ring-[rgba(190,242,100,0.28)]`}
                style={!showOnlyOpen ? { backgroundColor: 'var(--electric-teal)' } : undefined}
                data-testid="toggle-filter-all"
                aria-pressed={!showOnlyOpen}
              >
                Todos los horarios
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowOnlyOpen(true)
                }}
                disabled={!hasAvailableSlots}
                aria-disabled={!hasAvailableSlots}
                aria-pressed={showOnlyOpen}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!hasAvailableSlots
                    ? 'text-gray-400 line-through cursor-not-allowed'
                    : showOnlyOpen
                      ? 'text-white shadow-md'
                      : isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  } ${!hasAvailableSlots ? '' : (isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-white')} hover:ring-1 hover:ring-[rgba(190,242,100,0.28)]`}
                style={showOnlyOpen ? { backgroundColor: 'var(--electric-teal)' } : undefined}
                data-testid="toggle-filter-open"
              >
                Solo disponibles
              </button>
            </div>

          </div>
        </div>

        {/* Main Content Layout - Responsive */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Date Selection - Full width on mobile, left column on desktop */}
          <div className="w-full lg:w-auto lg:flex-shrink-0 mb-4 lg:mb-0" data-testid="date-selection">
            <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              <Calendar className="w-5 h-5" />
              Seleccionar Fecha
            </h3>
            <div className="flex flex-col space-y-2 lg:max-w-xs">
              {/* Mobile: Horizontal scroll for dates */}
              <div className="lg:hidden w-full overflow-x-auto overflow-y-hidden pb-2 scroll-smooth" data-testid="date-selection-mobile" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center gap-3 sm:gap-4 pl-4 pr-4 min-w-min snap-x snap-mandatory">
                  {availableDays.map((date, index) => {
                    const isSelected = selectedDate.toDateString() === date.toDateString()
                    const isToday = new Date().toDateString() === date.toDateString()
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' })
                    const dayNumber = date.getDate()
                    const monthName = date.toLocaleDateString('es-ES', { month: 'short' })

                    return (
                      <button
                        key={`mobile-${index}`}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedDate(date)
                        }}
                        aria-label={`Seleccionar ${isToday ? 'hoy, ' : ''}${dayName} ${dayNumber} ${monthName}`}
                        aria-pressed={isSelected}
                        title={`${isToday ? 'Hoy - ' : ''}${dayName} ${dayNumber} ${monthName}`}
                        className={`flex-shrink-0 w-20 p-3 rounded-lg transition-all duration-200 text-center snap-center ${isSelected
                            ? "text-white shadow-lg"
                            : isDarkMode
                              ? "bg-black/40 text-white hover:bg-black/50 border border-white/15 backdrop-blur-[22px]"
                              : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
                          } ${index === 0 ? 'ml-4' : ''}`}
                        style={isSelected ? { backgroundColor: 'var(--electric-teal)' } : undefined}
                        data-testid={`date-btn-mobile-${index}`}
                      >
                        <div className="flex flex-col">
                          <div className={`text-xs font-medium capitalize ${isSelected ? "text-white" : isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                            {dayName}
                          </div>
                          <div className={`text-lg font-bold ${isSelected ? "text-white" : isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                            {dayNumber}
                          </div>
                          <div className={`text-xs ${isSelected ? "text-white/90" : isDarkMode ? "text-white/80" : "text-gray-700"
                            }`}>
                            {monthName}
                          </div>
                          {isToday && (
                            <div className="text-[10px] font-medium text-white/70">
                              Hoy
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Desktop: Vertical layout for dates */}
              <div className="hidden lg:flex flex-col space-y-2" data-testid="date-selection-desktop">
                {availableDays.map((date, index) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString()
                  const isToday = new Date().toDateString() === date.toDateString()
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' })
                  const dayNumber = date.getDate()
                  const monthName = date.toLocaleDateString('es-ES', { month: 'short' })

                  return (
                    <button
                      key={`desktop-${index}`}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setSelectedDate(date)
                      }}
                      className={`w-full p-4 rounded-lg transition-all duration-200 text-left ${isSelected
                          ? "text-white shadow-lg"
                          : isDarkMode
                            ? "bg-black/40 text-white hover:bg-black/50 border border-white/15 backdrop-blur-[22px]"
                            : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
                        }`}
                      style={isSelected ? { backgroundColor: 'var(--electric-teal)' } : undefined}
                      data-testid={`date-btn-desktop-${index}`}
                    >
                      <div className="flex flex-col">
                        <div className={`font-medium capitalize ${isSelected ? "text-white" : isDarkMode ? "text-white" : "text-gray-900"
                          }`}>
                          {dayName}
                        </div>
                        <div className={`text-sm ${isSelected ? "text-blue-100" : isDarkMode ? "text-white/80" : "text-gray-700"
                          }`}>
                          {dayNumber} {monthName}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Time Slots Grid */}
          <div className="flex-1" data-testid="slots-grid">
            <div className="flex items-center justify-between mb-3" data-testid="slots-header">
              <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Horarios disponibles
              </h3>
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleRefreshSlots}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className={`flex items-center gap-2 ${isDarkMode ? 'border-white/15 bg-black/40 text-gray-200 hover:bg-black/50 backdrop-blur-[22px]' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  data-testid="refresh-slots-btn"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <div className="flex items-center gap-2" data-testid="slot-count">
                  <Filter className={`w-4 h-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {slotsForRender.filter(s => {
                      const available = s.status === 'available' || s.isAvailable || s.available
                      const isToday = new Date().toDateString() === selectedDate.toDateString()
                      const start = s.startTime || s.time
                      if (!start) return false
                      const [h, m] = start.split(':').map(Number)
                      const slotDate = new Date(selectedDate)
                      slotDate.setHours(h, m, 0, 0)
                      const isPast = isToday && slotDate < new Date()
                      return available && !isPast
                    }).length} disponibles
                  </span>
                </div>
              </div>
            </div>

            {/* Badge Demo Section */}
            <div className={`mb-4 p-3 rounded-lg border ${isDarkMode ? 'bg-black/40 border-white/15 backdrop-blur-[22px]' : 'bg-gray-100 border-gray-300'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isDarkMode ? "text-white" : "text-gray-600"}`}>Estados:</span>
                <span className="badge-disponible">Disponible</span>
                <span className="badge-reservado">No disponible</span>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div
                className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4 p-4 border rounded-lg bg-card border-border`}
                role="status"
                aria-busy="true"
                aria-label="Cargando horarios"
              >
                {Array.from({ length: 15 }).map((_, i) => (
                  <Skeleton key={i} className="h-[80px] w-full rounded-lg" />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className={`flex flex-col items-center justify-center py-12 border rounded-lg ${isDarkMode ? "text-gray-400 bg-zinc-900 border-zinc-800" : "text-gray-600 bg-gray-100 border-gray-300"}`}>
                <AlertCircle className="w-8 h-8 mb-3 text-red-500" />
                <p className="text-sm mb-4 text-center">Error al cargar los horarios: {error}</p>
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reintentar
                  </Button>
                )}
              </div>
            )}

            {/* Slots Grid - 5 Columns Layout */}
            {!loading && !error && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 p-4 rounded-lg ${isDarkMode ? 'bg-transparent' : 'border bg-card border-border'}`}>
                {!hasAvailableSlots ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div
                      role="status"
                      aria-live="polite"
                      data-testid="no-slots-message"
                      className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-2xl sm:text-3xl font-bold flex items-center gap-3`}
                    >
                      <span>Se acabaron los turnos de hoy</span>
                      <span aria-hidden="true">😞</span>
                    </div>
                  </div>
                ) : (
                  slotsForRender.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id
                    const isAvailable = slot.status === 'available' || slot.isAvailable || slot.available
                    const courtName = slot.courtName || slot.court || `Cancha ${slot.courtId?.replace('court-', '') || '1'}`
                    const timeRange = slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : slot.startTime || slot.time
                    const pricePerPerson = slot.pricePerPerson ?? Math.round(((slot.finalPrice ?? slot.price ?? 6000) / 4))

                    // Misma paleta que la sección de canchas (por número de cancha)
                    const courtColor = getCourtHexForDisplay(slot.courtId || '', courtName)

                    const isTodaySelected = new Date().toDateString() === selectedDate.toDateString()
                    const slotStartStr = slot.startTime || slot.time
                    let isPast = false
                    if (isTodaySelected && slotStartStr) {
                      const [h, m] = slotStartStr.split(':').map(Number)
                      const slotDate = new Date(selectedDate)
                      slotDate.setHours(h, m, 0, 0)
                      isPast = slotDate < new Date()
                    }
                    const isClickable = isAvailable && !isPast

                    return (
                      <button
                        key={slot.id}
                        id={`slot-${slot.id}`}
                        onClick={() => handleSlotClickWithModal(slot)}
                        disabled={!isClickable}
                        aria-disabled={!isClickable}
                        data-testid="time-slot"
                        className={`rounded-lg border-[1.5px] transition-all duration-200 text-center flex flex-col items-center justify-center gap-0.5 disabled:opacity-60 disabled:grayscale ${!isClickable
                            ? isDarkMode
                              ? "p-1 md:p-1 min-h-[64px] md:min-h-[68px] text-sm bg-black/40 border-white/15 border-[2px] backdrop-blur-[22px] cursor-not-allowed"
                              : "p-1 md:p-1 min-h-[64px] md:min-h-[68px] text-sm bg-card border-border/80 border-[2px] cursor-not-allowed"
                            : isSelected
                              ? isDarkMode
                                ? "p-2 md:p-2 min-h-[78px] md:min-h-[80px] bg-black/55 border-[color:var(--electric-teal)] border-[2px] shadow-md backdrop-blur-[22px]"
                                : "p-2 md:p-2 min-h-[78px] md:min-h-[80px] bg-card border-[color:var(--electric-teal)] border-[2px] shadow-md"
                              : isDarkMode
                                ? "p-2 md:p-2 min-h-[78px] md:min-h-[80px] bg-black/45 border-white/15 border-[2px] transform hover:scale-105 hover:shadow-sm backdrop-blur-[22px]"
                                : "p-2 md:p-2 min-h-[78px] md:min-h-[80px] bg-card border-border border-[2px] transform hover:scale-105 hover:shadow-sm"
                          }`}
                      >
                        {/* Court Name - Top with specific color */}
                        <div
                          data-testid="slot-court-name"
                          className={`line-clamp-1 w-full ${isClickable ? 'text-[11px] sm:text-xs font-medium leading-tight' : 'text-[10px] font-medium leading-tight'} px-0.5`}
                          style={{
                            color: !isClickable
                              ? (isDarkMode ? '#6b7280' : '#9ca3af')
                              : courtColor
                          }}
                        >
                          {courtName}
                        </div>

                        {/* Time Range - Second */}
                        <div
                          className={`w-full text-card-foreground leading-none tracking-tight ${isClickable ? 'text-[11px] font-bold sm:text-sm md:text-base lg:text-lg' : 'text-[10px] font-semibold sm:text-xs'}`}
                        >
                          {timeRange}
                        </div>

                        {/* Availability Status Badge */}
                        <span
                          data-testid="slot-status-badge"
                          className={
                            isClickable
                              ? "badge-disponible !py-0.5 !px-1.5 !text-[0.65rem] sm:!text-[0.8rem]"
                              : "badge-reservado !py-0.5 !px-1.5 !text-[0.65rem] sm:!text-xs"
                          }
                        >
                          {!isClickable ? "No disponible" : "Disponible"}
                        </span>

                        {/* Price - Bottom */}
                        <div
                          className={`w-full leading-tight text-muted-foreground ${isClickable ? 'text-[10px] sm:text-xs font-medium' : 'text-[10px] font-medium'}`}
                        >
                          ${pricePerPerson.toLocaleString()} por persona
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para mostrar información detallada del turno */}
      <SlotModal
        slot={selectedSlotForModal}
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={onConfirmSlot}
        onError={(message) => {
          if (message && message.includes('ya no está disponible')) {
            handleRefreshSlots();
          }
        }}
      />
    </div>
  ) : null
}