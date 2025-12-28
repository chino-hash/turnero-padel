# Guía de Instalación y Configuración

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18.17.0 o superior ([Descargar](https://nodejs.org/))
- **npm** o **pnpm** (recomendado) ([Instalar pnpm](https://pnpm.io/installation))
- **Git** v2.30.0 o superior ([Descargar](https://git-scm.com/))
- **PostgreSQL** v14.0 o superior (local) o cuenta de **Neon/Supabase**
- **VS Code** (recomendado) ([Descargar](https://code.visualstudio.com/))

### Verificar Instalaciones

```bash
# Verificar versiones
node --version  # v18.17.0 o superior
npm --version   # 9.0.0 o superior
pnpm --version  # 8.0.0 o superior (si usas pnpm)
git --version   # 2.30.0 o superior
```

## 🚀 Instalación Rápida (5 minutos)

### 1. Clonar el Repositorio

```bash
# Clonar el proyecto
git clone <repository-url>
cd turnero-padel
```

### 2. Instalar Dependencias

```bash
# Con npm
npm install

# Con pnpm (recomendado)
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env.local
```

### 4. Configurar Base de Datos

```bash
# Generar cliente Prisma
npx prisma generate

# Sincronizar esquema con la base de datos
npx prisma db push

# Opcional: Inicializar datos de ejemplo
npm run seed
```

### 5. Iniciar Servidor de Desarrollo

```bash
# Con npm
npm run dev

# Con pnpm
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## ⚙️ Configuración Detallada

### Variables de Entorno Requeridas

Edita el archivo `.env.local` con las siguientes variables:

```bash
# ============================================================================
# 🌍 ENTORNO
# ============================================================================
NODE_ENV=development

# ============================================================================
# 🔐 AUTENTICACIÓN
# ============================================================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-seguro-minimo-32-caracteres

# ============================================================================
# 🔑 OAUTH PROVIDERS
# ============================================================================
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# ============================================================================
# 🗄️ BASE DE DATOS
# ============================================================================
# Elige UNA opción:

# Opción 1: Neon (Recomendado para producción)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/database_name

# Opción 2: Docker Local (Desarrollo)
# DATABASE_URL=postgresql://turnero_user:turnero_password@localhost:5432/turnero_db

# Opción 3: PostgreSQL Local
# DATABASE_URL=postgresql://usuario:password@localhost:5432/turnero_padel

# ============================================================================
# 👥 ADMINISTRACIÓN
# ============================================================================
ADMIN_EMAILS=admin@ejemplo.com,otro-admin@ejemplo.com
```

### Configuración de Google OAuth

1. **Ir a Google Cloud Console:**
   - Visita [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente

2. **Habilitar APIs:**
   - Habilita la API de Google+ o Google Identity

3. **Crear Credenciales OAuth 2.0:**
   - Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
   - Tipo de aplicación: "Aplicación web"

4. **Configurar URLs de Redirección:**
   ```
   # Para desarrollo
   http://localhost:3000/api/auth/callback/google
   
   # Para producción
   https://tu-dominio.com/api/auth/callback/google
   ```

5. **Obtener Credenciales:**
   - Copia el `Client ID` y `Client Secret`
   - Agrégalos a tu archivo `.env.local`

## 🗄️ Configuración de Base de Datos

### Opción 1: Neon (Recomendado)

1. **Crear cuenta en Neon:**
   - Ve a [neon.tech](https://neon.tech)
   - Crea una cuenta gratuita
   - Crea un nuevo proyecto

2. **Obtener URL de conexión:**
   - Copia la `DATABASE_URL` desde el dashboard
   - Agrégala a tu `.env.local`

3. **Configurar Prisma:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Opción 2: PostgreSQL Local

1. **Instalar PostgreSQL:**
   - Descarga desde [postgresql.org](https://www.postgresql.org/download/)
   - Instala y configura

2. **Crear base de datos:**
   ```sql
   CREATE DATABASE turnero_padel;
   CREATE USER turnero_user WITH PASSWORD 'turnero_password';
   GRANT ALL PRIVILEGES ON DATABASE turnero_padel TO turnero_user;
   ```

3. **Configurar URL:**
   ```bash
   DATABASE_URL=postgresql://turnero_user:turnero_password@localhost:5432/turnero_padel
   ```

### Opción 3: Docker (Desarrollo)

1. **Crear archivo docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: turnero_padel
         POSTGRES_USER: turnero_user
         POSTGRES_PASSWORD: turnero_password
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Iniciar contenedor:**
   ```bash
   docker-compose up -d
   ```

## 🛠️ Scripts Disponibles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Verificar tipos TypeScript
npm run type-check

# Linting y formateo
npm run lint
npm run lint:fix
npm run format
```

### Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Sincronizar esquema
npm run db:push

# Abrir Prisma Studio
npm run db:studio

# Inicializar datos
npm run db:seed

# Reset completo
npm run db:reset
```

### Testing

```bash
# Tests unitarios
npm run test
npm run test:watch
npm run test:coverage

# Tests E2E con Playwright
npm run test:e2e
npm run test:e2e:ui

# Tests E2E con Cypress
npm run cypress:open
npm run cypress:run
```

### Construcción

```bash
# Construir para producción
npm run build

# Iniciar servidor de producción
npm run start
```

## 🔧 Configuración del Editor (VS Code)

### Extensiones Recomendadas

Instala estas extensiones para una mejor experiencia:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-jest"
  ]
}
```

### Configuración del Workspace

Crea `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "prisma.showPrismaDataPlatformNotification": false
}
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. **Conectar repositorio:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio de GitHub

2. **Configurar variables de entorno:**
   ```bash
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   NEXTAUTH_SECRET=tu-secret-super-seguro-32-caracteres
   GOOGLE_CLIENT_ID=tu-google-client-id
   GOOGLE_CLIENT_SECRET=tu-google-client-secret
   DATABASE_URL=tu-database-url-produccion
   ADMIN_EMAILS=admin@ejemplo.com
   NODE_ENV=production
   ```

3. **Actualizar Google OAuth:**
   - Agregar URL de callback de producción
   - `https://tu-dominio.vercel.app/api/auth/callback/google`

### Otras Plataformas

- **Netlify:** Consulta `docs/guides/deployment.md`
- **Railway:** Configuración automática con variables de entorno
- **DigitalOcean:** App Platform con configuración YAML

## 🔍 Verificación de Instalación

### Checklist Post-Instalación

- [ ] ✅ Servidor de desarrollo ejecutándose en `http://localhost:3000`
- [ ] ✅ Base de datos conectada correctamente
- [ ] ✅ Autenticación con Google funcionando
- [ ] ✅ Panel de administración accesible
- [ ] ✅ Tests pasando correctamente
- [ ] ✅ Linting sin errores

### Comandos de Verificación

```bash
# Verificar conexión a base de datos
npx prisma db pull

# Ejecutar tests básicos
npm run test

# Verificar build de producción
npm run build
```

## 🆘 Solución de Problemas

### Problemas Comunes

#### Error de Conexión a Base de Datos
```bash
# Verificar URL de conexión
echo $DATABASE_URL

# Probar conexión
npx prisma db pull
```

#### Error de Autenticación Google
- Verificar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- Confirmar URLs de callback en Google Console
- Verificar `NEXTAUTH_URL` y `NEXTAUTH_SECRET`

#### Error de Permisos de Administrador
- Verificar `ADMIN_EMAILS` en `.env.local`
- Confirmar que el email coincide con el de Google OAuth

#### Errores de Build
```bash
# Limpiar caché
rm -rf .next node_modules
npm install
npm run build
```

### Logs y Debugging

```bash
# Ver logs de desarrollo
npm run dev

# Logs de base de datos
npx prisma studio

# Debug de autenticación
# Agregar DEBUG=nextauth* a .env.local
```

## 📚 Próximos Pasos

Una vez completada la instalación:

1. **Explora la aplicación:** Navega por las diferentes secciones
2. **Lee la documentación:** Consulta `docs/` para más detalles
3. **Revisa la arquitectura:** Entiende la estructura del proyecto
4. **Ejecuta los tests:** Familiarízate con la suite de testing
5. **Contribuye:** Lee la guía de contribución

## 📞 Soporte

Si encuentras problemas:

1. **Revisa la documentación:** `docs/guides/troubleshooting.md`
2. **Consulta los issues:** GitHub Issues del proyecto
3. **Contacta al equipo:** Información en `README.md`

---

**Última actualización:** 2024-12-28  
**Versión:** 2.0