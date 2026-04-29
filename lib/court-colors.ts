/**
 * Paleta de colores para canchas (Tailwind). Una sola fuente de verdad para
 * persistir en Court.features y para fallback en tiempo de lectura.
 */
export const COURT_COLOR_PALETTE = [
  { color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  { color: 'from-red-400 to-red-600', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  { color: 'from-green-400 to-green-600', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  { color: 'from-orange-400 to-orange-600', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  { color: 'from-pink-400 to-pink-600', bgColor: 'bg-pink-100', textColor: 'text-pink-700' },
  { color: 'from-cyan-400 to-cyan-600', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700' },
  { color: 'from-gray-300 to-gray-500', bgColor: 'bg-gray-200', textColor: 'text-gray-700' },
] as const

export type CourtColorFeatures = {
  color: string
  bgColor: string
  textColor: string
}

export type CourtType = 'OUTDOOR' | 'INDOOR'

/** Hex para uso en estilos inline (dashboard, slots), alineado con COURT_COLOR_PALETTE */
export const COURT_COLOR_HEX = [
  '#8b5cf6', // purple
  '#ef4444', // red
  '#008000', // verde bosque (cancha 3)
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6b7280', // gray
] as const

/**
 * Opción A (docs/design/canchas-colores-marca-interior-exterior.md):
 * interior = violeta alineado al dashboard; exterior = cielo (distinto del teal de UI #0EA5E9).
 */
export const COURT_TYPE_GRADIENT_HEX: Record<CourtType, { from: string; to: string }> = {
  INDOOR: { from: '#6d5ebd', to: '#7c6fd4' },
  OUTDOOR: { from: '#38bdf8', to: '#5ab3e8' },
}

export const COURT_TYPE_COLORS: Record<CourtType, CourtColorFeatures & { hex: string }> = {
  OUTDOOR: {
    color: 'from-sky-400 to-sky-500',
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-700',
    hex: '#38bdf8',
  },
  INDOOR: {
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-700',
    hex: '#6d5ebd',
  },
}

export function normalizeCourtType(type?: string | null): CourtType {
  return type === 'INDOOR' ? 'INDOOR' : 'OUTDOOR'
}

export function getCourtFeaturesByType(type?: string | null): CourtColorFeatures {
  const normalizedType = normalizeCourtType(type)
  const item = COURT_TYPE_COLORS[normalizedType]
  return { color: item.color, bgColor: item.bgColor, textColor: item.textColor }
}

export function getCourtHexByType(type?: string | null): string {
  return COURT_TYPE_COLORS[normalizeCourtType(type)].hex
}

/**
 * Devuelve el objeto de features (color, bgColor, textColor) para la cancha
 * número courtNumber (1-based). Se usa (courtNumber - 1) % paleta.length.
 * Para guardar en Court.features como JSON.
 */
export function getCourtFeaturesByIndex(courtNumber: number): CourtColorFeatures {
  const n = Math.max(1, Math.floor(courtNumber))
  const idx = (n - 1) % COURT_COLOR_PALETTE.length
  const item = COURT_COLOR_PALETTE[idx]
  return { color: item.color, bgColor: item.bgColor, textColor: item.textColor }
}

/**
 * Devuelve el color hex para mostrar el nombre de la cancha (slots, dashboard).
 * Si se pasa `courtType`, usa la paleta semántica interior/exterior (opción A).
 * Si no, fallback por índice numérico del nombre (legado).
 */
export function getCourtHexForDisplay(
  courtId: string,
  courtName: string,
  courtType?: string | null
): string {
  if (courtType !== undefined && courtType !== null && courtType !== '') {
    return getCourtHexByType(courtType)
  }
  const name = (courtName || '').toLowerCase().trim()
  const m = name.match(/cancha\s*(\d+)/i)
  let n = m ? Number(m[1]) : 0
  if (!n) {
    if (courtId === 'cmew6nvsd0001u2jcngxgt8au' || name.includes(' a') || name.startsWith('a')) n = 1
    else if (courtId === 'cmew6nvsd0002u2jcc24nirbn' || name.includes(' b') || name.startsWith('b')) n = 2
    else if (courtId === 'cmew6nvi40000u2jcmer3av60' || name.includes(' c') || name.startsWith('c')) n = 3
  }
  if (!n || n < 1) n = 1
  const idx = (n - 1) % COURT_COLOR_HEX.length
  return COURT_COLOR_HEX[idx]
}
