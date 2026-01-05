import { unstable_cache as cache } from 'next/cache'
import { prisma } from '../database/neon-config'

// Claves en SystemSetting utilizadas para horarios por defecto
const KEY_OPERATING_START = 'operating_hours_start'
const KEY_OPERATING_END = 'operating_hours_end'
const KEY_SLOT_DURATION = 'default_slot_duration'

// Obtiene y cachea los horarios por defecto desde SystemSetting
export const getDefaultOperatingHours = cache(
  async (tenantId?: string | null) => {
    try {
      // Si no hay tenantId, devolver valores por defecto hardcodeados
      if (!tenantId) {
        return { start: '08:00', end: '23:00', slot_duration: 90 }
      }

      const [startSetting, endSetting, durationSetting] = await Promise.all([
        prisma.systemSetting.findFirst({ 
          where: { 
            key: KEY_OPERATING_START,
            tenantId: tenantId
          } 
        }),
        prisma.systemSetting.findFirst({ 
          where: { 
            key: KEY_OPERATING_END,
            tenantId: tenantId
          } 
        }),
        prisma.systemSetting.findFirst({ 
          where: { 
            key: KEY_SLOT_DURATION,
            tenantId: tenantId
          } 
        }),
      ])

      const start = startSetting?.value || '08:00'
      const end = endSetting?.value || '23:00'
      const slot_duration = durationSetting ? parseInt(durationSetting.value, 10) || 90 : 90

      return { start, end, slot_duration }
    } catch (error) {
      console.error('Error obteniendo SystemSetting (operating hours):', error)
      // Fallback seguro en caso de error
      return { start: '08:00', end: '23:00', slot_duration: 90 }
    }
  },
  ['system-settings', 'default-operating-hours'],
  {
    revalidate: 60,
    tags: ['system-settings:operating-hours']
  }
)
