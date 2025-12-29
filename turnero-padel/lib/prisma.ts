import { PrismaClient } from '@prisma/client'
import { isProduction } from './config/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (!isProduction) globalForPrisma.prisma = prisma
