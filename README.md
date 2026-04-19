# 🎾 Turnero de Pádel

**Sistema completo de gestión de reservas de canchas de pádel** construido con Next.js 15, NextAuth.js v5 y PostgreSQL.

## 🚀 Estado del Proyecto

✅ **En producción / activo** — multitenant, reservas, pagos y panel admin en uso continuo  
📅 **Última revisión de documentación**: abril 2026  
🧪 **Pruebas**: Jest (unitario/integración) y Playwright (E2E); Cypress opcional para componentes  
🔒 **Seguridad**: NextAuth.js v5 (Google OAuth), aislamiento por tenant, rate limiting con Vercel KV cuando está configurado  
📱 **Responsive**: Compatible con escritorio y móvil  

## 🏗️ Stack Tecnológico

### Frontend
- **Next.js 15.5.2** - Framework React con App Router
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 4** - Framework de estilos
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconografía moderna

### Backend & Base de Datos
- **NextAuth.js v5** - Autenticación OAuth (Google)
- **PostgreSQL** - Base de datos principal (Neon)
- **Prisma ORM 6.14.0** - Object-Relational Mapping
- **@auth/prisma-adapter** - Adaptador de autenticación

### Testing & Calidad
- **Playwright** - Tests end-to-end
- **Jest** - Tests unitarios
- **Cypress** - Tests de componentes
- **ESLint** - Linting de código

### Deployment
- **Vercel** - Hosting y deployment
- **Neon PostgreSQL** - Base de datos en la nube

## 🚀 Inicio Rápido

### Prerrequisitos
```bash
Node.js 18+ 
npm/yarn/pnpm
Cuenta de Google (para OAuth)
Base de datos PostgreSQL (Neon recomendado)
```

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd "turnero de padel"

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales (ver sección Configuración)

# 4. Base de datos (PostgreSQL)
npx prisma generate
npx prisma migrate dev   # recomendado en desarrollo con historial de migraciones
# alternativa rápida sin historial: npx prisma db push

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## ⚙️ Configuración

### Variables de Entorno Requeridas

Crea un archivo `.env.local` con las siguientes variables:

```bash
# Autenticación NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-key-seguro

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:5432/database?sslmode=require

# Administradores del sistema
ADMIN_EMAILS=admin1@email.com,admin2@email.com

# Super Administradores (Multitenant)
SUPER_ADMIN_EMAILS=superadmin@email.com

# Encriptación de credenciales (Multitenant)
CREDENTIAL_ENCRYPTION_KEY=tu-clave-secreta-de-32-caracteres-minimo

# Rate limiting distribuido (opcional; sin esto el límite no aplica KV)
# KV_REST_API_URL=
# KV_REST_API_TOKEN=

# Mercado Pago (por tenant también en BD; vars globales según tu despliegue)
# MERCADOPAGO_ACCESS_TOKEN=

# Configuración opcional
NODE_ENV=development
```

### Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+
4. Crea credenciales OAuth 2.0
5. Configura las URLs de redirección:
   - Desarrollo: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://tu-dominio.com/api/auth/callback/google`

### Configuración de Base de Datos

