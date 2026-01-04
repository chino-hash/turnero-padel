/**
 * Script de migración para convertir datos existentes a arquitectura multitenant
 * 
 * Este script:
 * 1. Crea un tenant por defecto si no existe
 * 2. Asigna todos los registros existentes al tenant por defecto
 * 3. Migra administradores (ADMIN_EMAILS → super admins o admins del tenant por defecto)
 * 4. Genera un reporte detallado
 * 
 * IMPORTANTE: Ejecutar este script DESPUÉS de aplicar la migración de Prisma
 * 
 * Uso:
 *   npx tsx scripts/migrate-to-multitenant.ts
 */

import { PrismaClient } from '@prisma/client';
import { encryptCredential } from '../lib/encryption/credential-encryption';
import { getAdminConfig, getSuperAdminConfig } from '../lib/config/env';

const prisma = new PrismaClient();

interface MigrationReport {
  tenantCreated: boolean;
  defaultTenantId: string | null;
  usersMigrated: number;
  courtsMigrated: number;
  bookingsMigrated: number;
  paymentsMigrated: number;
  productsMigrated: number;
  systemSettingsMigrated: number;
  recurringBookingsMigrated: number;
  adminsMigrated: number;
  superAdminsCreated: number;
  errors: string[];
  warnings: string[];
}

const DEFAULT_TENANT_SLUG = 'default';
const DEFAULT_TENANT_NAME = 'Tenant Por Defecto';

async function createDefaultTenant(): Promise<string> {
  console.log('📦 Creando tenant por defecto...');
  
  // Verificar si ya existe
  const existing = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG }
  });

  if (existing) {
    console.log(`✅ Tenant por defecto ya existe: ${existing.id}`);
    return existing.id;
  }

  // Crear tenant por defecto
  const tenant = await prisma.tenant.create({
    data: {
      name: DEFAULT_TENANT_NAME,
      slug: DEFAULT_TENANT_SLUG,
      isActive: true,
      settings: JSON.stringify({}),
      mercadoPagoEnabled: false,
      mercadoPagoEnvironment: 'sandbox'
    }
  });

  console.log(`✅ Tenant por defecto creado: ${tenant.id}`);
  return tenant.id;
}

