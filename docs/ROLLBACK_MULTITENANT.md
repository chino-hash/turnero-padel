# Guía de Rollback - Migración Multitenant

## ⚠️ ADVERTENCIA IMPORTANTE

**Este rollback revierte TODOS los cambios de la migración multitenant, incluyendo:**
- Eliminación de la tabla `Tenant` y todos sus datos
- Eliminación del campo `tenantId` de todas las tablas
- Eliminación del rol `SUPER_ADMIN` del enum `Role`
- Eliminación de índices y constraints relacionados

**⚠️ NO HAY RESTAURACIÓN AUTOMÁTICA DE DATOS**
- Este script NO restaura datos desde backup
- Debes tener un backup completo antes de ejecutar
- Después del rollback, deberás restaurar datos manualmente si es necesario

---

## 📋 Prerequisitos

1. **Backup de la base de datos**
   ```bash
   # Ejemplo con pg_dump
   pg_dump -h <host> -U <user> -d <database> > backup_pre_rollback.sql
   ```

2. **Revisar dependencias de código**
   - El código de la aplicación debe ser compatible con el schema sin multitenancy
   - Revertir cambios en código que dependan de `tenantId` o `Tenant`

3. **Verificar estado actual**
   - Confirmar que la migración multitenant está aplicada
   - Verificar que no hay datos críticos que se perderán

---

## 🔄 Proceso de Rollback

### Paso 1: Modo Dry-Run (Recomendado)

Primero ejecuta en modo dry-run para ver qué cambios se realizarían:

```bash
npx tsx scripts/rollback-multitenant.ts --dry-run
```

Esto mostrará todas las operaciones SQL que se ejecutarían sin hacer cambios reales.

### Paso 2: Ejecutar Rollback

Si estás seguro y tienes backup:

```bash
npx tsx scripts/rollback-multitenant.ts --confirm
```

El script realizará:

1. ✅ Eliminar foreign keys relacionadas con `Tenant`
2. ✅ Eliminar índices relacionados con `tenantId`
3. ✅ Eliminar campos `tenantId` de todas las tablas
4. ✅ Eliminar tabla `Tenant`
5. ✅ Recrear enum `Role` sin `SUPER_ADMIN`
6. ⚠️  **NOTA**: Constraints únicos originales deben restaurarse manualmente

### Paso 3: Regenerar Prisma Client

```bash
npx prisma generate
```

### Paso 4: Verificar Schema

```bash
npx prisma db pull
npx prisma format
```

Comparar el schema resultante con el schema original (antes de multitenancy).

---

## 📝 Cambios que el Script Realiza

### Tablas Afectadas

- `User` - Elimina `tenantId`, restaura constraint único de `email`
- `Court` - Elimina `tenantId`
- `Booking` - Elimina `tenantId`, elimina constraint único con `tenantId`
- `Payment` - Elimina `tenantId`
- `SystemSetting` - Elimina `tenantId`, elimina constraint único con `tenantId`
- `Producto` - Elimina `tenantId`
- `RecurringBooking` - Elimina `tenantId`
- `RecurringBookingException` - Elimina `tenantId`
- `AdminWhitelist` - Elimina `tenantId`

### Tablas Eliminadas

- `Tenant` - Eliminada completamente con todos sus datos

### Enums Modificados

- `Role` - Recreado sin `SUPER_ADMIN` (solo `USER`, `ADMIN`)

---

## 🔧 Restauración Manual de Constraints

Después del rollback, es posible que necesites restaurar constraints únicos según tu schema original. El script no puede inferirlos automáticamente.

Ejemplos comunes:

```sql
-- User: email único (si no existía antes con tenantId)
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");

-- Booking: constraint único original (ajustar según tu schema)
-- ALTER TABLE "Booking" ADD CONSTRAINT "Booking_courtId_bookingDate_startTime_endTime_key" 
--   UNIQUE ("courtId", "bookingDate", "startTime", "endTime");

-- SystemSetting: constraint único original (si aplicaba)
-- ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_key_key" UNIQUE ("key");
```

**⚠️ IMPORTANTE**: Verifica tu schema original antes de ejecutar estos queries.

---

## 📦 Restauración de Datos desde Backup

Si necesitas restaurar datos después del rollback:

```bash
# Restaurar desde backup
psql -h <host> -U <user> -d <database> < backup_pre_rollback.sql

# O usando pg_restore para backups binarios
pg_restore -h <host> -U <user> -d <database> backup_pre_rollback.dump
```

---

## 🔄 Revertir Cambios en el Código

Después del rollback de la base de datos, también debes:

1. **Revertir cambios en `prisma/schema.prisma`**
   - Eliminar modelo `Tenant`
   - Eliminar campos `tenantId`
   - Remover `SUPER_ADMIN` del enum `Role`
   - Restaurar constraints únicos originales

2. **Revertir cambios en código TypeScript/JavaScript**
   - Eliminar referencias a `tenantId`
   - Eliminar funciones/helpers relacionados con tenants
   - Revertir cambios en APIs que filtren por `tenantId`
   - Eliminar panel de super-admin (`app/super-admin/*`)

3. **Revertir cambios en variables de entorno**
   - Remover `SUPER_ADMIN_EMAILS` (si no se usa para otra cosa)
   - Remover `CREDENTIAL_ENCRYPTION_KEY` (si no se usa para otra cosa)

---

## ✅ Verificación Post-Rollback

Después del rollback, verifica:

1. ✅ La aplicación inicia sin errores
2. ✅ Las queries básicas funcionan (listar usuarios, canchas, reservas)
3. ✅ No hay referencias a `tenantId` en logs de error
4. ✅ El enum `Role` solo contiene `USER` y `ADMIN`
5. ✅ La tabla `Tenant` no existe
6. ✅ Constraints únicos están restaurados correctamente

---

## 🆘 Solución de Problemas

### Error: "enum type does not exist"
- El enum ya fue eliminado o no existe
- Continúa con el siguiente paso

### Error: "constraint already exists"
- El constraint ya existe, es seguro omitirlo
- El script maneja este caso automáticamente

### Error: "column does not exist"
- La columna ya fue eliminada
- Esto puede indicar que el rollback se ejecutó parcialmente
- Revisa el estado de la base de datos

### Base de datos en estado inconsistente
- Restaura desde backup
- Verifica el estado con: `npx prisma db pull`
- Compara con el schema esperado

---

## 📚 Referencias

- Script de migración: `scripts/migrate-to-multitenant.ts`
- Schema Prisma: `prisma/schema.prisma`
- Documentación de migración: (verificar si existe)

---

## ⚠️ Última Advertencia

**Este rollback es IRREVERSIBLE sin backup.**
- Asegúrate de tener backup completo
- Prueba primero en entorno de desarrollo/staging
- Verifica el dry-run antes de ejecutar con `--confirm`
- Considera las implicaciones en producción