#### Opción 1: Neon PostgreSQL (Recomendado)
1. Crea una cuenta en [Neon](https://neon.tech/)
2. Crea una nueva base de datos
3. Copia la URL de conexión a `DATABASE_URL`

#### Opción 2: PostgreSQL Local
```bash
# Instalar PostgreSQL
# Crear base de datos
createdb turnero_padel

# Configurar URL
DATABASE_URL=postgresql://usuario:password@localhost:5432/turnero_padel
```

## 🎯 Funcionalidades Principales

### 🏢 Arquitectura Multitenant
- **Múltiples clientes** - Sistema multitenant para gestionar múltiples clubs
- **Aislamiento de datos** - Datos completamente aislados por tenant
- **Roles granulares** - Super Admin, Admin de Tenant, y Usuario
- **Panel Super Admin** - Gestión centralizada de todos los tenants
- **Credenciales por tenant** - Integración de Mercado Pago por tenant

### ✅ Sistema de Autenticación
- **OAuth con Google** - Login seguro y rápido
- **Gestión de sesiones** - Persistencia automática
- **Roles de usuario** - Super Admin, Administradores y usuarios regulares
- **Protección de rutas** - Middleware de autenticación

### ✅ Gestión de Canchas
- **CRUD completo** - Crear, leer, actualizar, eliminar
- **Configuración de horarios** - Horarios personalizables por cancha
- **Precios dinámicos** - Diferentes tarifas por horario
- **Estado de canchas** - Disponible, mantenimiento, reservada

### ✅ Sistema de Reservas
- **Calendario interactivo** - Visualización clara de disponibilidad
- **Reservas en tiempo real** - Actualizaciones instantáneas
- **Gestión de conflictos** - Prevención de doble reserva
- **Historial de reservas** - Seguimiento completo

### ✅ Panel de Administración
- **Dashboard completo** - Métricas y estadísticas
- **Gestión de usuarios** - Administrar roles y permisos
- **Gestión de reservas** - Ver, modificar, cancelar reservas
- **Reportes** - Análisis de uso y ingresos

### ✅ Interfaz de Usuario
- **Diseño responsive** - Móvil, tablet, desktop
- **Tema moderno** - UI/UX optimizada
- **Componentes reutilizables** - Arquitectura escalable
- **Accesibilidad** - Cumple estándares WCAG

### 🔄 Funcionalidades avanzadas
- **Pagos** — Mercado Pago (por tenant, webhooks, seña / estados de pago)
- **Torneos y ventas** — módulos en el panel según evolución del repo
- **Tiempo real** — Server-Sent Events (SSE) para canchas / reservas / slots
- **Validación** — Zod en API y formularios
- **Rate limiting** — Upstash Ratelimit + Vercel KV cuando `KV_REST_API_URL` / `KV_REST_API_TOKEN` están definidos

## 📁 Estructura del Proyecto

```
turnero de padel/
├── 📁 app/                     # App Router (Next.js 15)
│   ├── 📁 (protected)/         # Rutas de usuario autenticado (ej. dashboard)
│   ├── 📁 admin-panel/         # Panel de administración por tenant
│   ├── 📁 api/                 # Route Handlers (REST)
│   └── 📁 auth/                # Flujo de autenticación
├── 📁 components/              # Componentes React
│   ├── 📁 admin/               # Componentes del admin
│   ├── 📁 auth/                # Componentes de autenticación
│   ├── 📁 providers/           # Context providers
│   └── 📁 ui/                  # Componentes UI base
├── 📁 lib/                     # Utilidades y configuraciones
│   ├── 📄 auth.ts              # Configuración NextAuth.js
│   ├── 📄 prisma.ts            # Cliente de Prisma
│   ├── 📁 services/            # Servicios de negocio
│   ├── 📁 utils/               # Utilidades generales
│   └── 📁 validations/         # Esquemas de validación
├── 📁 hooks/                   # Custom React hooks
├── 📁 prisma/                  # Esquema y migraciones
├── 📁 tests/                   # Tests E2E y unitarios
├── 📁 docs/                    # Documentación completa
└── 📁 public/                  # Archivos estáticos
```

## 🧪 Testing

### Scripts de Testing Disponibles

```bash
# Tests unitarios
npm run test
npm run test:watch
npm run test:coverage

# Tests de integración
npm run test:integration

# Tests E2E con Playwright
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui

# Tests de componentes con Cypress
npm run test:cypress
npm run test:cypress:open

# Ejecutar todos los tests
npm run test:all
```

### Cobertura de Testing
- ✅ **Tests unitarios** - Hooks, servicios, utilidades
- ✅ **Tests de integración** - APIs y base de datos
- ✅ **Tests E2E** - Flujos completos de usuario
- ✅ **Tests de componentes** - Componentes React aislados

## 🚀 Deployment

### Deploy en Vercel (Recomendado)

1. **Conectar repositorio**:
   ```bash
   # Conecta tu repositorio de GitHub a Vercel
   # Vercel detectará automáticamente Next.js
   ```

2. **Configurar variables de entorno en Vercel**:
   ```bash
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   NEXTAUTH_SECRET=tu-secret-key-produccion
   GOOGLE_CLIENT_ID=tu-google-client-id
   GOOGLE_CLIENT_SECRET=tu-google-client-secret
   DATABASE_URL=tu-url-postgresql-produccion
   ADMIN_EMAILS=admin@tudominio.com
   ```

3. **Deploy automático**:
   - Cada push a `main` despliega automáticamente
   - Preview deployments para pull requests
   - Rollback automático en caso de errores

### Deploy Manual

```bash
# Build de producción
npm run build

# Iniciar en producción
npm start
```

## 📚 Documentación Completa

### 📖 Guías de Desarrollo
- **[Guía de Inicio Rápido](docs/guides/quick-start.md)** - Configuración inicial
- **[Guía de Desarrollo](docs/guides/development.md)** - Flujo de desarrollo
- **[Guía de Deployment](docs/guides/deployment.md)** - Despliegue en producción
- **[Troubleshooting](docs/guides/troubleshooting.md)** - Solución de problemas

### 🏗️ Arquitectura
- **[Arquitectura Multitenant](docs/multitenant/MULTITENANT_COMPLETE.md)** — guía completa multitenant
- **[Arquitectura del Sistema](docs/architecture/system-architecture.md)** - Visión general
- **[Arquitectura de Componentes](docs/architecture/component-architecture.md)** - Estructura frontend
- **[Flujos de API](docs/architecture/api-flows.md)** - Endpoints y datos
- **[Diagrama de Base de Datos](docs/architecture/database-diagram.md)** - Esquema de datos

### 🔌 APIs
- **[Autenticación](docs/apis/auth.md)** - Endpoints de auth
- **[Canchas](docs/apis/courts.md)** - Gestión de canchas
- **[Reservas](docs/apis/bookings.md)** - Sistema de reservas
- **[Slots](docs/apis/slots.md)** - Horarios disponibles

### 🧩 Componentes
- **[Componentes UI](docs/components/)** - Documentación de componentes
- **[Hooks Personalizados](docs/hooks/)** - Custom React hooks
- **[Servicios](docs/services/)** - Lógica de negocio

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build de producción
npm run start           # Servidor de producción
npm run lint            # Linting de código

# Base de datos
npx prisma studio       # Interfaz visual de BD
npx prisma db push      # Aplicar cambios al esquema
npx prisma generate     # Generar cliente Prisma
# Si configuraste prisma.seed en package.json: npx prisma db seed

# Testing
npm run test:all        # Todos los tests
npm run test:e2e        # Tests end-to-end
npm run test:unit       # Tests unitarios
npm run test:coverage   # Cobertura de tests
```

## 🤝 Contribuir

### Proceso de Contribución

1. **Fork el proyecto**
2. **Crea una rama para tu feature**:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Realiza tus cambios siguiendo las convenciones**
4. **Ejecuta los tests**:
   ```bash
   npm run test:all
   ```
5. **Commit tus cambios**:
   ```bash
   git commit -m 'feat: agregar nueva funcionalidad'
   ```
6. **Push a tu rama**:
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
7. **Abre un Pull Request**

### Convenciones de Código
- **TypeScript** - Tipado estricto
- **ESLint** - Linting automático
- **Prettier** - Formateo de código
- **Conventional Commits** - Mensajes de commit estandarizados

## 🔒 Seguridad

### Medidas Implementadas
- **Autenticación OAuth** - No almacenamos contraseñas
- **Validación de entrada** - Sanitización de datos
- **Protección CSRF** - Tokens de seguridad
- **Rate Limiting** - Prevención de ataques
- **Variables de entorno** - Secretos seguros

### Reportar Vulnerabilidades
Si encuentras una vulnerabilidad de seguridad, por favor contacta directamente al equipo de desarrollo.

## 📄 Licencia

Este proyecto está bajo la **Licencia MIT**. Ver [LICENSE](LICENSE) para más detalles.

## 📞 Soporte y Contacto

### Información del Proyecto
- **Nombre**: Turnero de Pádel
- **Versión**: ver `version` en `package.json`
- **Estado**: activo (despliegue típico: Vercel + Neon)
- **Documentación**: `docs/README.md` e [índice](docs/00-indice-documentacion.md)

### Recursos Adicionales
- **[Documentación Completa](docs/README.md)** - Toda la documentación
- **[Guía de Troubleshooting](docs/guides/troubleshooting.md)** - Solución de problemas
- **[Changelog](CHANGELOG.md)** - Historial de cambios

---

*Construido con ❤️ usando Next.js 15, NextAuth.js v5, PostgreSQL y TypeScript*

**¿Listo para gestionar tu club de pádel? ¡Comienza ahora!** 🎾
