"use client"

import { useMemo, useState, Fragment } from "react"
import { Trophy, Calendar as CalendarIcon, Clock, Plus, Trash2 } from "lucide-react"

export default function Page() {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [prizeFirst, setPrizeFirst] = useState("")
  const [prizeSecond, setPrizeSecond] = useState("")
  const [pairs, setPairs] = useState<number | "">("")
  const [newDay, setNewDay] = useState("")
  const [dayBlocks, setDayBlocks] = useState<{ date: string; ranges: { start: string; end: string }[] }[]>([])
  const [publishStatus, setPublishStatus] = useState<'idle'|'publishing'|'success'|'error'>('idle')

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

  const canContinueStep1 = title.trim().length > 0 && category.trim().length > 0
  const canContinueStep2 = dayBlocks.length > 0
  const canPublish = canContinueStep1 && canContinueStep2 && dayBlocks.every(d => d.ranges.length > 0 && d.ranges.every(r => r.start))

  const preview = useMemo(() => ({ title, category, prizeFirst, prizeSecond, pairs: pairs === "" ? undefined : Number(pairs), dayBlocks }), [title, category, prizeFirst, prizeSecond, pairs, dayBlocks])

  async function handlePublish() {
    if (!canPublish) return
    try {
      setPublishStatus('publishing')
      await new Promise(res => setTimeout(res, 600))
      setPublishStatus('success')
    } catch {
      setPublishStatus('error')
    }
  }

  function addDay() {
    if (!newDay) return
    if (dayBlocks.some(d => d.date === newDay)) return
    setDayBlocks([...dayBlocks, { date: newDay, ranges: [] }])
    setNewDay("")
  }

  function removeDay(date: string) {
    setDayBlocks(dayBlocks.filter(d => d.date !== date))
  }

  function addRange(date: string) {
    setDayBlocks(dayBlocks.map(d => d.date === date ? { ...d, ranges: [...d.ranges, { start: "", end: "" }] } : d))
  }

  function hasPendingRange(date: string) {
    const d = dayBlocks.find(x => x.date === date)
    if (!d) return false
    return d.ranges.some(r => !r.end || !r.start)
  }

  function acceptPendingRange(date: string) {
    setDayBlocks(dayBlocks.map(d => {
      if (d.date !== date) return d
      const ranges = d.ranges.map(r => {
        if (!r.start && !r.end) return r
        return { ...r, end: getEndOrDefault(r.end) }
      })
      const cleaned = ranges.filter(r => r.start)
      return { ...d, ranges: cleaned }
    }))
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3">
        <Trophy className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-semibold text-foreground">Torneos</h1>
      </div>
      <p className="mt-2 text-muted-foreground">Crea torneos con su descripción y bloquea las franjas horarias de los días seleccionados.</p>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <button className={`px-4 py-2 rounded-md text-sm font-medium ${step === 1 ? 'bg-blue-600 text-white' : 'bg-muted text-foreground'}`} onClick={() => setStep(1)}>1. Datos del torneo</button>
        <button className={`px-4 py-2 rounded-md text-sm font-medium ${step === 2 ? 'bg-blue-600 text-white' : 'bg-muted text-foreground'}`} onClick={() => setStep(2)} disabled={!canContinueStep1}>2. Días y franjas</button>
        <button className={`px-4 py-2 rounded-md text-sm font-medium ${step === 3 ? 'bg-blue-600 text-white' : 'bg-muted text-foreground'}`} onClick={() => setStep(3)} disabled={!canContinueStep1 || !canContinueStep2}>3. Vista previa</button>
      </div>

      {step === 1 && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Título</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre del torneo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Categoría</label>
              <input value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Categoría (A, B, Mixto, etc.)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Premio (1er lugar)</label>
              <input value={prizeFirst} onChange={e => setPrizeFirst(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Trofeo + $100.000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Premio (2do lugar)</label>
              <input value={prizeSecond} onChange={e => setPrizeSecond(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Medallas + $50.000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Cantidad mínima de parejas (opcional)</label>
              <input type="number" min={1} value={pairs} onChange={e => setPairs(e.target.value === "" ? "" : Number(e.target.value))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. 16" />
              <p className="mt-1 text-xs text-muted-foreground">Este valor es orientativo y puede ajustarse hasta el día del torneo.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 dark:disabled:bg-gray-700" onClick={() => setStep(2)} disabled={!canContinueStep1}>Continuar</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-5 h-5 text-foreground" />
            <span className="text-sm text-muted-foreground">Selecciona los días del torneo y agrega franjas horarias por día</span>
          </div>
          <div className="flex items-end space-x-3">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Día</label>
              <input lang="es-AR" type="date" value={newDay} onChange={e => setNewDay(e.target.value)} className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-background dark:text-foreground" />
              </div>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2" onClick={addDay}>
              <Plus className="w-4 h-4" />
              <span>Agregar día</span>
            </button>
          </div>
          <div className="space-y-6">
            {dayBlocks.map(d => (
              <div key={d.date} className="rounded-lg border p-4 bg-card text-card-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{formatDateEs(d.date)}</span>
                  </div>
                  <button className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-muted rounded-md flex items-center space-x-1" onClick={() => removeDay(d.date)}>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar día</span>
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                      {d.ranges.map((r, i) => (
                        <Fragment key={i}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground">Inicio</label>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <input aria-label="Hora de inicio (24 hs)" type="time" value={r.start} onChange={e => updateRange(d.date, i, "start", e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-background dark:text-foreground" />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Formato 24 hs (HH:mm)</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground">Fin</label>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <input aria-label="Hora de fin (24 hs)" type="time" value={r.end} onChange={e => updateRange(d.date, i, "end", e.target.value)} className={`mt-1 w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${r.start && r.end && timeToMinutes(r.end) <= timeToMinutes(r.start) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'} dark:bg-background dark:text-foreground`} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">Formato 24 hs (HH:mm)</p>
                          {r.start && r.end && timeToMinutes(r.end) <= timeToMinutes(r.start) && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">La hora de fin debe ser posterior a la de inicio.</p>
                          )}
                        </div>
                        <div className="flex md:justify-end">
                          <button className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-muted rounded-md flex items-center space-x-2" onClick={() => removeRange(d.date, i)}>
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar franja</span>
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 overflow-x-auto">
                        <div className="flex items-center space-x-2">
                          {generateSlots().map((s) => {
                            const disabledByStart = !!r.start && !r.end && (timeToMinutes(s) >= timeToMinutes(r.start))
                            const invalidRange = !!r.start && !!r.end && (timeToMinutes(r.end) <= timeToMinutes(r.start))
                            const disabled: boolean = disabledByStart || invalidRange
                            const baseBtn = 'px-2 py-1 text-xs rounded-md border'
                            const enabledBtn = 'bg-card text-foreground border-gray-300 dark:border-gray-600 hover:bg-muted'
                            const disabledBtn = 'bg-muted text-muted-foreground cursor-not-allowed'
                            const className = `${baseBtn} ${disabled ? disabledBtn : enabledBtn}`
                            return (
                              <button key={s} disabled={disabled} className={className}>{s}</button>
                            )
                          })}
                        </div>
                         {!r.end && r.start && (
                           <p className="mt-2 text-xs text-muted-foreground">Desde {r.start} se deshabilitan horarios posteriores hasta 23:59. Selecciona fin para ajustar.</p>
                         )}
                      </div>
                  </Fragment>
                ))}
              <button className={`px-3 py-2 ${hasPendingRange(d.date) ? 'bg-green-600' : 'bg-blue-600'} text-white rounded-md flex items-center space-x-2`} onClick={() => (hasPendingRange(d.date) ? acceptPendingRange(d.date) : addRange(d.date))}>
                <Plus className="w-4 h-4" />
                <span>{hasPendingRange(d.date) ? 'Aceptar' : 'Agregar franja'}</span>
              </button>
              </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <button className="px-4 py-2 bg-muted text-foreground rounded-md" onClick={() => setStep(1)}>Atrás</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 dark:disabled:bg-gray-700" onClick={() => setStep(3)} disabled={!canContinueStep2}>Continuar</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg border p-4 bg-card text-card-foreground">
            <h2 className="text-lg font-semibold text-foreground">Resumen</h2>
            {publishStatus === 'success' && (
              <div className="mt-3 rounded-md bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-100 px-3 py-2 text-sm">Torneo publicado</div>
            )}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Título</div>
                <div className="font-medium text-foreground">{preview.title || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Categoría</div>
                <div className="font-medium text-foreground">{preview.category || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Premio (1er lugar)</div>
                <div className="font-medium text-foreground">{preview.prizeFirst || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Premio (2do lugar)</div>
                <div className="font-medium text-foreground">{preview.prizeSecond || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cantidad de parejas</div>
                <div className="font-medium text-foreground">{preview.pairs ?? "—"}</div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground">Días y franjas</h3>
              <div className="mt-2 space-y-4">
                {preview.dayBlocks.map(d => (
                  <div key={d.date} className="rounded-md border p-3 bg-card text-card-foreground">
                    <div className="font-medium text-foreground">{formatDateEs(d.date)}</div>
                    <ul className="mt-2 list-disc list-inside text-muted-foreground">
                      {d.ranges.map((r, i) => (
                        <li key={i}>{r.start || "—"} — {getEndOrDefault(r.end)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <button className="px-4 py-2 bg-muted text-foreground rounded-md" onClick={() => setStep(2)}>Atrás</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300 dark:disabled:bg-gray-700" onClick={handlePublish} disabled={!canPublish || publishStatus === 'publishing'}>{publishStatus === 'publishing' ? 'Publicando…' : 'Publicar torneo'}</button>
          </div>
        </div>
      )}
    </div>
  )
}