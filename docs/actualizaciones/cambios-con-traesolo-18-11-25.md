# Cambios con TraeSolo – 18/11/2025

## Resumen Ejecutivo

- Modo oscuro activado por defecto y utilidades `dark:` habilitadas globalmente.
- Navbar con estilo “glass”: blur más marcado y fondo translúcido controlado por variables CSS.
- Paleta OKLCH aplicada al dashboard mediante variables (`:root`, `.dashboard-theme`, `.dark .dashboard-theme`).
- Tipografía Inter integrada y usada como `font-sans` en el dashboard.
- Refactor visual del dashboard: tarjetas (`Card`) y grilla de slots con tokens (`bg-card`, `text-card-foreground`, `border-border`).
- Botones y toggles alineados a dos acentos: Neon Lime (`#BEF264`) y Electric Teal (`#0EA5E9`).
- Badge “Disponible” rediseñado con Electric Teal (sin sombra), y mejoras de legibilidad.

## Temas Principales

### Modo Oscuro por Defecto
- Activado por defecto en el estado global del dashboard.
- Persistencia y sincronización con `localStorage` y clase `dark` en `<html>` para habilitar utilidades `dark:`.
- Referencias:
  - `turnero-padel/components/providers/AppStateProvider.tsx:326` (estado inicial `isDarkMode = true`)
  - `turnero-padel/components/providers/AppStateProvider.tsx:559` (aplicación de `document.documentElement.classList.toggle('dark', isDarkMode)`).

### Navbar “Glass” y Transparencia
- Superior e inferior con `backdrop-blur-xl` y fondo translúcido basado en variable `--navbar-bg`.
- Ajuste de opacidad y separación de color dinámico para mantener legibilidad de íconos y textos.
- Referencias:
  - `turnero-padel/padel-booking.tsx:674-679` (navbar superior)
  - `turnero-padel/padel-booking.tsx:851-879` (navbar inferior)
  - `turnero-padel/app/globals.css:191-193` (definición `--navbar-bg`).

### Paleta y Tipografía (OKLCH + Inter)
- Variables CSS para colores principales, secundarios y de superficie (claro/oscuro) con OKLCH.
- Tipografía Inter integrada y aplicada en el scope del dashboard.
- Nuevas variables de acento:
  - `--electric-teal: #0EA5E9`
  - `--color-neon-lime: #BEF264` (usada como color de énfasis y métricas)
  - `--accent-green-dark: #008000` (verde oscuro para botones específicos)
- Referencias:
  - `turnero-padel/app/globals.css:119-154` (`.dashboard-theme`)
  - `turnero-padel/app/globals.css:156-193` (`.dark .dashboard-theme`)

### Refactor del Dashboard con Tokens
- Envoltorio del dashboard con clase de tema: `div.dashboard-theme.font-sans`.
- Tarjetas principales y contenedores migrados a tokens (`bg-card`, `text-card-foreground`, `border-border`).
- Precio integrado al lado derecho del card con divisor vertical en desktop.
- Referencias:
  - `turnero-padel/padel-booking.tsx:668` (wrapper `dashboard-theme font-sans`)
  - `turnero-padel/components/HomeSection.tsx:189-206` (Card principal con tokens)
  - `turnero-padel/components/HomeSection.tsx:295-311` (precio integrado a la derecha).

### Grilla de Slots y Tarjetas
- Cards de slots con borde sutil, radios suaves y fondo `bg-card`.
- Tamaño de botones de slots reducido para mayor densidad y mejor legibilidad.
- Nombre de cancha sin fondo propio para integrarse con el card.
- Hora con jerarquía visual más clara (`text-xl`), precio atenuado (`text-muted-foreground`).
- Referencias:
  - `turnero-padel/components/HomeSection.tsx:754` (contenedor de grilla con `bg-card`)
  - `turnero-padel/components/HomeSection.tsx:811-823` (botón de slot, radios y borde)
  - `turnero-padel/components/HomeSection.tsx:826-833` (nombre de cancha, `bg-transparent`)
  - `turnero-padel/components/HomeSection.tsx:839-846` (hora `text-xl`)
  - `turnero-padel/components/HomeSection.tsx:859-867` (precio `text-muted-foreground`).

### Barra de Disponibilidad y Métricas
- Porcentaje destacado y barra con color de énfasis.
- Migración del fill de la barra a variables de color.
- Referencias:
  - `turnero-padel/components/HomeSection.tsx:250-256` (porcentaje y barra con color de acento).

