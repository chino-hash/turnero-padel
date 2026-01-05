import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/database/neon-config'
import { encryptCredential } from '@/lib/encryption/credential-encryption'
import { isSuperAdminUser, type User as PermissionsUser } from '@/lib/utils/permissions'
import { z } from 'zod'

export const runtime = 'nodejs'

// Schema de validación para actualizar tenant
const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  isActive: z.boolean().optional(),
  subscriptionPlan: z.string().optional().nullable(),
  subscriptionExpiresAt: z.string().optional().nullable(),
  // Credenciales de Mercado Pago (opcionales, se encriptan)
  mercadoPagoAccessToken: z.string().optional().nullable(),
  mercadoPagoPublicKey: z.string().optional().nullable(),
  mercadoPagoWebhookSecret: z.string().optional().nullable(),
  mercadoPagoEnabled: z.boolean().optional(),
  mercadoPagoEnvironment: z.enum(['sandbox', 'production']).optional(),
}).partial()

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/tenants/[id] - Obtener tenant específico (solo super admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id },
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

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: tenant })
  } catch (error) {
    console.error('Error in GET /api/tenants/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/tenants/[id] - Actualizar tenant (solo super admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params
    const body = await request.json()
    const validated = updateTenantSchema.parse(body)

    // Verificar que el tenant existe
    const existing = await prisma.tenant.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    }

    // Si se está actualizando el slug, verificar que no esté en uso
    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.tenant.findUnique({
        where: { slug: validated.slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'El slug ya está en uso' },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {}

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.slug !== undefined) updateData.slug = validated.slug
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    if (validated.subscriptionPlan !== undefined) updateData.subscriptionPlan = validated.subscriptionPlan
    if (validated.mercadoPagoEnabled !== undefined) updateData.mercadoPagoEnabled = validated.mercadoPagoEnabled
    if (validated.mercadoPagoEnvironment !== undefined) updateData.mercadoPagoEnvironment = validated.mercadoPagoEnvironment

    if (validated.subscriptionExpiresAt !== undefined) {
      updateData.subscriptionExpiresAt = validated.subscriptionExpiresAt
        ? new Date(validated.subscriptionExpiresAt)
        : null
    }

    // Encriptar credenciales de Mercado Pago si están presentes
    if (validated.mercadoPagoAccessToken !== undefined) {
      updateData.mercadoPagoAccessToken = validated.mercadoPagoAccessToken
        ? encryptCredential(validated.mercadoPagoAccessToken)
        : null
    }

    if (validated.mercadoPagoPublicKey !== undefined) {
      updateData.mercadoPagoPublicKey = validated.mercadoPagoPublicKey
        ? encryptCredential(validated.mercadoPagoPublicKey)
        : null
    }

    if (validated.mercadoPagoWebhookSecret !== undefined) {
      updateData.mercadoPagoWebhookSecret = validated.mercadoPagoWebhookSecret
        ? encryptCredential(validated.mercadoPagoWebhookSecret)
        : null
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ success: true, data: tenant })
  } catch (error) {
    console.error('Error in PUT /api/tenants/[id]:', error)
    
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

// DELETE /api/tenants/[id] - Eliminar tenant (solo super admin) - NO IMPLEMENTADO por seguridad
// En su lugar, se desactiva el tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: 'Eliminación de tenants no permitida. Use PUT para desactivar el tenant.' },
    { status: 405 }
  )
}


