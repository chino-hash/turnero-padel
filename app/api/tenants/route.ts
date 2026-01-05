import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { encryptCredential } from '@/lib/encryption/credential-encryption'
import { isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { z } from 'zod'

export const runtime = 'nodejs'

// Schema de validación para crear/actualizar tenant
const tenantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  isActive: z.boolean().optional(),
  subscriptionPlan: z.string().optional(),
  subscriptionExpiresAt: z.string().optional(),
  // Credenciales de Mercado Pago (opcionales, se encriptan)
  mercadoPagoAccessToken: z.string().optional(),
  mercadoPagoPublicKey: z.string().optional(),
  mercadoPagoWebhookSecret: z.string().optional(),
  mercadoPagoEnabled: z.boolean().optional(),
  mercadoPagoEnvironment: z.enum(['sandbox', 'production']).optional(),
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

    return NextResponse.json({ success: true, data: tenants })
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
    const tenantData: any = {
      name: validated.name,
      slug: validated.slug,
      isActive: validated.isActive ?? true,
      subscriptionPlan: validated.subscriptionPlan,
      mercadoPagoEnabled: validated.mercadoPagoEnabled ?? false,
      mercadoPagoEnvironment: validated.mercadoPagoEnvironment ?? 'sandbox',
    }

    if (validated.subscriptionExpiresAt) {
      tenantData.subscriptionExpiresAt = new Date(validated.subscriptionExpiresAt)
    }

    if (validated.mercadoPagoAccessToken) {
      tenantData.mercadoPagoAccessToken = encryptCredential(validated.mercadoPagoAccessToken)
    }

    if (validated.mercadoPagoPublicKey) {
      tenantData.mercadoPagoPublicKey = encryptCredential(validated.mercadoPagoPublicKey)
    }

    if (validated.mercadoPagoWebhookSecret) {
      tenantData.mercadoPagoWebhookSecret = encryptCredential(validated.mercadoPagoWebhookSecret)
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
        createdAt: true,
        updatedAt: true,
      },
    })

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