### Botones, Toggles y Acentos
- Dos acentos cromáticos en el dashboard:
  - Neon Lime (`#BEF264`): énfasis en métricas y algunos botones de vista.
  - Electric Teal (`#0EA5E9`): selección de fechas, filtros móviles y badge Disponible.
- Estados activos con peso tipográfico `font-semibold` y colores de texto en toggles móviles.
- CTA “Ir al próximo disponible” alineado con acentos del dashboard.
- Referencias:
  - `turnero-padel/components/HomeSection.tsx:386-418` (View toggle móvil: activo con Neon Lime y `font-semibold`)
  - `turnero-padel/components/HomeSection.tsx:420-452` (Filter toggle móvil: activo con Electric Teal y `font-semibold`)
  - `turnero-padel/components/HomeSection.tsx:650-660` (CTA próximo disponible, tratamiento cromático)
  - `turnero-padel/padel-booking.tsx:328-330` (nav item “Mis Turnos” en Electric Teal)
  - `turnero-padel/padel-booking.tsx:719-733` (rueda de Admin: fondo oscuro, ícono Neon Lime).

### Badge “Disponible”
- Rediseño sin sombras, con borde sutil y color sólido Electric Teal.
- Referencias:
  - `turnero-padel/app/globals.css:228-252` (definición `.badge-disponible` y variante `.dark`).

## Acuerdos y Decisiones

1. Habilitar el modo oscuro por defecto en el dashboard y mantener persistencia en `localStorage`.
2. Usar variables CSS para paleta OKLCH y acentos modernos, aplicadas por scope (`.dashboard-theme`).
3. Estabilizar el estilo “glass” del navbar con `backdrop-blur-xl` y `--navbar-bg`.
4. Refactorizar tarjetas y grilla de slots con tokens de Tailwind v4 (`bg-card`, `text-card-foreground`, `border-border`).
5. Ajustar tamaños de slots y jerarquías tipográficas (hora más compacta, precio en `text-muted-foreground`).
6. Unificar colores de acción: Neon Lime para métricas/énfasis, Electric Teal para selección/filtros y el badge Disponible.
7. Mejorar el botón de configuración Admin: fondo oscuro, ícono Neon Lime, legibilidad mantenida.

## Acciones Ejecutadas

- Cambio de estado inicial y sincronización de clase `dark`:
  - `turnero-padel/components/providers/AppStateProvider.tsx:326, 559`.
- Envoltorio de tema del dashboard:
  - `turnero-padel/padel-booking.tsx:668`.
- Navbar superior e inferior con blur y variables:
  - `turnero-padel/padel-booking.tsx:674-679, 851-879`.
- Paleta y tokens en `globals.css`:
  - `turnero-padel/app/globals.css:119-154, 156-193, 191-193`.
- Refactor de `HomeSection` (cards, barra, precio, slots):
  - `turnero-padel/components/HomeSection.tsx:189-206, 250-256, 295-311, 754, 811-867`.
- Toggles móviles y CTA:
  - `turnero-padel/components/HomeSection.tsx:386-418, 420-452, 650-660`.
- Nav y Admin:
  - `turnero-padel/padel-booking.tsx:316-331, 719-733`.
- Badge Disponible:
  - `turnero-padel/app/globals.css:228-252`.

## Fragmentos Técnicos

### Variables CSS de tema (extracto)

```css
.dashboard-theme {
  --font-sans: var(--font-inter);
  --background: oklch(0.98 0.02 264.665);
  --foreground: oklch(0.145 0 0);
  --card: oklch(0.97 0.02 259.733);
  --card-foreground: oklch(0.145 0 0);
  --border: oklch(0 0 0 / 0.08);
  --navbar-bg: oklch(0.21 0.034 264.665 / 0.7);
  --electric-teal: #0EA5E9;
  --color-neon-lime: #BEF264;
  --accent-green-dark: #008000;
}

.dark .dashboard-theme {
  --background: oklch(0.21 0.034 264.665);
  --card: oklch(0.278 0.033 256.848);
  --border: oklch(1 0 0 / 0.125);
  --navbar-bg: oklch(0.21 0.034 264.665 / 0.7);
  --electric-teal: #0EA5E9;
  --color-neon-lime: #BEF264;
}
```

### Navbar inferior (extracto)

