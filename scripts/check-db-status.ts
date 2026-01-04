/**
 * Script para verificar el estado de la base de datos antes de la migración
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');

    // 1. Verificar si existe la tabla Tenant
    const tenantCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM "Tenant"
    `;
    console.log(`📦 Tenants: ${Number(tenantCount[0]?.count || 0)}`);

    // 2. Verificar usuarios y si tienen tenantId
    const userStats = await prisma.$queryRaw<Array<{ total: bigint; with_tenant: bigint; without_tenant: bigint }>>`
      SELECT 
        COUNT(*)::int as total,
        COUNT("tenantId")::int as with_tenant,
        COUNT(*)::int - COUNT("tenantId")::int as without_tenant
      FROM "User"
    `;
    const userStatsData = userStats[0];
    console.log(`👥 Usuarios:`);
    console.log(`   Total: ${Number(userStatsData?.total || 0)}`);
    console.log(`   Con tenantId: ${Number(userStatsData?.with_tenant || 0)}`);
    console.log(`   Sin tenantId: ${Number(userStatsData?.without_tenant || 0)}`);

    // 3. Verificar canchas
    const courtStats = await prisma.$queryRaw<Array<{ total: bigint; with_tenant: bigint; without_tenant: bigint }>>`
      SELECT 
        COUNT(*)::int as total,
        COUNT("tenantId")::int as with_tenant,
        COUNT(*)::int - COUNT("tenantId")::int as without_tenant
      FROM "Court"
    `;
    const courtStatsData = courtStats[0];
    console.log(`🏟️ Canchas:`);
    console.log(`   Total: ${Number(courtStatsData?.total || 0)}`);
    console.log(`   Con tenantId: ${Number(courtStatsData?.with_tenant || 0)}`);
    console.log(`   Sin tenantId: ${Number(courtStatsData?.without_tenant || 0)}`);

    // 4. Verificar reservas
    const bookingStats = await prisma.$queryRaw<Array<{ total: bigint; with_tenant: bigint; without_tenant: bigint }>>`
      SELECT 
        COUNT(*)::int as total,
        COUNT("tenantId")::int as with_tenant,
        COUNT(*)::int - COUNT("tenantId")::int as without_tenant
      FROM "Booking"
    `;
    const bookingStatsData = bookingStats[0];
    console.log(`📅 Reservas:`);
    console.log(`   Total: ${Number(bookingStatsData?.total || 0)}`);
    console.log(`   Con tenantId: ${Number(bookingStatsData?.with_tenant || 0)}`);
    console.log(`   Sin tenantId: ${Number(bookingStatsData?.without_tenant || 0)}`);

    // 5. Verificar si hay tenantIds que no apuntan a un tenant válido
    const invalidUserTenants = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM "User" u
      LEFT JOIN "Tenant" t ON u."tenantId" = t.id
      WHERE t.id IS NULL
    `;
    console.log(`⚠️ Usuarios con tenantId inválido: ${Number(invalidUserTenants[0]?.count || 0)}`);

    const invalidCourtTenants = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM "Court" c
      LEFT JOIN "Tenant" t ON c."tenantId" = t.id
      WHERE t.id IS NULL
    `;
    console.log(`⚠️ Canchas con tenantId inválido: ${Number(invalidCourtTenants[0]?.count || 0)}`);

    const invalidBookingTenants = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM "Booking" b
      LEFT JOIN "Tenant" t ON b."tenantId" = t.id
      WHERE t.id IS NULL
    `;
    console.log(`⚠️ Reservas con tenantId inválido: ${Number(invalidBookingTenants[0]?.count || 0)}`);

    // 6. Obtener algunos ejemplos de tenantIds existentes
    const sampleTenantIds = await prisma.$queryRaw<Array<{ tenantId: string; count: bigint }>>`
      SELECT "tenantId", COUNT(*)::int as count
      FROM "User"
      GROUP BY "tenantId"
      LIMIT 5
    `;
    console.log(`\n📋 Ejemplos de tenantIds en usuarios:`);
    sampleTenantIds.forEach(row => {
      console.log(`   ${row.tenantId}: ${Number(row.count)} usuarios`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P01') {
      console.error('   ⚠️ Parece que la tabla no existe. ¿Ya se aplicó la migración de Prisma?');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus().catch(console.error);



