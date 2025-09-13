# Políticas de Protección del Frontend

## URLs y Rutas del Sistema

### 🔒 RUTAS PROTEGIDAS DE USUARIO
- **`/dashboard`** - Dashboard principal del usuario (PROTEGIDO)
- **`/login`** - Página de autenticación (PROTEGIDO)
- **`/auth/*`** - Rutas de autenticación (PROTEGIDO)

### 🔧 RUTAS ADMINISTRATIVAS
- **`/admin`** - Panel principal de administración (MODIFICABLE)
- **`/admin/canchas`** - Gestión de canchas (MODIFICABLE)
- **`/admin/turnos`** - Gestión de turnos (MODIFICABLE)
- **`/admin/usuarios`** - Gestión de usuarios (MODIFICABLE)
- **`/admin/estadisticas`** - Reportes y estadísticas (MODIFICABLE)
- **`/admin/productos`** - Gestión de productos (MODIFICABLE)

## Archivos y Componentes Protegidos

### ⚠️ ARCHIVOS QUE NO DEBEN MODIFICARSE SIN AUTORIZACIÓN EXPLÍCITA

#### 1. Componentes de Usuario Final (Frontend Público)
```
/components/
├── TurneroApp.tsx          # ❌ PROTEGIDO - Componente principal de reservas
├── TurneroAppServer.tsx    # ❌ PROTEGIDO - Versión servidor del componente
├── MisTurnos.tsx          # ❌ PROTEGIDO - Panel de turnos del usuario
├── SlotModal.tsx          # ❌ PROTEGIDO - Modal de selección de horarios
└── HomeSection.tsx        # ❌ PROTEGIDO - Página de inicio
```

#### 2. Páginas de Usuario (Dashboard Público)
```
/app/(protected)/
├── dashboard/page.tsx     # ❌ PROTEGIDO - Dashboard principal del usuario
└── layout.tsx            # ❌ PROTEGIDO - Layout de páginas protegidas

/padel-booking.tsx         # ❌ PROTEGIDO - Componente principal del dashboard
```

#### 2.1 Detalles del Dashboard de Usuario (`/dashboard`)
- **Componente Principal**: `PadelBookingPage` (importación dinámica)
- **Funcionalidades**:
  - Sistema de reservas de canchas
  - Gestión de turnos personales
  - Calendario interactivo
  - Selección de horarios y jugadores
- **Protección**: Requiere autenticación, crítico para usuarios finales

#### 3. Componentes de UI Base
```
/components/ui/            # ❌ PROTEGIDO - Componentes base de shadcn/ui
├── button.tsx
├── card.tsx
├── dialog.tsx
├── input.tsx
└── label.tsx
```

#### 4. Autenticación y Seguridad
```
/lib/auth.ts              # ❌ PROTEGIDO - Configuración de autenticación
/middleware.ts            # ❌ PROTEGIDO - Middleware de rutas
/app/auth/               # ❌ PROTEGIDO - Páginas de autenticación
```

### ✅ ARCHIVOS PERMITIDOS PARA MODIFICACIÓN

#### 1. Componentes de Administración
```
/components/
├── AdminTurnos.tsx        # ✅ PERMITIDO - Gestión de turnos admin
└── admin/                # ✅ PERMITIDO - Componentes administrativos
    ├── RealTimeDemo.tsx
    └── [otros componentes admin]
```

#### 2. Páginas de Administración
```
/app/(admin)/             # ✅ PERMITIDO - Todas las páginas admin
├── admin/page.tsx        # ✅ PERMITIDO - Dashboard administrativo
├── layout.tsx           # ✅ PERMITIDO - Layout admin
├── canchas/
├── estadisticas/
├── productos/
└── usuarios/
```

#### 2.1 Detalles del Panel de Administración (`/admin`)
- **Layout Principal**: `app/(admin)/layout.tsx`
  - Header con navegación horizontal (desktop)
  - Navegación móvil responsiva
  - Verificación de permisos de administrador
  - Avatar y información del usuario admin

- **Dashboard Admin**: `app/(admin)/admin/page.tsx`
  - Gestión completa de turnos y reservas
  - Sistema de filtros avanzados (estado, fecha, usuario)
  - Gestión de pagos individuales por jugador
  - Sistema de extras y servicios adicionales
  - Reportes y estadísticas en tiempo real

- **Secciones Disponibles**:
  - **Canchas**: Gestión de canchas y precios
  - **Turnos**: Administración de reservas
  - **Usuarios**: Gestión de usuarios y permisos
  - **Estadísticas**: Reportes de ocupación e ingresos
  - **Productos**: Gestión de extras y servicios

#### 3. APIs Administrativas
```
/app/api/admin/          # ✅ PERMITIDO - APIs administrativas
/app/api/productos/      # ✅ PERMITIDO - API de productos
```

## Políticas de Desarrollo

### 1. Reglas de Modificación

#### ❌ PROHIBIDO:
- Modificar componentes de usuario final sin autorización explícita
- Cambiar la estructura de navegación del dashboard público
- Alterar la lógica de autenticación
- Modificar componentes UI base sin documentar cambios
- Cambiar APIs públicas sin versionado

#### ✅ PERMITIDO:
- Actualizar páginas y componentes administrativos
- Agregar nuevas funcionalidades admin
- Modificar estilos específicos de admin
- Crear nuevos endpoints administrativos
- Actualizar documentación

### 2. Proceso de Cambios

#### Para Archivos Protegidos:
1. **Solicitud formal** con justificación técnica
2. **Revisión de impacto** en usuarios finales
3. **Aprobación explícita** del responsable del proyecto
4. **Testing exhaustivo** antes de implementar
5. **Documentación** de todos los cambios

#### Para Archivos Permitidos:
1. **Desarrollo normal** siguiendo estándares
2. **Testing básico** de funcionalidad
3. **Documentación** de cambios significativos

### 3. Identificación Visual en Código

Todos los archivos protegidos deben incluir este comentario al inicio:

```typescript
/**
 * ⚠️ ARCHIVO PROTEGIDO - NO MODIFICAR SIN AUTORIZACIÓN
 * 
 * Este archivo contiene funcionalidad crítica para usuarios finales.
 * Cualquier modificación debe ser:
 * 1. Solicitada formalmente
 * 2. Revisada por el equipo
 * 3. Aprobada explícitamente
 * 4. Documentada completamente
 * 
 * Contacto para modificaciones: [responsable del proyecto]
 * Última revisión: [fecha]
 */
```

### 4. Herramientas de Protección

#### Git Hooks (Recomendado)
```bash
# Pre-commit hook para validar cambios
#!/bin/sh
protected_files="components/TurneroApp.tsx components/MisTurnos.tsx app/(protected)/dashboard/page.tsx"
for file in $protected_files; do
  if git diff --cached --name-only | grep -q "$file"; then
    echo "⚠️  ADVERTENCIA: Intentando modificar archivo protegido: $file"
    echo "   Requiere autorización explícita para continuar."
    exit 1
  fi
done
```

#### ESLint Rules (Opcional)
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["@/components/TurneroApp", "@/components/MisTurnos"],
            "message": "Estos componentes están protegidos. Contacta al responsable del proyecto."
          }
        ]
      }
    ]
  }
}
```

## Contacto y Responsabilidades

- **Responsable del Frontend Público**: [Definir responsable]
- **Responsable del Panel Admin**: [Definir responsable]
- **Revisión de Cambios Críticos**: [Definir proceso]

---

**Fecha de creación**: $(date)
**Versión**: 1.0
**Próxima revisión**: [Definir fecha]