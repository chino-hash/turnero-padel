# Estructura de Carpetas del Proyecto

## Descripción General

Este documento describe la estructura de carpetas del proyecto Turnero de Pádel, siguiendo las mejores prácticas de Next.js 15 con App Router y una arquitectura modular y escalable.

## Estructura Principal

```
turnero-padel/
├── 📁 app/                          # App Router (Next.js 15)
│   ├── 📁 (protected)/              # Rutas protegidas
│   │   ├── 📄 layout.tsx            # Layout para rutas autenticadas
│   │   └── 📁 dashboard/            # Panel de usuario
│   ├── 📁 admin-panel/              # Panel de administración
│   │   ├── 📄 layout.tsx            # Layout específico de admin
│   │   ├── 📄 page.tsx              # Página principal del admin
│   │   └── 📁 components/           # Componentes específicos del admin
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 auth/                 # Endpoints de autenticación
│   │   ├── 📁 bookings/             # Endpoints de reservas
│   │   ├── 📁 courts/               # Endpoints de canchas
│   │   └── 📁 slots/                # Endpoints de horarios
│   ├── 📁 globals.css               # Estilos globales
│   ├── 📄 layout.tsx                # Layout raíz de la aplicación
│   └── 📄 page.tsx                  # Página de inicio
├── 📁 components/                   # Componentes reutilizables
│   ├── 📁 ui/                       # Componentes base (shadcn/ui)
│   ├── 📁 forms/                    # Formularios específicos
│   ├── 📁 providers/                # Context Providers
│   └── 📁 layout/                   # Componentes de layout
├── 📁 lib/                          # Utilidades y configuraciones
│   ├── 📄 auth.ts                   # Configuración NextAuth
│   ├── 📄 db.ts                     # Configuración Prisma
│   ├── 📄 utils.ts                  # Utilidades generales
│   └── 📄 validations.ts            # Esquemas de validación Zod
├── 📁 prisma/                       # Base de datos
│   ├── 📄 schema.prisma             # Esquema de la base de datos
│   ├── 📁 migrations/               # Migraciones de DB
│   └── 📄 seed.ts                   # Datos de prueba
├── 📁 public/                       # Assets estáticos
│   ├── 📁 images/                   # Imágenes
│   └── 📁 icons/                    # Iconos
├── 📁 docs/                         # Documentación
│   ├── 📁 architecture/             # Documentación técnica
│   ├── 📁 api/                      # Documentación de APIs
│   └── 📁 guides/                   # Guías de uso
├── 📁 __tests__/                    # Tests
│   ├── 📁 components/               # Tests de componentes
│   ├── 📁 api/                      # Tests de API
│   ├── 📁 utils/                    # Utilidades de testing
│   └── 📁 e2e/                      # Tests end-to-end
├── 📁 .next/                        # Build de Next.js (generado)
├── 📁 node_modules/                 # Dependencias (generado)
├── 📄 package.json                  # Configuración del proyecto
├── 📄 tsconfig.json                 # Configuración TypeScript
├── 📄 tailwind.config.js            # Configuración Tailwind CSS
├── 📄 next.config.js                # Configuración Next.js
├── 📄 .env.local                    # Variables de entorno
├── 📄 .gitignore                    # Archivos ignorados por Git
├── 📄 README.md                     # Documentación principal
└── 📄 docker-compose.yml            # Configuración Docker
```

## Descripción Detallada

### 📁 app/ - App Router (Next.js 15)

Directorio principal que utiliza el nuevo App Router de Next.js 15, proporcionando:

- **Routing basado en archivos**: Cada carpeta representa una ruta
- **Layouts anidados**: Layouts específicos para diferentes secciones
- **Server Components por defecto**: Mejor rendimiento y SEO
- **Streaming y Suspense**: Carga progresiva de contenido

#### Subdirectorios principales:

