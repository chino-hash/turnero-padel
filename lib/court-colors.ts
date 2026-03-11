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
