import { prisma } from '@/lib/database/neon-config'

const KEY_VIP = 'usuario.categoria.vip.minReservas'
const KEY_PREMIUM = 'usuario.categoria.premium.minReservas'
export const DEFAULT_VIP_MIN = 20
export const DEFAULT_PREMIUM_MIN = 10

export interface UmbralesCategoria {
  vipMinReservas: number
  premiumMinReservas: number
}

export async function getUmbralesCategoria(tenantId: string): Promise<UmbralesCategoria> {
  const [vipSetting, premiumSetting] = await Promise.all([
    prisma.systemSetting.findFirst({ where: { key: KEY_VIP, tenantId } }),
    prisma.systemSetting.findFirst({ where: { key: KEY_PREMIUM, tenantId } }),
  ])
  const vip = vipSetting?.value != null ? parseInt(vipSetting.value, 10) : DEFAULT_VIP_MIN
  const premium = premiumSetting?.value != null ? parseInt(premiumSetting.value, 10) : DEFAULT_PREMIUM_MIN
  return {
    vipMinReservas: Number.isNaN(vip) ? DEFAULT_VIP_MIN : Math.max(0, vip),
    premiumMinReservas: Number.isNaN(premium) ? DEFAULT_PREMIUM_MIN : Math.max(0, premium),
  }
}

export function getCategoriaFromReservas(totalReservas: number, umbrales: UmbralesCategoria): 'VIP' | 'Premium' | 'Regular' {
  if (totalReservas >= umbrales.vipMinReservas) return 'VIP'
  if (totalReservas >= umbrales.premiumMinReservas) return 'Premium'
  return 'Regular'
}
