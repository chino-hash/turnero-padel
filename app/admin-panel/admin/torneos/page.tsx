"use client"

import { useMemo, useState, Fragment, useEffect, useCallback } from "react"
import { Trophy, Calendar as CalendarIcon, Clock, Plus, Trash2, Check, ChevronRight, Users, Medal, ChevronDown, ChevronUp, X, ArrowLeft, Loader2, Pencil, UserPlus } from "lucide-react"
import { useSession } from "next-auth/react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type TorneoHistorialItem = {
  id: string
  title: string
  category: string
  prizeFirst: number
  prizeSecond: number
  minPairs: number
  maxPairs: number
  status?: string
  dayBlocks: { date: string; ranges: { start: string; end: string }[] }[]
}

function prizeToDisplay(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(value)
}

function getFirstDate(dayBlocks: TorneoHistorialItem["dayBlocks"]): string {
  if (!dayBlocks.length) return ""
  const first = dayBlocks[0]
  return first.date
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  OPEN_REGISTRATION: "Inscripciones abiertas",
  CLOSED: "Inscripciones cerradas",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
}
function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const label = STATUS_LABELS[status] ?? status
  const variant = status === "OPEN_REGISTRATION" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : status === "DRAFT" ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" : status === "CANCELLED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border", variant)}>
      {label}
    </span>
  )
}

type TenantOption = { id: string; name: string; slug: string }

