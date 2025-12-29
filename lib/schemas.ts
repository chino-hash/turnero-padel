import { z } from 'zod'

// Util: valida formato HH:MM
function isValidHHMM(value: string): boolean {
  if (typeof value !== 'string') return false
  const match = value.match(/^\d{2}:\d{2}$/)
  if (!match) return false
  const [hh, mm] = value.split(':').map(Number)
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59
}

// Schema: Operating Hours
export const OperatingHoursSchema = z.object({
  start: z.string().refine(isValidHHMM, 'start debe tener formato HH:MM'),
  end: z.string().refine(isValidHHMM, 'end debe tener formato HH:MM'),
  slot_duration: z.number().int().positive()
})

// Schema: Court Features (sin imponer formato estricto de color)
export const CourtFeaturesSchema = z.object({
  color: z.string().min(1),
  bgColor: z.string().min(1),
  textColor: z.string().min(1)
})

// Helper: formatea errores de Zod para logs legibles
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ')
}

// Helper: parsea JSON con validación y fallback seguro
export function parseJsonSafely<T>(
  raw: unknown,
  schema: z.ZodSchema<T>,
  fallback: T
): { ok: boolean; data: T; error?: string } {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw
    const result = schema.safeParse(value)
    if (result.success) {
      return { ok: true, data: result.data }
    }
    return { ok: false, data: fallback, error: formatZodError(result.error) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido parseando JSON'
    return { ok: false, data: fallback, error: message }
  }
}