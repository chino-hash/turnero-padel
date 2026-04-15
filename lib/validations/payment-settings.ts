import { z } from 'zod'

const transferAliasSchema = z
  .string()
  .trim()
  .max(100, 'El alias no puede superar 100 caracteres')
  .regex(/^[a-zA-Z0-9._-]+$/, 'El alias contiene caracteres inválidos')

const transferCbuSchema = z
  .string()
  .trim()
  .regex(/^\d{22}$/, 'El CBU debe tener 22 dígitos')

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} no puede superar ${max} caracteres`)

export const paymentSettingsQuerySchema = z.object({
  tenantId: z.string().cuid().optional(),
  tenantSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'tenantSlug inválido')
    .optional(),
})

export const updatePaymentSettingsSchema = z
  .object({
    tenantId: z.string().cuid().optional(),
    tenantSlug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, 'tenantSlug inválido')
      .optional(),
    mercadoPagoEnabled: z.boolean().optional(),
    mercadoPagoEnvironment: z.enum(['sandbox', 'production']).optional(),
    mercadoPagoAccessToken: optionalText(300, 'El access token').optional(),
    mercadoPagoPublicKey: optionalText(300, 'La public key').optional(),
    mercadoPagoWebhookSecret: optionalText(300, 'El webhook secret').optional(),
    clearMercadoPagoAccessToken: z.boolean().optional(),
    clearMercadoPagoPublicKey: z.boolean().optional(),
    clearMercadoPagoWebhookSecret: z.boolean().optional(),
    transferAlias: z.union([transferAliasSchema, z.literal('')]).optional(),
    transferCbu: z.union([transferCbuSchema, z.literal('')]).optional(),
    transferAccountHolder: optionalText(120, 'El titular').optional(),
    transferBank: optionalText(120, 'El banco').optional(),
    transferNotes: optionalText(400, 'Las observaciones').optional(),
  })
  .superRefine((data, ctx) => {
    const alias = data.transferAlias?.trim() || ''
    const cbu = data.transferCbu?.trim() || ''
    const holder = data.transferAccountHolder?.trim() || ''
    const bank = data.transferBank?.trim() || ''

    // Regla de consistencia suave: si hay datos de transferencia, debe existir titular.
    if ((alias || cbu || bank) && !holder) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferAccountHolder'],
        message: 'Si cargás alias/CBU/banco, también debés cargar titular',
      })
    }
  })

export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>
