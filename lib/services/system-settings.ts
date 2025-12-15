import { unstable_cache as cache } from 'next/cache'
import { prisma } from '../prisma'

// Claves en SystemSetting utilizadas para horarios por defecto
const KEY_OPERATING_START = 'operating_hours_start'
const KEY_OPERATING_END = 'operating_hours_end'
const KEY_SLOT_DURATION = 'default_slot_duration'

// Obtiene y cachea los horarios por defecto desde SystemSetting
export const getDefaultOperatingHours = cache(
  async () => {
    try {
      const [startSetting, endSetting, durationSetting] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: KEY_OPERATING_START } }),
        prisma.systemSetting.findUnique({ where: { key: KEY_OPERATING_END } }),
        prisma.systemSetting.findUnique({ where: { key: KEY_SLOT_DURATION } }),
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
