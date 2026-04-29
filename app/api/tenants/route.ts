import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { DEFAULT_COURT_VALUES, getDefaultOperatingHoursJson } from '@/lib/constants/court-defaults'
import { tryEncrypt } from '@/lib/encryption/credential-encryption'
import { getCourtFeaturesByType } from '@/lib/court-colors'
import { getPlanDefaultCourts } from '@/lib/subscription-plans'
import { isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const runtime = 'nodejs'

// Schema de validación para crear/actualizar tenant
const tenantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  isActive: z.boolean().optional(),
  subscriptionPlan: z.enum(['BASIC', 'MEDIUM', 'PREMIUM']).optional().default('BASIC'),
  subscriptionExpiresAt: z.string().optional(),
  // Credenciales de Mercado Pago (opcionales, se encriptan)
  mercadoPagoAccessToken: z.string().optional(),
  mercadoPagoPublicKey: z.string().optional(),
  mercadoPagoWebhookSecret: z.string().optional(),
  mercadoPagoEnabled: z.boolean().optional(),
  mercadoPagoEnvironment: z.enum(['sandbox', 'production']).optional(),
  ownerEmail: z.string().email().optional().or(z.literal('')),
})

// GET /api/tenants - Listar todos los tenants (solo super admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Se requieren permisos de Super Administrador' }, { status: 403 })
    }

    const tenants = await prisma.tenant.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            courts: true,
            bookings: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: tenants }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Error in GET /api/tenants:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/tenants - Crear nuevo tenant (solo super admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user: PermissionsUser = {
      id: session.user.id,
      email: session.user.email || null,
      role: session.user.role || 'USER',
      isAdmin: session.user.isAdmin || false,
      isSuperAdmin: session.user.isSuperAdmin || false,
      tenantId: session.user.tenantId || null,
    }

    const isSuperAdmin = await isSuperAdminUser(user)
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Se requieren permisos de Super Administrador' }, { status: 403 })
    }

    const body = await request.json()
    const validated = tenantSchema.parse(body)

    // Verificar que el slug no esté en uso
    const existing = await prisma.tenant.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El slug ya está en uso' },
        { status: 400 }
      )
    }

    // Encriptar credenciales de Mercado Pago si están presentes
    const ownerEmailTrimmed = validated.ownerEmail?.trim()
    const plan = validated.subscriptionPlan ?? 'BASIC'
    const tenantData: any = {
      name: validated.name,
      slug: validated.slug,
      isActive: validated.isActive ?? true,
      subscriptionPlan: plan,
      mercadoPagoEnabled: validated.mercadoPagoEnabled ?? false,
      mercadoPagoEnvironment: validated.mercadoPagoEnvironment ?? 'sandbox',
    }
    if (ownerEmailTrimmed) {
      tenantData.ownerEmail = ownerEmailTrimmed
    }

    if (validated.subscriptionExpiresAt) {
      tenantData.subscriptionExpiresAt = new Date(validated.subscriptionExpiresAt)
    }

    if (validated.mercadoPagoAccessToken) {
      tenantData.mercadoPagoAccessToken = tryEncrypt(validated.mercadoPagoAccessToken)
    }

    if (validated.mercadoPagoPublicKey) {
      tenantData.mercadoPagoPublicKey = tryEncrypt(validated.mercadoPagoPublicKey)
    }

    if (validated.mercadoPagoWebhookSecret) {
      tenantData.mercadoPagoWebhookSecret = tryEncrypt(validated.mercadoPagoWebhookSecret)
    }

    const tenant = await prisma.tenant.create({
      data: tenantData,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: true,
        ownerEmail: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (ownerEmailTrimmed) {
      const email = ownerEmailTrimmed.toLowerCase()
      try {
        await prisma.adminWhitelist.upsert({
          where: {
            email_tenantId: { email, tenantId: tenant.id },
          },
          create: {
            tenantId: tenant.id,
            email,
            role: 'ADMIN',
            isActive: true,
            notes: 'Admin del tenant (creado al crear tenant)',
          },
          update: { isActive: true, role: 'ADMIN' },
        })
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return NextResponse.json(
            {
              success: false,
              error:
                'No se pudo asociar el admin por una restricción única en la base de datos. Ejecute la migración para permitir el mismo email en distintos tenants.',
            },
            { status: 409 }
          )
        }
        throw error
      }
    }

    // Crear canchas por defecto según plan (3 / 6 / 9) y home_card_settings inicial.
    // Rollback completo si falla cualquier parte del bootstrap inicial del tenant.
    const numCourts = getPlanDefaultCourts(plan)
    const operatingHoursJson = getDefaultOperatingHoursJson()
    try {
      for (let n = 1; n <= numCourts; n++) {
        await prisma.court.create({
          data: {
            tenantId: tenant.id,
            name: `Cancha ${n}`,
            description: `Cancha ${n}`,
            courtType: 'OUTDOOR',
            basePrice: DEFAULT_COURT_VALUES.basePrice,
            priceMultiplier: 1,
            features: JSON.stringify(getCourtFeaturesByType('OUTDOOR')),
            operatingHours: operatingHoursJson,
            isActive: true,
          } as any,
        })
      }

      await prisma.systemSetting.create({
        data: {
          tenantId: tenant.id,
          key: 'home_card_settings',
          value: JSON.stringify({
            labelCourtName: 'Canchas',
            locationName: tenant.name,
            mapUrl: '',
            sessionText: '90 min por turno',
            descriptionText:
              'Visualiza la disponibilidad del día actual para las canchas. Selecciona una para ver sus horarios y características.',
            iconImage: '',
          }),
          description: 'Configuración de la tarjeta principal del home',
          category: 'ui',
          isPublic: true,
        },
      })
    } catch (courtError) {
      console.error('Error creando datos iniciales del tenant, rollback:', courtError)
      await prisma.court.deleteMany({ where: { tenantId: tenant.id } })
      if (ownerEmailTrimmed) {
        const email = ownerEmailTrimmed.toLowerCase()
        await prisma.adminWhitelist.deleteMany({ where: { tenantId: tenant.id, email } })
      }
      await prisma.tenant.delete({ where: { id: tenant.id } })
      return NextResponse.json(
        { success: false, error: 'Error creando datos iniciales del tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: tenant }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/tenants:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

