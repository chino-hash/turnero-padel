# Estructura del Proyecto - Turnero de Pádel

> Documento actualizado tras la reorganización del proyecto.

## Carpetas principales

```
turnero de padel/
├── app/                    # Next.js App Router - páginas y rutas
│   ├── api/               # API Routes
│   ├── (protected)/       # Rutas protegidas
│   ├── admin-panel/       # Panel de administración
│   ├── super-admin/       # Super administrador
│   ├── club/              # Páginas por club (slug)
│   ├── login/             # Login
│   └── dashboard/         # Dashboard principal
├── components/            # Componentes React
│   ├── auth/             # Autenticación
│   ├── admin/            # Componentes de admin
│   ├── providers/        # Context providers
│   └── ui/               # Componentes UI (shadcn)
├── hooks/                # Custom hooks
├── lib/                  # Utils, servicios, config
│   ├── config/          # Configuración
│   ├── services/        # Servicios de negocio
│   ├── utils/           # Utilidades
│   └── validations/     # Esquemas Zod
├── docs/                 # Documentación
│   ├── migraciones/      # Docs de migraciones
│   ├── seguridad/        # Docs de seguridad
│   ├── deployment/      # Docs de deployment
│   └── screenshots/     # Capturas de pantalla
├── scripts/             # Scripts de utilidad
│   ├── fix-*.js         # Scripts de corrección
│   ├── debug-*.js       # Scripts de depuración
│   └── ...              # Otros scripts
├── __tests__/            # Tests Jest (unitarios, integración)
├── tests/               # Tests Playwright (e2e)
├── prisma/              # Schema y migraciones
└── public/              # Assets estáticos
```

## Archivos en la raíz

- **README.md** - Documentación principal
- **CHANGELOG.md** - Registro de cambios
- **padel-booking.tsx** - Componente principal del dashboard
- **middleware.ts** - Middleware de Next.js
- **package.json**, **tsconfig.json**, etc. - Configuración

## Documentación organizada

- `docs/00-indice-documentacion.md` - Índice general
- `docs/migraciones/` - Guías de migración (PostgreSQL, Auth, Vercel)
- `docs/seguridad/` - Auditorías y mejores prácticas
- `docs/deployment/` - Docker, Vercel

## Scripts disponibles

Todos los scripts de utilidad están en `scripts/`:

- `fix-*.js` - Corrección de imports, tests, etc.
- `debug-*.js` - Depuración de base de datos y APIs
- `run-all-tests.js` - Ejecutar todos los tests
