/**
 * Script para migrar credenciales globales de Mercado Pago al tenant por defecto
 * 
 * Uso:
 *   npx tsx scripts/migrate-mercadopago-to-tenant.ts
 * 
 * Requisitos:
 *   - Variables de entorno: MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET (opcional), MERCADOPAGO_PUBLIC_KEY (opcional)
 *   - CREDENTIAL_ENCRYPTION_KEY debe estar configurada para encriptar credenciales
 *   - Base de datos accesible
 */

import { PrismaClient } from '@prisma/client';
import { encryptCredential } from '../lib/encryption/credential-encryption';

const prisma = new PrismaClient();

const DEFAULT_TENANT_SLUG = 'default';
const DEFAULT_TENANT_NAME = 'Tenant Por Defecto';

async function main() {
  console.log('🚀 Iniciando migración de credenciales de Mercado Pago al tenant por defecto...\n');

  try {
    // Leer credenciales de variables de entorno
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
    const environment = (process.env.MERCADOPAGO_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

    if (!accessToken) {
      console.error('❌ Error: MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno');
      console.log('\nPor favor, configura las siguientes variables de entorno:');
      console.log('  - MERCADOPAGO_ACCESS_TOKEN (requerido)');
      console.log('  - MERCADOPAGO_WEBHOOK_SECRET (opcional)');
      console.log('  - MERCADOPAGO_PUBLIC_KEY (opcional)');
      console.log('  - MERCADOPAGO_ENVIRONMENT (opcional, default: sandbox)');
      process.exit(1);
    }

    console.log('📋 Credenciales encontradas:');
    console.log(`   - Access Token: ${accessToken.substring(0, 20)}...`);
    console.log(`   - Webhook Secret: ${webhookSecret ? webhookSecret.substring(0, 20) + '...' : 'No configurado'}`);
    console.log(`   - Public Key: ${publicKey ? publicKey.substring(0, 20) + '...' : 'No configurado'}`);
    console.log(`   - Environment: ${environment}\n`);

    // Obtener o crear tenant por defecto
    let tenant = await prisma.tenant.findUnique({
      where: { slug: DEFAULT_TENANT_SLUG },
      select: {
        id: true,
        name: true,
        mercadoPagoEnabled: true,
        mercadoPagoAccessToken: true,
      },
    });

    if (!tenant) {
      console.log(`📦 Creando tenant por defecto (slug: ${DEFAULT_TENANT_SLUG})...`);
      tenant = await prisma.tenant.create({
        data: {
          name: DEFAULT_TENANT_NAME,
          slug: DEFAULT_TENANT_SLUG,
          isActive: true,
          settings: JSON.stringify({}),
          mercadoPagoEnabled: false,
          mercadoPagoEnvironment: 'sandbox',
        },
        select: {
          id: true,
          name: true,
          mercadoPagoEnabled: true,
          mercadoPagoAccessToken: true,
        },
      });
      console.log(`✅ Tenant por defecto creado: ${tenant.id}\n`);
    } else {
      console.log(`✅ Tenant por defecto encontrado: ${tenant.id} (${tenant.name})\n`);
    }

    // Verificar si el tenant ya tiene credenciales
    if (tenant.mercadoPagoAccessToken) {
      console.log('⚠️  El tenant ya tiene credenciales de Mercado Pago configuradas.');
      console.log('   Si deseas sobrescribirlas, elimina las credenciales existentes primero.\n');
      
      const overwrite = process.argv.includes('--overwrite');
      if (!overwrite) {
        console.log('   Para sobrescribir, ejecuta el script con --overwrite');
        process.exit(0);
      }
      console.log('   Sobrescribiendo credenciales existentes...\n');
    }

    // Encriptar credenciales
    console.log('🔐 Encriptando credenciales...');
    let encryptedAccessToken: string;
    let encryptedWebhookSecret: string | null = null;

    try {
      encryptedAccessToken = encryptCredential(accessToken);
      console.log('   ✅ Access Token encriptado');

      if (webhookSecret) {
        encryptedWebhookSecret = encryptCredential(webhookSecret);
        console.log('   ✅ Webhook Secret encriptado');
      } else {
        console.log('   ⚠️  Webhook Secret no configurado, se dejará vacío');
      }
    } catch (error) {
      console.error('❌ Error encriptando credenciales:', error);
      
      if (error instanceof Error && error.message.includes('CREDENTIAL_ENCRYPTION_KEY')) {
        console.error('\n💡 Solución:');
        console.error('   Necesitas configurar CREDENTIAL_ENCRYPTION_KEY en las variables de entorno.');
        console.error('   Genera una clave con:');
        console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      }
      
      process.exit(1);
    }

    // Actualizar tenant con credenciales
    console.log('\n💾 Actualizando tenant con credenciales...');
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        mercadoPagoAccessToken: encryptedAccessToken,
        mercadoPagoPublicKey: publicKey || null,
        mercadoPagoWebhookSecret: encryptedWebhookSecret,
        mercadoPagoEnabled: true,
        mercadoPagoEnvironment: environment,
      },
    });

    console.log('✅ Credenciales migradas exitosamente al tenant por defecto!\n');
    console.log('📝 Resumen:');
    console.log(`   - Tenant: ${tenant.id} (${tenant.name})`);
    console.log(`   - Mercado Pago: Habilitado`);
    console.log(`   - Environment: ${environment}`);
    console.log(`   - Access Token: Configurado y encriptado`);
    console.log(`   - Webhook Secret: ${encryptedWebhookSecret ? 'Configurado y encriptado' : 'No configurado'}`);
    console.log(`   - Public Key: ${publicKey ? 'Configurado' : 'No configurado'}\n`);

    console.log('🎉 Migración completada exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Verifica que las credenciales funcionen correctamente');
    console.log('   2. Configura el webhook en Mercado Pago si aún no lo has hecho');
    console.log('   3. Considera eliminar las variables de entorno globales después de verificar que todo funciona');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