```tsx
<div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
  <div
    className={
      "flex items-center justify-center gap-2 px-3 py-2 rounded-full shadow-2xl backdrop-blur-xl border border-border"
    }
    style={{ backgroundColor: 'var(--navbar-bg)' }}
  >
    {/* nav items */}
  </div>
</div>
```

### Botón de slot (extracto)

```tsx
<button
  className={
    "p-2 md:p-2 rounded-lg border transition-all text-center min-h-[78px] md:min-h-[80px] bg-card border-border"
  }
>
  <div className="text-xl font-bold text-card-foreground">08:00 - 09:30</div>
  <span className="badge-disponible">Disponible</span>
  <div className="text-sm font-medium text-muted-foreground">$15 por persona</div>
</button>
```

### Badge Disponible (extracto)

```css
.badge-disponible {
  background-color: var(--electric-teal);
  color: #fff;
  border-radius: 9999px;
  padding: 6px 14px;
  font-weight: 600;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

## Referencias de Archivos

- `turnero-padel/components/providers/AppStateProvider.tsx`
- `turnero-padel/padel-booking.tsx`
- `turnero-padel/components/HomeSection.tsx`
- `turnero-padel/app/globals.css`

## Notas y Próximos Pasos

- Extender el uso de tokens (`bg-card`, `text-foreground`, `border-border`) a más componentes para consistencia total.
- Afinar blur/alpha del navbar si se desea un efecto “glass” más intenso.
- Unificar completamente los acentos si se prefiere una sola paleta (Neon Lime o Electric Teal) en todo el dashboard.

Fecha: 18/11/2025

## Resumen Ejecutivo

- Se optimizó el rendimiento de la página de turnos mediante memoización de cálculos derivados y cancelación segura en efectos asíncronos.
- Se eliminaron estados e imports no utilizados y se retiró una suscripción de tiempo real que no impactaba la UI.
- Se mejoró el listado de reservas con búsqueda con debounce, métricas memoizadas y render progresivo con controles “Mostrar más/Menos”.
- Se ajustó el comportamiento del botón “Cancelar” para que solo esté activo en turnos confirmados o en curso.

## Contexto y Objetivos

- Ruta analizada: `http://localhost:3000/admin-panel/admin/turnos`.
- Objetivo: reducir trabajo por render y llamadas redundantes, estabilizar datos derivados, y mejorar la experiencia en listas con mucho volumen.

## Cambios en TurnosPage (app/admin-panel/admin/turnos/page.tsx)

### Optimizaciones

1. Memoización de “Próximos turnos”.
   - Referencia: `turnero-padel/app/admin-panel/admin/turnos/page.tsx:178-189`.
   - Se usa `useMemo` sobre `bookings` para evitar recomputar en cada render.

2. Cancelación segura de efectos asíncronos.
   - Confirmación de disponibilidad: `turnero-padel/app/admin-panel/admin/turnos/page.tsx:286-309`.
   - Actualización de horarios disponibles: `turnero-padel/app/admin-panel/admin/turnos/page.tsx:311-327`.
   - Estrategia: flag local `cancelled` para evitar actualizar estado con respuestas obsoletas.

3. Limpieza de imports y estados no utilizados.
   - Se retiraron íconos no usados y hooks de tiempo real no consumidos en UI.
   - Import principal conservado: `import dynamic from 'next/dynamic'` (`turnero-padel/app/admin-panel/admin/turnos/page.tsx:8`).

### Estructura y dependencias

- Componente principal cliente: `TurnosPage` renderiza métricas, disponibilidad semanal y el componente dinámico `AdminTurnos` (`turnero-padel/app/admin-panel/admin/turnos/page.tsx:455-462`).
- Hooks utilizados:
  - `useAuth` (`turnero-padel/app/admin-panel/admin/turnos/page.tsx:35`)
  - `useBookings` (`turnero-padel/app/admin-panel/admin/turnos/page.tsx:36`)
  - `useCourtPrices` (`turnero-padel/app/admin-panel/admin/turnos/page.tsx:38`)

### Fragmentos técnicos

```ts
// Memo de próximos turnos
const proximosTurnos = useMemo(() => {
  return (bookings || []).filter((b) => {
    try {
      const dt = new Date(`${(b as any).bookingDate}T${(b as any).startTime}:00`)
      const now = new Date()
      const diff = dt.getTime() - now.getTime()
      return diff > 0 && diff <= 2 * 60 * 60 * 1000
    } catch {
      return false
    }
  }).length
}, [bookings])
```

