const { PrismaClient } = require('@prisma/client')
const { z } = require('zod')

// Utilidades y esquemas Zod
const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const OperatingHoursSchema = z
  .object({
    start: z.string().regex(HHMM_REGEX, 'start debe ser "HH:mm"'),
    end: z.string().regex(HHMM_REGEX, 'end debe ser "HH:mm"'),
    slot_duration: z.number().int().positive().min(15).max(360)
  })

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const CourtFeaturesSchema = z.object({
  color: z.string().regex(HEX_COLOR, 'color debe ser #RRGGBB'),
  bgColor: z.string().regex(HEX_COLOR, 'bgColor debe ser #RRGGBB'),
  textColor: z.string().regex(HEX_COLOR, 'textColor debe ser #RRGGBB')
})

function validateOrThrow(schema, value, label) {
  const result = schema.safeParse(value)
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`[${label}] Datos inválidos: ${details}`)
  }
  return result.data
}

const prisma = new PrismaClient()

async function upsertCourtByName(cfg) {
  const existing = await prisma.court.findFirst({ where: { name: cfg.name } })
  const validFeatures = validateOrThrow(CourtFeaturesSchema, cfg.featuresObj, `Court.features (${cfg.name})`)
  const validHours = validateOrThrow(OperatingHoursSchema, cfg.operatingHoursObj, `Court.operatingHours (${cfg.name})`)

  if (existing) {
    await prisma.court.update({
      where: { id: existing.id },
      data: {
        description: cfg.description,
        basePrice: cfg.basePrice,
        priceMultiplier: cfg.priceMultiplier,
        features: JSON.stringify(validFeatures),
        operatingHours: JSON.stringify(validHours),
        isActive: cfg.isActive
      }
    })
    console.log(`✅ Cancha actualizada: ${cfg.name}`)
  } else {
    await prisma.court.create({
      data: {
        name: cfg.name,
        description: cfg.description,
        basePrice: cfg.basePrice,
        priceMultiplier: cfg.priceMultiplier,
        features: JSON.stringify(validFeatures),
        operatingHours: JSON.stringify(validHours),
        isActive: cfg.isActive
      }
    })
    console.log(`✅ Cancha creada: ${cfg.name}`)
  }
}

async function seedCourts() {
  try {
    console.log('🌱 Validando y creando/actualizando canchas de prueba...')

    const courtsConfig = [
      {
        name: 'Cancha 1',
        description: 'Professional court with LED lighting',
        basePrice: 6000,
        priceMultiplier: 1.0,
        featuresObj: { color: '#8b5cf6', bgColor: '#a78bfa', textColor: '#ffffff' },
        operatingHoursObj: { start: '08:00', end: '22:30', slot_duration: 90 },
        isActive: true
      },
      {
        name: 'Cancha 2',
        description: 'Standard court with quality surface',
        basePrice: 6000,
        priceMultiplier: 0.9,
        featuresObj: { color: '#ef4444', bgColor: '#f87171', textColor: '#ffffff' },
        operatingHoursObj: { start: '08:00', end: '22:30', slot_duration: 90 },
        isActive: true
      },
      {
        name: 'Cancha 3',
        description: 'Premium court with enhanced features',
        basePrice: 6000,
        priceMultiplier: 1.2,
        featuresObj: { color: '#22c55e', bgColor: '#4ade80', textColor: '#ffffff' },
        operatingHoursObj: { start: '08:00', end: '22:30', slot_duration: 90 },
        isActive: true
      }
    ]

    for (const cfg of courtsConfig) {
      await upsertCourtByName(cfg)
    }

    console.log('🎉 Seed de canchas completado')
  } catch (error) {
    console.error('❌ Error creando/actualizando canchas:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCourts()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