- **(protected)/**: Rutas que requieren autenticación
- **admin-panel/**: Panel de administración con layout específico
- **api/**: Endpoints de la API REST

### 📁 components/ - Componentes Reutilizables

Organización modular de componentes siguiendo principios de reutilización:

```
components/
├── ui/                    # Componentes base de shadcn/ui
│   ├── button.tsx         # Botón personalizable
│   ├── input.tsx          # Campo de entrada
│   ├── dialog.tsx         # Modal/diálogo
│   └── ...
├── forms/                 # Formularios específicos del dominio
│   ├── BookingForm.tsx    # Formulario de reservas
│   ├── CourtForm.tsx      # Formulario de canchas
│   └── ...
├── providers/             # Context Providers
│   ├── AppStateProvider.tsx      # Estado global de la app
│   ├── ClientAppStateProvider.tsx # Wrapper cliente
│   └── ...
└── layout/                # Componentes de layout
    ├── Header.tsx         # Cabecera principal
    ├── Footer.tsx         # Pie de página
    └── Sidebar.tsx        # Barra lateral
```

### 📁 lib/ - Utilidades y Configuraciones

Contiene la lógica de negocio y configuraciones centralizadas:

- **auth.ts**: Configuración completa de NextAuth.js con Google OAuth
- **db.ts**: Cliente de Prisma y utilidades de base de datos
- **utils.ts**: Funciones utilitarias (formateo, validaciones, etc.)
- **validations.ts**: Esquemas de validación con Zod

### 📁 prisma/ - Base de Datos

Gestión completa de la base de datos PostgreSQL:

- **schema.prisma**: Definición del esquema de datos
- **migrations/**: Historial de cambios en la DB
- **seed.ts**: Datos iniciales para desarrollo y testing

### 📁 __tests__/ - Testing

Suite completa de testing con múltiples estrategias:

```
__tests__/
├── components/            # Tests unitarios de componentes
├── api/                   # Tests de integración de APIs
├── utils/                 # Utilidades de testing (mocks, helpers)
├── e2e/                   # Tests end-to-end
│   ├── playwright/        # Tests con Playwright
│   └── cypress/           # Tests con Cypress
└── performance/           # Tests de rendimiento
```

## Convenciones de Nomenclatura

### Archivos y Carpetas

- **Componentes React**: PascalCase (`BookingForm.tsx`)
- **Páginas**: lowercase (`page.tsx`, `layout.tsx`)
- **Utilidades**: camelCase (`utils.ts`, `validations.ts`)
- **Carpetas**: kebab-case (`admin-panel/`, `api-docs/`)

### Estructura de Componentes

```typescript
// Estructura típica de un componente
export interface ComponentProps {
  // Props tipadas
}

export function Component({ ...props }: ComponentProps) {
  // Hooks
  // Estado local
  // Efectos
  // Handlers
  
  return (
    // JSX
  );
}

export default Component;
```

## Patrones de Organización

### 1. Separación por Dominio

Cada funcionalidad principal tiene su propia estructura:

```
feature/
├── components/     # Componentes específicos
├── hooks/         # Hooks personalizados
├── types/         # Tipos TypeScript
└── utils/         # Utilidades específicas
```

### 2. Colocation

Los archivos relacionados se mantienen cerca:

```
BookingForm/
├── BookingForm.tsx      # Componente principal
├── BookingForm.test.tsx # Tests
├── BookingForm.types.ts # Tipos
└── index.ts            # Barrel export
```

### 3. Barrel Exports

Uso de archivos `index.ts` para simplificar imports:

```typescript
// components/index.ts
export { BookingForm } from './forms/BookingForm';
export { CourtCard } from './cards/CourtCard';
export { Header } from './layout/Header';
```

## Configuraciones Importantes

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/app/*": ["app/*"]
    }
  }
}
```

### Tailwind CSS (tailwind.config.js)

- Configuración personalizada de colores
- Componentes de shadcn/ui integrados
- Responsive design optimizado

### Next.js (next.config.js)

- Configuración de imágenes optimizadas
- Variables de entorno
- Configuración de build y deployment

## Mejores Prácticas

### 1. Organización de Imports

```typescript
// 1. Librerías externas
import React from 'react';
import { NextPage } from 'next';

// 2. Imports internos (absolutos)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';

// 3. Imports relativos
import './Component.styles.css';
```

### 2. Estructura de Archivos

- Un componente por archivo
- Tests junto al componente
- Tipos en archivos separados cuando son complejos
- Utilidades específicas cerca de su uso

### 3. Naming Conventions

- Componentes: PascalCase
- Hooks: camelCase con prefijo 'use'
- Constantes: UPPER_SNAKE_CASE
- Variables: camelCase

---

**Última actualización**: 2024-12-28  
**Versión**: 2.0  
**Mantenido por**: Equipo de Desarrollo