export default function Page() {
  const { data: session } = useSession()
  const isSuperAdmin = Boolean(session?.user?.isSuperAdmin)
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>("")
  const [view, setView] = useState<"historial" | "crear" | "detalle">("historial")
  const [selectedTorneo, setSelectedTorneo] = useState<TorneoHistorialItem | null>(null)
  const [deleteTorneoId, setDeleteTorneoId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detalleTab, setDetalleTab] = useState<"info" | "inscripciones">("info")
  const [inscripciones, setInscripciones] = useState<{ list: Array<{ id: string; type: string; playerName: string; playerEmail: string | null; partnerName: string | null; status: string }>; currentPairs: number; minPairs: number; maxPairs: number } | null>(null)
  const [inscripcionesError, setInscripcionesError] = useState<string | null>(null)
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [newRegType, setNewRegType] = useState<"SINGLE" | "PAIR">("PAIR")
  const [newRegPlayer, setNewRegPlayer] = useState("")
  const [newRegPartner, setNewRegPartner] = useState("")
  const [submittingReg, setSubmittingReg] = useState(false)
  const [editTorneoId, setEditTorneoId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [prizeFirst, setPrizeFirst] = useState("")
  const [prizeSecond, setPrizeSecond] = useState("")
  const [pairs, setPairs] = useState<number | "">("")
  const [maxPairs, setMaxPairs] = useState<number | "">("")
  const [dayBlocks, setDayBlocks] = useState<{ date: string; ranges: { start: string; end: string }[] }[]>([])
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const [torneos, setTorneos] = useState<TorneoHistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchTorneos = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch("/api/torneos", { credentials: "include" })
      const json = await res.json()
      if (!res.ok) {
        setFetchError(json?.message ?? "Error al cargar torneos")
        setTorneos([])
        return
      }
      const data = json?.data ?? []
      setTorneos(Array.isArray(data) ? data : [])
    } catch {
      setFetchError("Error de conexión")
      setTorneos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === "historial") fetchTorneos()
  }, [view, fetchTorneos])

  useEffect(() => {
    if (isSuperAdmin && view === "crear") {
      fetch("/api/tenants", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.success && Array.isArray(data.data)) setTenants(data.data)
        })
        .catch(() => {})
    }
  }, [isSuperAdmin, view])

  const fetchInscripciones = useCallback(async () => {
    if (!selectedTorneo) return
    setLoadingInscripciones(true)
    setInscripcionesError(null)
    try {
      const res = await fetch(`/api/torneos/${selectedTorneo.id}/inscripciones`, { credentials: "include" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = json?.message ?? json?.error ?? "Error al cargar inscripciones"
        setInscripcionesError(msg)
        toast.error(msg)
        return
      }
      if (json?.data) setInscripciones(json.data)
      setInscripcionesError(null)
    } catch {
      const msg = "Error de conexión"
      setInscripcionesError(msg)
      toast.error(msg)
    } finally {
      setLoadingInscripciones(false)
    }
  }, [selectedTorneo])

  const CATEGORIES = ["8va", "7ma", "6ta", "5ta", "4ta", "3ra", "2da", "1ra", "Mixto", "Suma"]
  const MAIN_CATEGORIES = ["8va", "7ma", "6ta"]
  const OTHER_CATEGORIES = CATEGORIES.filter(c => !MAIN_CATEGORIES.includes(c))

  function formatCurrency(value: string) {
    if (!value) return ""
    const number = value.replace(/\D/g, "")
    if (number === "") return ""
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(Number(number))
  }

  function handlePrizeChange(setter: (v: string) => void, value: string) {
    setter(formatCurrency(value))
  }

  function handleCategorySelect(cat: string) {
    if (cat === "Suma") {
      setCategory("Suma 13")
    } else {
      setCategory(cat)
    }
  }

  function formatDateEs(value: string) {
    try {
      const d = new Date(`${value}T00:00:00`)
      return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
    } catch {
      return value
    }
  }

  function timeToMinutes(t: string) {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }

  function generateSlots() {
    const slots: string[] = []
    for (let m = 0; m <= 23 * 60 + 30; m += 30) {
      const h = Math.floor(m / 60).toString().padStart(2, '0')
      const mm = (m % 60).toString().padStart(2, '0')
      slots.push(`${h}:${mm}`)
    }
    return slots
  }

  const DEFAULT_END = "23:59"
  const getEndOrDefault = (end?: string) => end && end.length > 0 ? end : DEFAULT_END

  const minP = pairs === "" ? 1 : Number(pairs)
  const maxP = maxPairs === "" ? 128 : Number(maxPairs)
  const canContinueStep1 = title.trim().length > 0 && category.trim().length > 0 && minP <= maxP
  const canContinueStep2 = dayBlocks.length > 0
  const canPublish = canContinueStep1 && canContinueStep2 && dayBlocks.length > 0 && dayBlocks.every(d => d.ranges.some(r => Boolean(r.start)))

  const preview = useMemo(() => ({
    title,
    category,
    prizeFirst,
    prizeSecond,
    minPairs: pairs === "" ? undefined : Number(pairs),
    maxPairs: maxPairs === "" ? undefined : Number(maxPairs),
    dayBlocks,
  }), [title, category, prizeFirst, prizeSecond, pairs, maxPairs, dayBlocks])

  async function handlePublish() {
    setPublishError(null)
    if (!canPublish) {
      toast.error("Completa todos los pasos: título, categoría, al menos un día y una franja horaria con hora de inicio por cada día.")
      return
    }
    const isEdit = !!editTorneoId
    if (!isEdit && isSuperAdmin && !selectedTenantId) {
      const msg = "Seleccione el club para el cual crear el torneo."
      setPublishError(msg)
      toast.error(msg)
      return
    }
    const payload: Record<string, unknown> = {
      title: title.trim(),
      category: category.trim(),
      prizeFirst: Number(prizeFirst.replace(/\D/g, "")) || 0,
      prizeSecond: Number(prizeSecond.replace(/\D/g, "")) || 0,
      minPairs: pairs === "" ? 1 : Number(pairs),
      maxPairs: maxPairs === "" ? 128 : Number(maxPairs),
      dayBlocks: dayBlocks.map((d) => ({
        date: d.date,
        ranges: d.ranges.filter((r) => r.start).map((r) => ({ start: r.start, end: getEndOrDefault(r.end) })),
      })).filter((d) => d.ranges.length > 0),
    }
    if (!isEdit && isSuperAdmin && selectedTenantId) payload.tenantId = selectedTenantId
    try {
      setPublishStatus("publishing")
      const url = isEdit ? `/api/torneos/${editTorneoId}` : "/api/torneos"
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      })
      const json = await res.json().catch(() => ({}))
      const errorMessage = [json?.error, json?.message].filter(Boolean).join(" — ") || (isEdit ? "Error al actualizar torneo" : "Error al crear torneo")
      if (!res.ok) {
        setPublishError(errorMessage)
        toast.error(errorMessage)
        setPublishStatus("error")
        return
      }
      setPublishStatus("success")
      setPublishError(null)
      toast.success(isEdit ? "Torneo actualizado correctamente" : "Torneo creado correctamente")
      setEditTorneoId(null)
      setView("historial")
      await fetchTorneos()
      setStep(1)
      setTitle("")
      setCategory("")
      setPrizeFirst("")
      setPrizeSecond("")
      setPairs("")
      setMaxPairs("")
      setDayBlocks([])
      setSelectedTenantId("")
      setPublishStatus("idle")
    } catch {
      const msg = "Error de conexión"
      setPublishError(msg)
      toast.error(msg)
      setPublishStatus("error")
    }
  }

  function removeDay(date: string) {
    setDayBlocks(dayBlocks.filter(d => d.date !== date))
  }

  function addRange(date: string) {
    setDayBlocks(dayBlocks.map(d => d.date === date ? { ...d, ranges: [...d.ranges, { start: "", end: "23:59" }] } : d))
  }

  /** Hay al menos una franja con hora de inicio seleccionada (para mostrar "Horario confirmado"). */
  function hasStartTimeSelected(date: string) {
    const d = dayBlocks.find(x => x.date === date)
    if (!d) return false
    return d.ranges.some(r => Boolean(r.start))
  }

  function updateRange(date: string, index: number, field: "start" | "end", value: string) {
    setDayBlocks(dayBlocks.map(d => {
      if (d.date !== date) return d
      const ranges = d.ranges.map((r, i) => i === index ? { ...r, [field]: value } : r)
      return { ...d, ranges }
    }))
  }

  function removeRange(date: string, index: number) {
    setDayBlocks(dayBlocks.map(d => d.date === date ? { ...d, ranges: d.ranges.filter((_, i) => i !== index) } : d))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="min-h-[5.5rem] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-foreground mb-2">
            {view === "historial" ? "Torneos" : view === "detalle" ? "Detalle del torneo" : editTorneoId ? "Editar torneo" : "Crear Nuevo Torneo"}
          </h1>
          <div className="w-16 h-0.5 bg-orange-500"></div>
          <p className="text-muted-foreground text-xs mt-2">
            {view === "historial" && "Historial de torneos realizados."}
            {view === "detalle" && selectedTorneo && selectedTorneo.title}
            {view === "crear" && "Define categorías, premios y cronograma del torneo."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {view === "historial" && (
            <Button onClick={() => setView("crear")} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear torneo
            </Button>
          )}
          {(view === "detalle" || view === "crear") && (
            <Button variant="outline" onClick={() => { setView("historial"); setSelectedTorneo(null); setDetalleTab("info"); setInscripciones(null); setInscripcionesError(null); setEditTorneoId(null); }} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          )}
        </div>
      </div>

      {view === "historial" && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && torneos.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl bg-muted/80 dark:bg-muted border border-border/50 px-8 py-12 text-center max-w-md"
              >
                <p className="text-2xl sm:text-3xl font-bold text-foreground flex flex-wrap items-center justify-center gap-2">
                  <span>no hay torneos por ahora, haz el primero!!</span>
                </p>
              </div>
            </div>
          )}
          {!loading && !fetchError && torneos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {torneos.map((t) => (
                <div
                  key={t.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setSelectedTorneo(t); setView("detalle"); setInscripciones(null); setInscripcionesError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && (setSelectedTorneo(t), setView("detalle"), setInscripciones(null), setInscripcionesError(null))}
                  className="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-border cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Trophy className="w-16 h-16 transform rotate-12 -translate-y-2 translate-x-2" />
                    </div>
                    <div className="relative z-10 space-y-2">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-medium border border-white/20">
                          <Trophy className="w-2.5 h-2.5 mr-0.5 text-yellow-300" />
                          {t.category}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-medium border border-white/20">
                          <Users className="w-2.5 h-2.5 mr-0.5" />
                          {t.minPairs === t.maxPairs ? t.minPairs : `${t.minPairs}-${t.maxPairs}`} parejas
                        </span>
                        {t.status && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-medium border border-white/20">
                            {STATUS_LABELS[t.status] ?? t.status}
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-bold tracking-tight text-white drop-shadow-md leading-tight line-clamp-2">
                        {t.title}
                      </h2>
                      <p className="text-[10px] text-white/80">
                        {getFirstDate(t.dayBlocks) ? `Realizado el ${formatDateEs(getFirstDate(t.dayBlocks))}` : "Sin fechas"}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 space-y-3 bg-gradient-to-b from-card to-muted/20">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Medal className="w-2.5 h-2.5" />
                        Premios
                      </p>
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-md border border-yellow-100 dark:border-yellow-900/30 bg-yellow-50/50 dark:bg-yellow-900/10 px-2 py-1.5">
                          <p className="text-[8px] text-yellow-600 dark:text-yellow-400 font-bold uppercase">1°</p>
                          <p className="text-xs font-bold text-foreground truncate">{prizeToDisplay(t.prizeFirst)}</p>
                        </div>
                        <div className="flex-1 rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 px-2 py-1.5">
                          <p className="text-[8px] text-gray-600 dark:text-gray-400 font-bold uppercase">2°</p>
                          <p className="text-xs font-bold text-foreground truncate">{prizeToDisplay(t.prizeSecond)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <CalendarIcon className="w-2.5 h-2.5" />
                        Fechas
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {t.dayBlocks.slice(0, 3).map((d, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[9px] font-medium border border-blue-100 dark:border-blue-800"
                          >
                            {formatDateEs(d.date)}
                          </span>
                        ))}
                        {t.dayBlocks.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{t.dayBlocks.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "detalle" && selectedTorneo && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={selectedTorneo.status} />
            <span className="text-sm text-muted-foreground">
              {selectedTorneo.minPairs === selectedTorneo.maxPairs ? selectedTorneo.maxPairs : `${selectedTorneo.minPairs}-${selectedTorneo.maxPairs}`} parejas
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTorneo.status === "DRAFT" && (
              <Button
                size="sm"
                onClick={async () => {
                  if (!selectedTorneo) return
                  setPublishingId(selectedTorneo.id)
                  try {
                    const res = await fetch(`/api/torneos/${selectedTorneo.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "OPEN_REGISTRATION", publishedAt: new Date().toISOString() }),
                      credentials: "include",
                    })
                    const json = await res.json()
                    if (!res.ok) { toast.error(json?.message ?? "Error al publicar"); return }
                    toast.success("Torneo publicado. Inscripciones abiertas.")
                    fetchTorneos()
                    setSelectedTorneo(prev => prev ? { ...prev, status: "OPEN_REGISTRATION" } : null)
                  } catch { toast.error("Error de conexión") }
                  finally { setPublishingId(null) }
                }}
                disabled={!!publishingId}
              >
                {publishingId === selectedTorneo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Publicar torneo
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setEditTorneoId(selectedTorneo.id); setTitle(selectedTorneo.title); setCategory(selectedTorneo.category); setPrizeFirst(prizeToDisplay(selectedTorneo.prizeFirst)); setPrizeSecond(prizeToDisplay(selectedTorneo.prizeSecond)); setPairs(selectedTorneo.minPairs); setMaxPairs(selectedTorneo.maxPairs); setDayBlocks(selectedTorneo.dayBlocks); setView("crear"); }}>
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTorneoId(selectedTorneo.id)}>
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
            <Button variant="outline" size="sm" className={detalleTab === "inscripciones" ? "bg-primary/10" : ""} onClick={() => { setDetalleTab("inscripciones"); if (selectedTorneo && !inscripciones) fetchInscripciones(); }}>
              <UserPlus className="w-4 h-4 mr-1" />
              Gestionar inscripciones
            </Button>
          </div>
          <div className="border-t pt-4">
            {detalleTab === "info" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Premios</p>
                  <p className="text-sm">1° {prizeToDisplay(selectedTorneo.prizeFirst)} — 2° {prizeToDisplay(selectedTorneo.prizeSecond)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Fechas</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTorneo.dayBlocks.map((d, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{formatDateEs(d.date)}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {detalleTab === "inscripciones" && (
              <div className="space-y-4">
                {loadingInscripciones && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
                {!loadingInscripciones && inscripcionesError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
                    <p className="text-sm text-destructive">{inscripcionesError}</p>
                    <Button type="button" variant="outline" size="sm" onClick={fetchInscripciones}>Reintentar</Button>
                  </div>
                )}
                {!loadingInscripciones && inscripciones && !inscripcionesError && (
                  <>
                    <p className="text-sm font-medium">Cupo: {inscripciones.currentPairs} / {inscripciones.maxPairs} parejas</p>
                    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Agregar inscripción</p>
                      <div className="flex gap-2">
                        <Button type="button" variant={newRegType === "PAIR" ? "default" : "outline"} size="sm" onClick={() => setNewRegType("PAIR")}>Pareja</Button>
                        <Button type="button" variant={newRegType === "SINGLE" ? "default" : "outline"} size="sm" onClick={() => setNewRegType("SINGLE")}>Solo</Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input placeholder="Nombre jugador" className="rounded-md border px-3 py-2 text-sm" value={newRegPlayer} onChange={e => setNewRegPlayer(e.target.value)} />
                        {newRegType === "PAIR" && <input placeholder="Nombre compañero" className="rounded-md border px-3 py-2 text-sm" value={newRegPartner} onChange={e => setNewRegPartner(e.target.value)} />}
                      </div>
                      {inscripciones.currentPairs >= inscripciones.maxPairs && (
                        <p className="text-sm text-muted-foreground font-medium">Cupo completo</p>
                      )}
                      <Button size="sm" disabled={!newRegPlayer.trim() || (newRegType === "PAIR" && !newRegPartner.trim()) || submittingReg || inscripciones.currentPairs >= inscripciones.maxPairs} onClick={async () => {
                        if (!selectedTorneo) return
                        setSubmittingReg(true)
                        try {
                          const res = await fetch(`/api/torneos/${selectedTorneo.id}/inscripciones`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: newRegType, playerName: newRegPlayer.trim(), partnerName: newRegType === "PAIR" ? newRegPartner.trim() : undefined }),
                            credentials: "include",
                          })
                          const json = await res.json().catch(() => ({}))
                          const errorMsg = json?.message ?? json?.error ?? "Error al inscribir"
                          if (!res.ok) { toast.error(errorMsg); return }
                          toast.success("Inscripción agregada")
                          setNewRegPlayer(""); setNewRegPartner("")
                          const next = await fetch(`/api/torneos/${selectedTorneo.id}/inscripciones`, { credentials: "include" }).then(r => r.json())
                          if (next?.data) setInscripciones(next.data)
                        } catch { toast.error("Error de conexión") }
                        finally { setSubmittingReg(false) }
                      }}>
                        {submittingReg ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar"}
                      </Button>
                    </div>
                    <ul className="space-y-2 mt-4">
                      {inscripciones.list.map((r) => (
                        <li key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                          <span>{r.type === "PAIR" ? `${r.playerName} + ${r.partnerName ?? "—"}` : r.playerName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">{r.type === "PAIR" ? "Pareja" : "Solo"}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                              if (!selectedTorneo) return
                              const res = await fetch(`/api/torneos/${selectedTorneo.id}/inscripciones/${r.id}`, { method: "DELETE", credentials: "include" })
                              if (!res.ok) { toast.error("Error al eliminar"); return }
                              toast.success("Inscripción eliminada")
                              const next = await fetch(`/api/torneos/${selectedTorneo.id}/inscripciones`, { credentials: "include" }).then(rr => rr.json())
                              if (next?.data) setInscripciones(next.data)
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {inscripciones.list.length === 0 && <p className="text-muted-foreground text-sm">Sin inscripciones aún.</p>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTorneoId} onOpenChange={(open) => !open && setDeleteTorneoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar torneo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se liberarán los bloqueos de canchas y se eliminarán las inscripciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={async () => {
                if (!deleteTorneoId) return
                setDeleting(true)
                try {
                  const res = await fetch(`/api/torneos/${deleteTorneoId}`, { method: "DELETE", credentials: "include" })
                  const json = await res.json()
                  if (!res.ok) { toast.error(json?.message ?? "Error al eliminar"); return }
                  toast.success("Torneo eliminado")
                  setDeleteTorneoId(null)
                  setView("historial")
                  setSelectedTorneo(null)
                  fetchTorneos()
                } catch { toast.error("Error de conexión") }
                finally { setDeleting(false) }
                setDeleteTorneoId(null)
              }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {view === "crear" && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Stepper & Form (80%) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">

          {/* Stepper with Progress Line */}
          <div className="w-full max-w-3xl mx-auto mb-8 px-4">
            <div className="relative flex items-center justify-between">
              {/* Background Line */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[1px] bg-gray-300 dark:bg-gray-600" />

              {/* Progress Line */}
              <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[1px] bg-blue-600 transition-all duration-500 ease-in-out"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />

              {[1, 2, 3].map((s) => {
                const isActive = step === s
                const isCompleted = step > s

                return (
                  <div key={s} className="flex flex-col items-center relative">
                    {/* Dot */}
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 z-10 box-content border-4 border-gray-50 dark:border-gray-900 ${isActive ? 'bg-blue-600 ring-1 ring-blue-600 dark:ring-blue-400 scale-125' :
                        isCompleted ? 'bg-blue-600' :
                          'bg-gray-300 dark:bg-gray-600'
                        }`}
                    />

                    {/* Label */}
                    <span className={`absolute top-6 w-32 text-center text-xs font-medium transition-colors duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' :
                      isCompleted ? 'text-foreground' :
                        'text-muted-foreground'
                      }`}>
                      {s === 1 ? '1. Datos del torneo' : s === 2 ? '2. Días y franjas' : '3. Vista previa'}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Spacer for labels */}
            <div className="h-6" />
          </div>

          {/* Form Card */}
          <div className="relative bg-card border border-border/50 shadow-sm rounded-xl p-8 transition-all duration-300">
            {isSuperAdmin && !editTorneoId && (
              <div className="mb-6 pb-6 border-b border-border/50">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Club (tenant)</label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Seleccione el club para el torneo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">

                {/* Group 1: Datos del Evento */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Datos del Evento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-4 border-l-2 border-border/50 ml-1">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Título del Torneo</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Trophy className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all" placeholder="Ej. Torneo Apertura 2024" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Categoría</label>
                      <div className="flex flex-wrap gap-2">
                        {MAIN_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${category === cat ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-background text-foreground border-input hover:border-blue-500 hover:text-blue-500'}`}
                          >
                            Categoría {cat}
                          </button>
                        ))}

                        {!showAllCategories && (
                          <button
                            onClick={() => setShowAllCategories(true)}
                            className="px-4 py-2 rounded-full text-sm font-medium border border-dashed border-input bg-muted/50 text-muted-foreground hover:text-foreground hover:border-foreground transition-all flex items-center gap-1"
                          >
                            Otros <ChevronDown className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {showAllCategories && (
                        <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in zoom-in-95 duration-200">
                          {OTHER_CATEGORIES.map(cat => {
                            const isSuma = cat === "Suma"
                            const isSelected = category === cat || (isSuma && category.startsWith("Suma"))

                            if (isSuma) {
                              return (
                                <div key={cat} className={`flex items-center rounded-full border transition-all overflow-hidden ${isSelected ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20' : 'bg-background border-input'}`}>
                                  <button
                                    onClick={() => handleCategorySelect("Suma")}
                                    className={`px-4 py-2 text-sm font-medium ${isSelected ? 'text-white' : 'text-foreground hover:text-blue-500'}`}
                                  >
                                    Suma
                                  </button>
                                  {isSelected && (
                                    <input
                                      type="number"
                                      className="w-12 bg-transparent text-white text-sm font-medium focus:outline-none text-center border-l border-white/20 h-full py-2"
                                      value={category.replace("Suma ", "")}
                                      onChange={(e) => setCategory(`Suma ${e.target.value}`)}
                                    />
                                  )}
                                </div>
                              )
                            }

                            return (
                              <button
                                key={cat}
                                onClick={() => handleCategorySelect(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-background text-foreground border-input hover:border-blue-500 hover:text-blue-500'}`}
                              >
                                {cat === "Mixto" ? "Mixto" : `Categoría ${cat}`}
                              </button>
                            )
                          })}
                          <button
                            onClick={() => setShowAllCategories(false)}
                            className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Group 2: Incentivos */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Medal className="w-4 h-4" />
                      Incentivos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-border/50 ml-1">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Premio (1er lugar)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Medal className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <input value={prizeFirst} onChange={e => handlePrizeChange(setPrizeFirst, e.target.value)} className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all" placeholder="$ 0" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Premio (2do lugar)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Medal className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <input value={prizeSecond} onChange={e => handlePrizeChange(setPrizeSecond, e.target.value)} className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all" placeholder="$ 0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Reglas */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Reglas
                    </h3>
                    <div className="pl-4 border-l-2 border-border/50 ml-1 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Parejas mínimas</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <input type="number" min={1} value={pairs} onChange={e => setPairs(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all" placeholder="Ej. 12" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Parejas máximas</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <input type="number" min={1} value={maxPairs} onChange={e => setMaxPairs(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-base font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all" placeholder="Ej. 32" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end">
                  <button
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    onClick={() => setStep(2)}
                    disabled={!canContinueStep1}
                  >
                    <span>Continuar al Paso 2</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-foreground">Días del Torneo</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[280px] justify-start text-left font-normal",
                              !dayBlocks.length && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dayBlocks.length > 0 ? `${dayBlocks.length} días seleccionados` : "Seleccionar días"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="multiple"
                            selected={dayBlocks.map(d => new Date(d.date + 'T00:00:00'))}
                            onSelect={(dates) => {
                              if (!dates) return

                              // Convert dates to YYYY-MM-DD strings
                              const newDates = dates.map(d => format(d, 'yyyy-MM-dd'))

                              // Find dates to remove (present in dayBlocks but not in newDates)
                              const toRemove = dayBlocks.filter(b => !newDates.includes(b.date))

                              // Find dates to add (present in newDates but not in dayBlocks)
                              const toAdd = newDates.filter(d => !dayBlocks.some(b => b.date === d))

                              // Create new dayBlocks array
                              let updatedBlocks = [...dayBlocks]

                              // Remove blocks
                              updatedBlocks = updatedBlocks.filter(b => !toRemove.some(r => r.date === b.date))

                              // Add new blocks
                              toAdd.forEach(date => {
                                updatedBlocks.push({ date, ranges: [] })
                              })

                              // Sort by date
                              updatedBlocks.sort((a, b) => a.date.localeCompare(b.date))

                              setDayBlocks(updatedBlocks)
                            }}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {dayBlocks.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-muted rounded-xl bg-muted/20">
                        <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground text-sm">Selecciona los días en el calendario para configurar los horarios.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {dayBlocks.map(d => (
                      <div key={d.date} className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                              <CalendarIcon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">{formatDateEs(d.date)}</span>
                          </div>
                          <button className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors" onClick={() => removeDay(d.date)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {d.ranges.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border/50 shadow-sm">
                              <div className="grid grid-cols-2 gap-3 flex-1">
                                <div className="relative">
                                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                  <input type="time" value={r.start} onChange={e => updateRange(d.date, i, "start", e.target.value)} className="w-full bg-transparent text-xs border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none pl-6 py-1" />
                                </div>
                                <div className="relative">
                                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                  <input type="time" value={r.end} onChange={e => updateRange(d.date, i, "end", e.target.value)} className="w-full bg-transparent text-xs border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 outline-none pl-6 py-1" />
                                </div>
                              </div>
                              <button onClick={() => removeRange(d.date, i)} className="text-gray-400 hover:text-red-500 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {hasStartTimeSelected(d.date) && (
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5 py-1">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              Horario confirmado
                            </p>
                          )}
                          <button
                            className="w-full py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-muted-foreground hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-center gap-2 transition-all"
                            onClick={() => addRange(d.date)}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Agregar Franja</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-8 border-t border-border/50">
                  <button className="px-6 py-2.5 text-muted-foreground font-medium hover:text-foreground transition-colors" onClick={() => setStep(1)}>Atrás</button>
                  <button
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                    onClick={() => setStep(3)}
                    disabled={!canContinueStep2}
                  >
                    <span>Revisar y Publicar</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
                <div className="text-center space-y-4 py-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20 animate-in zoom-in duration-500">
                    <Check className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-2xl">¡Todo listo para publicar!</h3>
                  <p className="text-muted-foreground">Revisa cuidadosamente la vista previa a la derecha. Si todo es correcto, publica tu torneo para que los jugadores puedan inscribirse.</p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 flex items-center gap-2 transform hover:scale-105"
                      onClick={handlePublish}
                      disabled={publishStatus === 'publishing'}
                    >
                      {publishStatus === 'publishing' ? 'Publicando...' : 'Publicar Torneo Ahora'}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(2)}
                    className="absolute bottom-8 left-8 h-8 px-3 text-xs font-medium gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver al paso anterior
                  </Button>
                  {publishError && (
                    <p className="text-sm text-destructive font-medium max-w-md text-center mx-auto">
                      {publishError}
                    </p>
                  )}
                  {!canPublish && !publishError && (
                    <p className="text-xs text-muted-foreground max-w-sm text-center mx-auto">
                      Completa el paso 1 (título, categoría, parejas) y en el paso 2 agrega al menos un día y una franja horaria con hora de inicio por cada día.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Preview (20%) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-8">
          <div className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Trophy className="w-32 h-32 transform rotate-12 -translate-y-4 translate-x-4" />
              </div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>

              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-medium border border-white/20 shadow-sm">
                    <Trophy className="w-3 h-3 mr-1 text-yellow-300" />
                    {preview.category || "Categoría"}
                  </div>
                  {(preview.minPairs != null || preview.maxPairs != null) && (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-medium border border-white/20 shadow-sm">
                      <Users className="w-3 h-3 mr-1 text-blue-200" />
                      {preview.minPairs != null && preview.maxPairs != null && preview.minPairs !== preview.maxPairs
                        ? `${preview.minPairs}-${preview.maxPairs} parejas`
                        : preview.minPairs != null
                          ? `Min ${preview.minPairs}`
                          : `Max ${preview.maxPairs}`}
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-md leading-tight">
                  {preview.title || "Título del Torneo"}
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-6 bg-gradient-to-b from-card to-muted/20">
              {/* Prizes Section */}
              <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Medal className="w-3 h-3" />
                  Premios
                </h3>
                <div className="space-y-3">
                  <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-3 flex items-center gap-3 transition-all hover:shadow-sm">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600 dark:text-yellow-400 shadow-inner">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wide">1er Lugar</p>
                      <p className="text-sm font-bold text-foreground">{preview.prizeFirst || "—"}</p>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/10 dark:to-slate-900/10 border border-gray-100 dark:border-gray-800 rounded-lg p-3 flex items-center gap-3 transition-all hover:shadow-sm">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 shadow-inner">
                      <Medal className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-wide">2do Lugar</p>
                      <p className="text-sm font-bold text-foreground">{preview.prizeSecond || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              {preview.dayBlocks.length > 0 ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" />
                    Cronograma
                  </h3>
                  <div className="space-y-2">
                    {preview.dayBlocks.map((d, i) => {
                      const dateObj = new Date(d.date + 'T00:00:00')
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors">
                          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md p-1.5 w-12 text-center shadow-sm">
                            <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider leading-none">{dateObj.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
                            <span className="text-lg font-black text-foreground leading-none mt-0.5">{dateObj.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground capitalize truncate">{dateObj.toLocaleDateString('es-AR', { weekday: 'long' })}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {d.ranges.map((r, j) => {
                                const effectiveEnd = (r.end && r.end.trim()) ? r.end : (r.start ? getEndOrDefault(r.end) : "")
                                const rangeLabel = effectiveEnd ? `${r.start} - ${effectiveEnd}` : (r.start || "—")
                                return (
                                  <span key={j} className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-[10px] font-medium border border-blue-100 dark:border-blue-800">
                                    {rangeLabel}
                                  </span>
                                )
                              })}
                              {d.ranges.length === 0 && <span className="text-[10px] text-muted-foreground italic">Sin horarios</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <div className="mx-auto w-8 h-8 bg-muted rounded-full flex items-center justify-center mb-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground">Define los días para ver el cronograma.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