```ts
// Cancelación en efectos
useEffect(() => {
  let cancelled = false
  const run = async () => { /* ... */ }
  run()
  return () => { cancelled = true }
}, [/* deps */])
```

## Cambios en AdminTurnos (components/AdminTurnos.tsx)

### Optimizaciones de render

1. Búsqueda con debounce (300 ms) para reducir renders en listas grandes.
   - Referencia: `turnero-padel/components/AdminTurnos.tsx:584-588`.

2. Memoización de métricas y eventos de calendario.
   - Eventos del calendario: `turnero-padel/components/AdminTurnos.tsx:278-289`.
   - Métricas agregadas: `turnero-padel/components/AdminTurnos.tsx:1012-1031`.

3. Reducción de frecuencia de reloj “ahora” para chips de “EN CURSO”.
   - Ajuste de 3s a 10s: `turnero-padel/components/AdminTurnos.tsx:90-93`.

### Render progresivo por secciones

- Derivados memoizados por reserva para evitar IIFEs costosas por ítem:
  - Construcción de `derivedBookings` con `category`, `remainingMs` y `chipValue` (`turnero-padel/components/AdminTurnos.tsx:1033-1041`).

- Secciones y controles:
  - Fijos: `turnero-padel/components/AdminTurnos.tsx:1245-1313`.
  - Confirmados: `turnero-padel/components/AdminTurnos.tsx:1331-1413`.
  - En curso: `turnero-padel/components/AdminTurnos.tsx:1414-1503`.
  - Completados: `turnero-padel/components/AdminTurnos.tsx:1505-1596`.
  - Cerrados: `turnero-padel/components/AdminTurnos.tsx:1598-1645`.

- Tamaño visible inicial por sección aumentado a 30 y controles “Mostrar más/Menos”.
  - Estados visibles: `turnero-padel/components/AdminTurnos.tsx:1039-1043`.
  - Controles agregados: ver referencias por sección arriba.

### Ajuste del botón “Cancelar”

- Decisión: habilitar “Cancelar” solo cuando la reserva está en estado “confirmado” o “en curso”.
- Implementación: `disableCancel = !(cat === 'confirmed' || cat === 'in_progress')`.
  - Referencia: `turnero-padel/components/AdminTurnos.tsx:989-1005` (dentro de `renderExpandedContent`).

## Endpoints y Hooks relevantes

- Endpoints utilizados:
  - `GET /api/bookings` (listado)
  - `PUT /api/bookings/:id` (actualización de estado/pagos)
  - `POST /api/bookings/:id/close` (cierre definitivo)
  - `POST /api/bookings/:id/extras` y `DELETE /api/bookings/:id/extras/:extraId`
  - `GET /api/productos` (extras)
  - `POST /api/crud/transaction` (registro de pagos)
  - `POST /api/bookings/availability` y `GET /api/bookings/availability` (disponibilidad)
  - `POST /api/recurring-bookings` y `POST /api/recurring-exceptions` (turnos fijos y excepciones)

- Hooks:
  - `useBookings` (`turnero-padel/hooks/useBookings.ts`)
    - Métodos usados: `fetchBookings`, `createBooking`, `checkAvailability`, `getAvailabilitySlots`.

## Errores observados en desarrollo (no bloqueantes)

- Conexión SSE/HMR durante `dev` (hot updates) y autenticación en sesiones puede arrojar errores en caliente:
  - `net::ERR_ABORTED /api/events`
  - `net::ERR_ABORTED /api/auth/session`
  - Estos no están relacionados con las optimizaciones aplicadas en la UI y no bloquean funcionalidad.

## Referencias de archivos

- `turnero-padel/app/admin-panel/admin/turnos/page.tsx`
- `turnero-padel/components/AdminTurnos.tsx`
- `turnero-padel/hooks/useBookings.ts`

## Próximos Pasos (sugeridos)

1. Evaluar SSR parcial: mantener la página como servidor y dejar en cliente solo componentes interactivos (modal/listado) para reducir JS inicial.
2. Considerar virtualización de listas si el volumen supera 50–100 elementos simultáneos.
3. Añadir `AbortController` en llamadas `fetch` de efectos para cancelación nativa.
4. Medir impacto de los cambios (Lighthouse/React Profiler) y ajustar tamaños por sección.