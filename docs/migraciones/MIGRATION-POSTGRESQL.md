# Migración de SQLite a PostgreSQL

Esta guía te ayudará a migrar tu aplicación Turnero de Padel de SQLite a PostgreSQL.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Una base de datos PostgreSQL disponible (local o en la nube)

## 🚀 Opciones de Base de Datos PostgreSQL

### Opción 1: Docker Local (Recomendado para desarrollo)

1. **Instalar Docker Desktop**:
   - Descarga desde [docker.com](https://www.docker.com/products/docker-desktop/)
   - Sigue las instrucciones en `DOCKER-SETUP.md`

2. **Iniciar PostgreSQL**:
   ```powershell
   docker compose up -d postgres
   ```

3. **Verificar que funciona**:
   ```powershell
   docker compose ps
   ```

### Opción 2: Servicios en la Nube (Gratuitos)

#### Neon (Recomendado)
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la cadena de conexión

#### Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Ve a Settings > Database
5. Copia la cadena de conexión

#### Railway
1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto PostgreSQL
4. Copia la cadena de conexión

## ⚙️ Configuración

### 1. Configurar Variables de Entorno

```powershell
# Copia el archivo de ejemplo
Copy-Item .env.example .env.local

# Edita .env.local con tu editor favorito
notepad .env.local
```

**Configura la variable `DATABASE_URL`** con una de estas opciones:

```bash
# Docker local
DATABASE_URL="postgresql://turnero_user:turnero_password@localhost:5432/turnero_padel"

# Neon
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Railway
DATABASE_URL="postgresql://username:password@containers-us-west-xxx.railway.app:5432/railway"
```

### 2. Verificar Configuración

```powershell
# Usar el script de migración
.\scripts\migrate-to-postgresql.ps1 check
```

Este comando verificará:
- ✅ Node.js y npm instalados
- ✅ Prisma funcionando
- ✅ Archivo .env.local configurado
- ✅ Conexión a PostgreSQL

## 🔄 Proceso de Migración

### Opción A: Migración Automática (Recomendado)

```powershell
# Ejecuta todo el proceso de migración
.\scripts\migrate-to-postgresql.ps1 full
```

### Opción B: Migración Manual (Paso a Paso)

1. **Generar migración**:
   ```powershell
   .\scripts\migrate-to-postgresql.ps1 generate
   ```

2. **Aplicar migraciones**:
   ```powershell
   .\scripts\migrate-to-postgresql.ps1 deploy
   ```

3. **Poblar datos iniciales**:
   ```powershell
   .\scripts\migrate-to-postgresql.ps1 seed
   ```

## 🗂️ Migración de Datos Existentes

Si tienes datos en SQLite que quieres conservar:

### 1. Exportar datos de SQLite

```powershell
# Crear backup de la base de datos actual
npx prisma db pull --schema=prisma/schema-sqlite.prisma

# Exportar datos (si tienes datos importantes)
# Nota: Esto requiere un script personalizado
```

### 2. Importar a PostgreSQL

```powershell
# Después de configurar PostgreSQL, ejecutar:
.\scripts\migrate-to-postgresql.ps1 full

# Luego importar datos manualmente o con script personalizado
```

## 🧪 Verificación

### Probar la Aplicación

```powershell
# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Verificar Base de Datos

```powershell
# Ver tablas creadas
npx prisma studio

# O usar el script de verificación
.\scripts\migrate-to-postgresql.ps1 check
```

## 🔧 Comandos Útiles

```powershell
# Ver estado de migraciones
npx prisma migrate status

# Resetear base de datos (¡CUIDADO!)
.\scripts\migrate-to-postgresql.ps1 reset

# Generar cliente Prisma
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

## 🐛 Solución de Problemas

### Error: "Can't reach database server"
- Verifica que PostgreSQL esté ejecutándose
- Revisa la cadena de conexión en `.env.local`
- Si usas Docker: `docker compose ps`

### Error: "Database does not exist"
- La base de datos se creará automáticamente en la primera migración
- Si persiste, crea la base de datos manualmente

### Error: "SSL connection required"
- Agrega `?sslmode=require` al final de tu `DATABASE_URL`
- Esto es común con servicios en la nube

### Error de permisos
- Verifica que el usuario tenga permisos de escritura
- En servicios en la nube, usa las credenciales proporcionadas

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Setup Guide](../deployment/DOCKER-SETUP.md)
- [Database Setup Guide](./setup-database.md)

## ✅ Checklist de Migración

- [ ] PostgreSQL configurado y funcionando
- [ ] Archivo `.env.local` configurado
- [ ] Conexión a base de datos verificada
- [ ] Migraciones aplicadas exitosamente
- [ ] Aplicación funcionando con PostgreSQL
- [ ] Datos migrados (si aplica)
- [ ] Pruebas realizadas

¡Listo! Tu aplicación ahora usa PostgreSQL en lugar de SQLite.