# Instrucciones para Migración a PostgreSQL

## Paso 1: Crear cuenta en Neon (REQUERIDO)

1. Ve a https://console.neon.tech/signup
2. Regístrate con tu email, GitHub, Google u otra cuenta
3. Crea un nuevo proyecto:
   - Nombre del proyecto: `turnero-padel`
   - Versión de PostgreSQL: Última disponible
   - Región: Selecciona la más cercana a tu ubicación
   - Base de datos: `neondb` (por defecto)

## Paso 2: Obtener cadena de conexión

1. En el dashboard de tu proyecto, haz clic en "Connect"
2. Copia la cadena de conexión que se ve así:
   ```
   postgresql://usuario:contraseña@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## Paso 3: Actualizar configuración

1. Abre el archivo `.env.local`
2. Reemplaza la línea `DATABASE_URL="file:./prisma/dev.db"` con:
   ```
   DATABASE_URL="tu_cadena_de_conexion_de_neon_aqui"
   ```

## Paso 4: Ejecutar migración

Una vez que hayas completado los pasos anteriores, ejecuta:
```powershell
.\scripts\migrate-to-postgresql.ps1 full
```

## Notas importantes:

- Neon ofrece un plan gratuito con 512 MB de almacenamiento
- Se crean automáticamente dos ramas: `production` y `development`
- La conexión usa SSL por defecto (requerido)
- Guarda tu cadena de conexión de forma segura

## Próximos pasos después de la migración:

1. Verificar que las tablas se crearon correctamente
2. Ejecutar el seeding de datos si es necesario
3. Probar la aplicación con la nueva base de datos
4. Actualizar las pruebas para usar PostgreSQL