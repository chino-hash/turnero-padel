---
name: turnero-padel-components
description: UI and component conventions for Turnero de Padel including shadcn/ui usage, folder structure, and naming. Use when creating or modifying React components, forms, or admin UI.
---

# Turnero Padel - Component Conventions

## UI Library

El proyecto usa **shadcn/ui** (estilo `new-york`). Los componentes base están en `components/ui/`:

- Button, Input, Dialog, Tabs, Select, etc.
- Configuración en `components.json` (aliases: `@/components`, `@/lib/utils`, `@/hooks`)

Añadir componentes nuevos con: `npx shadcn@latest add [component]`

## Folder Structure

```
components/
├── ui/           # shadcn base (button, input, dialog, etc.)
├── admin/        # Componentes del panel admin (AdminAvailabilityGrid, CourtStatusIndicator...)
├── auth/         # Login, autenticación
├── providers/    # AppStateProvider, ClientToaster
└── layout/       # Header, Footer, Sidebar (si aplica)
```

## Naming Conventions

- **Componentes**: PascalCase (`BookingForm.tsx`, `CourtCard.tsx`)
- **Hooks**: prefijo `use` + camelCase (`useBookings`, `useUserBookings`)
- **Constantes**: UPPER_SNAKE_CASE
- **Variables/funciones**: camelCase

## Imports

Usar alias del proyecto:

```typescript
import { Button } from '@/components/ui/button';
import { useBookings } from '@/hooks/useBookings';
import { createSuccessResponse } from '@/lib/validations/common';
```

## Component Template

Para documentar componentes nuevos, seguir la plantilla en `docs/maintenance/templates/component-template.md`:

- Props tipadas con tabla
- Estados (Loading, Error, Empty)
- Tests y accesibilidad