async function migrateUsers(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('👥 Migrando usuarios...');
  
  try {
    // Buscar usuarios que NO tienen un tenantId válido (que no apunta a un tenant existente)
    // Esto maneja tanto NULL como valores inválidos
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM "User" u
      LEFT JOIN "Tenant" t ON u."tenantId" = t.id
      WHERE t.id IS NULL OR u."tenantId" IS NULL
    `;
    
    const count = Number(countResult[0]?.count || 0);
    
    if (count === 0) {
      console.log('   No hay usuarios para migrar');
      return;
    }

    const result = await prisma.$executeRaw`
      UPDATE "User" u
      SET "tenantId" = ${defaultTenantId}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Tenant" t WHERE t.id = u."tenantId"
      ) OR u."tenantId" IS NULL
    `;

    report.usersMigrated = Number(result);
    console.log(`   ✅ ${result} usuarios migrados`);
  } catch (error: any) {
    const errorMsg = `Error migrando usuarios: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migrateCourts(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('🏟️ Migrando canchas...');
  
  try {
    // Buscar canchas que NO tienen un tenantId válido
    const result = await prisma.$executeRaw`
      UPDATE "Court" c
      SET "tenantId" = ${defaultTenantId}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Tenant" t WHERE t.id = c."tenantId"
      ) OR c."tenantId" IS NULL
    `;

    report.courtsMigrated = Number(result);
    console.log(`   ✅ ${result} canchas migradas`);
  } catch (error: any) {
    const errorMsg = `Error migrando canchas: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migrateBookings(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('📅 Migrando reservas...');
  
  try {
    const result = await prisma.$executeRaw`
      UPDATE "Booking" b
      SET "tenantId" = ${defaultTenantId}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Tenant" t WHERE t.id = b."tenantId"
      ) OR b."tenantId" IS NULL
    `;

    report.bookingsMigrated = Number(result);
    console.log(`   ✅ ${result} reservas migradas`);
  } catch (error: any) {
    const errorMsg = `Error migrando reservas: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migratePayments(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('💳 Migrando pagos...');
  
  try {
    const result = await prisma.$executeRaw`
      UPDATE "Payment" p
      SET "tenantId" = ${defaultTenantId}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Tenant" t WHERE t.id = p."tenantId"
      ) OR p."tenantId" IS NULL
    `;

    report.paymentsMigrated = Number(result);
    console.log(`   ✅ ${result} pagos migrados`);
  } catch (error: any) {
    const errorMsg = `Error migrando pagos: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migrateProducts(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('🛍️ Migrando productos...');
  
  try {
    const result = await prisma.$executeRaw`
      UPDATE "Producto" p
      SET "tenantId" = ${defaultTenantId}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Tenant" t WHERE t.id = p."tenantId"
      ) OR p."tenantId" IS NULL
    `;

    report.productsMigrated = Number(result);
    console.log(`   ✅ ${result} productos migrados`);
  } catch (error: any) {
    const errorMsg = `Error migrando productos: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migrateSystemSettings(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('⚙️ Migrando configuraciones del sistema...');
  
  try {
    const result = await prisma.$executeRaw`
      UPDATE "SystemSetting" s
      SET "tenantId" = ${defaultTenantId}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Tenant" t WHERE t.id = s."tenantId"
      ) OR s."tenantId" IS NULL
    `;

    report.systemSettingsMigrated = Number(result);
    console.log(`   ✅ ${result} configuraciones migradas`);
  } catch (error: any) {
    const errorMsg = `Error migrando configuraciones: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migrateRecurringBookings(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('🔄 Migrando reservas recurrentes...');
  
  try {
    const result = await prisma.$executeRaw`
      UPDATE "RecurringBooking" r
      SET "tenantId" = ${defaultTenantId}
      WHERE NOT EXISTS (
        SELECT 1 FROM "Tenant" t WHERE t.id = r."tenantId"
      ) OR r."tenantId" IS NULL
    `;

    report.recurringBookingsMigrated = Number(result);
    console.log(`   ✅ ${result} reservas recurrentes migradas`);
  } catch (error: any) {
    const errorMsg = `Error migrando reservas recurrentes: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migrateAdmins(defaultTenantId: string, report: MigrationReport): Promise<void> {
  console.log('🔐 Migrando administradores...');
  
  try {
    const adminConfig = getAdminConfig();
    const superAdminConfig = getSuperAdminConfig();
    
    // Migrar ADMIN_EMAILS a super admins (si SUPER_ADMIN_EMAILS no está configurado)
    // O a admins del tenant por defecto si SUPER_ADMIN_EMAILS está configurado
    const adminEmails = adminConfig.emails || [];
    const superAdminEmails = superAdminConfig.emails || [];
    
    // Si hay SUPER_ADMIN_EMAILS configurado, usar esos para super admins
    // Si no, usar ADMIN_EMAILS para super admins
    const emailsToMakeSuperAdmin = superAdminEmails.length > 0 
      ? superAdminEmails 
      : adminEmails;
    
    const emailsToMakeTenantAdmin = superAdminEmails.length > 0 
      ? adminEmails 
      : [];

    // Crear super admins
    for (const email of emailsToMakeSuperAdmin) {
      try {
        const normalizedEmail = email.toLowerCase().trim();
        
        // Verificar si ya existe
        const existing = await prisma.adminWhitelist.findFirst({
          where: {
            email: normalizedEmail,
            tenantId: null
          }
        });

        if (existing) {
          // Actualizar a SUPER_ADMIN si no lo es
          if (existing.role !== 'SUPER_ADMIN') {
            await prisma.adminWhitelist.update({
              where: { id: existing.id },
              data: { role: 'SUPER_ADMIN' }
            });
            report.superAdminsCreated++;
          }
        } else {
          await prisma.adminWhitelist.create({
            data: {
              email: normalizedEmail,
              tenantId: null, // Super admin
              role: 'SUPER_ADMIN',
              isActive: true,
              notes: 'Migrado desde variables de entorno'
            }
          });
          report.superAdminsCreated++;
        }
      } catch (error: any) {
        report.warnings.push(`No se pudo crear super admin para ${email}: ${error.message}`);
      }
    }

    // Crear admins del tenant por defecto (si hay emails para eso)
    for (const email of emailsToMakeTenantAdmin) {
      try {
        const normalizedEmail = email.toLowerCase().trim();
        
        // Verificar si ya existe como super admin o admin del tenant
        const existing = await prisma.adminWhitelist.findFirst({
          where: {
            email: normalizedEmail
          }
        });

        if (!existing) {
          await prisma.adminWhitelist.create({
            data: {
              email: normalizedEmail,
              tenantId: defaultTenantId,
              role: 'ADMIN',
              isActive: true,
              notes: 'Migrado desde ADMIN_EMAILS'
            }
          });
          report.adminsMigrated++;
        }
      } catch (error: any) {
        report.warnings.push(`No se pudo crear admin del tenant para ${email}: ${error.message}`);
      }
    }

    // Migrar AdminWhitelist existente en la BD
    const existingAdmins = await prisma.adminWhitelist.findMany({
      where: {
        tenantId: null,
        role: {
          not: 'SUPER_ADMIN'
        }
      }
    });

    for (const admin of existingAdmins) {
      try {
        // Si no está en la lista de super admins, asignarlo al tenant por defecto
        if (!emailsToMakeSuperAdmin.includes(admin.email.toLowerCase())) {
          await prisma.adminWhitelist.update({
            where: { id: admin.id },
            data: {
              tenantId: defaultTenantId,
              role: 'ADMIN'
            }
          });
          report.adminsMigrated++;
        }
      } catch (error: any) {
        report.warnings.push(`No se pudo migrar admin ${admin.email}: ${error.message}`);
      }
    }

    console.log(`   ✅ ${report.superAdminsCreated} super admins creados`);
    console.log(`   ✅ ${report.adminsMigrated} admins del tenant migrados`);
  } catch (error: any) {
    const errorMsg = `Error migrando administradores: ${error.message}`;
    report.errors.push(errorMsg);
    console.error(`   ❌ ${errorMsg}`);
  }
}

async function migrateMercadoPagoCredentials(defaultTenantId: string): Promise<void> {
  console.log('💳 Migrando credenciales de Mercado Pago...');
  
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const environment = process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox';

    if (!accessToken) {
      console.log('   ⚠️ No hay credenciales de Mercado Pago en variables de entorno');
      return;
    }

    // Verificar si el tenant ya tiene credenciales
    const tenant = await prisma.tenant.findUnique({
      where: { id: defaultTenantId },
      select: { mercadoPagoAccessToken: true }
    });

    if (tenant?.mercadoPagoAccessToken) {
      console.log('   ⚠️ El tenant ya tiene credenciales de Mercado Pago configuradas');
      return;
    }

    // Encriptar credenciales
    let encryptedAccessToken: string | null = null;
    let encryptedWebhookSecret: string | null = null;

    try {
      encryptedAccessToken = encryptCredential(accessToken);
      if (webhookSecret) {
        encryptedWebhookSecret = encryptCredential(webhookSecret);
      }
    } catch (error: any) {
      console.warn(`   ⚠️ No se pudieron encriptar las credenciales (falta CREDENTIAL_ENCRYPTION_KEY?): ${error.message}`);
      // Continuar sin encriptar si no hay clave de encriptación
      encryptedAccessToken = accessToken;
      encryptedWebhookSecret = webhookSecret || null;
    }

    // Actualizar tenant con credenciales
    await prisma.tenant.update({
      where: { id: defaultTenantId },
      data: {
        mercadoPagoAccessToken: encryptedAccessToken,
        mercadoPagoPublicKey: publicKey || null,
        mercadoPagoWebhookSecret: encryptedWebhookSecret,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: environment
      }
    });

    console.log('   ✅ Credenciales de Mercado Pago migradas');
  } catch (error: any) {
    console.error(`   ⚠️ Error migrando credenciales de Mercado Pago: ${error.message}`);
    // No es crítico, continuar
  }
}

function printReport(report: MigrationReport): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 REPORTE DE MIGRACIÓN');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Tenant por defecto: ${report.tenantCreated ? 'Creado' : 'Ya existía'}`);
  console.log(`   ID: ${report.defaultTenantId}`);
  
  console.log(`\n📦 Registros migrados:`);
  console.log(`   👥 Usuarios: ${report.usersMigrated}`);
  console.log(`   🏟️ Canchas: ${report.courtsMigrated}`);
  console.log(`   📅 Reservas: ${report.bookingsMigrated}`);
  console.log(`   💳 Pagos: ${report.paymentsMigrated}`);
  console.log(`   🛍️ Productos: ${report.productsMigrated}`);
  console.log(`   ⚙️ Configuraciones: ${report.systemSettingsMigrated}`);
  console.log(`   🔄 Reservas recurrentes: ${report.recurringBookingsMigrated}`);
  
  console.log(`\n🔐 Administradores:`);
  console.log(`   🌟 Super admins creados: ${report.superAdminsCreated}`);
  console.log(`   👨‍💼 Admins del tenant: ${report.adminsMigrated}`);
  
  if (report.warnings.length > 0) {
    console.log(`\n⚠️ Advertencias (${report.warnings.length}):`);
    report.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (report.errors.length > 0) {
    console.log(`\n❌ Errores (${report.errors.length}):`);
    report.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (report.errors.length === 0) {
    console.log('✅ Migración completada exitosamente');
  } else {
    console.log('⚠️ Migración completada con errores');
  }
  console.log('='.repeat(60) + '\n');
}

async function main() {
  const report: MigrationReport = {
    tenantCreated: false,
    defaultTenantId: null,
    usersMigrated: 0,
    courtsMigrated: 0,
    bookingsMigrated: 0,
    paymentsMigrated: 0,
    productsMigrated: 0,
    systemSettingsMigrated: 0,
    recurringBookingsMigrated: 0,
    adminsMigrated: 0,
    superAdminsCreated: 0,
    errors: [],
    warnings: []
  };

  try {
    console.log('🚀 Iniciando migración a arquitectura multitenant...\n');

    // 1. Crear tenant por defecto
    const defaultTenantId = await createDefaultTenant();
    report.defaultTenantId = defaultTenantId;
    report.tenantCreated = true;

    // 2. Migrar datos
    await migrateUsers(defaultTenantId, report);
    await migrateCourts(defaultTenantId, report);
    await migrateBookings(defaultTenantId, report);
    await migratePayments(defaultTenantId, report);
    await migrateProducts(defaultTenantId, report);
    await migrateSystemSettings(defaultTenantId, report);
    await migrateRecurringBookings(defaultTenantId, report);

    // 3. Migrar administradores
    await migrateAdmins(defaultTenantId, report);

    // 4. Migrar credenciales de Mercado Pago
    await migrateMercadoPagoCredentials(defaultTenantId);

    // 5. Mostrar reporte
    printReport(report);

  } catch (error: any) {
    console.error('\n❌ Error fatal en la migración:', error);
    report.errors.push(`Error fatal: ${error.message}`);
    printReport(report);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch((error) => {
    console.error('Error no manejado:', error);
    process.exit(1);
  });
}

export { main as migrateToMultitenant };

