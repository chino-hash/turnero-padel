# Documentación: UI dashboard / marca lima y experiencia de reserva

**Referencia:** merge integrado en `main` vía Pull Request **#5** (`feature/dashboard-ui-booking-updates`).  
**Commits destacados:** `0bbac82` (ajustes UI principal), integración posterior con `origin/main` y resolución de conflictos antes del merge a producción.

## Resumen

Esta entrega **alinena la interfaz del dashboard y vistas relacionadas con la identidad visual basada en lima (`#bef264`)**: menos verdes genéricos de Tailwind, más tokens CSS reutilizables, mejor lectura del estado “Pagado / Activo”, refinamiento del área de inicio de reserva (**Home**) y tests E2E de badges más acordes al comportamiento actual (texto “No disponible”, estilo pill).

## Alcance funcional

- **Marca y color:** uso consistente de `--color-neon-lime` y variables derivadas para superficies, bordes y texto fuerte en tema `.dashboard-theme`.
- **Dashboard (`padel-booking.tsx`):** resumen financiero, turnos activos, badge ADMIN, marca “PadelBook” en cabecera, spinners y bloques de reembolso alineados con la paleta lima.
- **Mis turnos:** fondo claro homogeneizado con el resto del dashboard; realces del turno activo con lima en lugar de verde Tailwind.
- **Estados globales (provider):** chips de pago y de estado de reserva (modo claro / oscuro) y estado admin “Active” con la nueva familia cromática.
- **Home de reserva (`HomeSection.tsx`):** layout de tarjetas de cancha más robusto (filas incompletas centradas), botón **Ir al próximo disponible**, simplificación del bloque de disponibilidad superior y título “PadelBook” con contraste legible.
- **Canchas:** tercer color de paleta fijo a **verde bosque** (`#008000`) para consistencia con la visualización por número de cancha. *Ver también evolución propuesta (interior/exterior, semántica de color): [docs/design/canchas-colores-marca-interior-exterior.md](../design/canchas-colores-marca-interior-exterior.md).*
- **Tests E2E:** `badges.spec.ts` reducido y enfocado en slots reales y copy actual (“Disponible” / “No disponible”).

## Cambios por archivo

### `app/globals.css`

- En **`.dashboard-theme`**: define `--color-neon-lime: #bef264` para que el tema club no herede verdes del `:root` en modo claro.
- Añade tokens **`--dashboard-lime-surface`**, **`--dashboard-lime-surface-strong`**, **`--dashboard-lime-border`**, **`--dashboard-lime-text-strong`** y recalcula **`--accent-green-dark`** con `color-mix` a partir del lima (modo claro y `.dark`).
- **Badges `.badge-disponible`:** pasan a **texto lima sobre fondo transparente**, sin borde (pill discreta acorde a marca); mismo criterio en variantes dentro del dashboard y en modo oscuro.

### `padel-booking.tsx`

- **Ingresos totales:** importe e icono usan variables `--dashboard-lime-*` y `--color-neon-lime` según modo oscuro/claro.
- **Lista de reservas:** tarjetas “Active” y punto pulsante con borde/fondo lima en lugar de `green-*`.
- **Badge ADMIN:** borde y fondo suaves derivados del lima en lugar de emerald.
- **Marca en cabecera:** “Padel” en neutro (blanco/gris según tema) + “Book” en lima.
- **UX pagos:** spinner de “Procesando…” y bloque “Reembolso disponible” con íconos y textos en la nueva paleta.

### `components/MisTurnos.tsx`

- Turno activo: **ring** y bloque “Tiempo restante” con tokens lima; fondo de la vista en claro pasa de gradiente azul/emerald a **azul/zinc** (`from-blue-50 to-zinc-100`), alineado con Home.

### `components/providers/AppStateProvider.tsx`

- Colores de **Fully Paid / Paid**, **Confirmed / Active** y badge admin **Active**: sustituyen combinaciones `green-*` por tonos basados en lima (RGBA/`#d9f99d`, `#3d4f14`, etc.) para modo oscuro y claro.

### `lib/court-colors.ts`

- Entrada de paleta para la **tercera cancha**: de verde Tailwind (`#22c55e`) a **verde bosque** `#008000`.

### `components/HomeSection.tsx`

- Constante **`COURT_CARD_LIST_CELL`**: anchos calculados para **siempre 2 columnas** de tarjetas de cancha (alineado con `gap-2` / `sm:gap-3` del contenedor). Se eliminó el salto a **3 columnas en `lg`** para que cada tarjeta sea más ancha y el bloque de horarios quede visualmente más claro.
- **Grilla “Horarios disponibles” (slots):** antes usaba **`grid-cols-1`** por defecto y solo **`sm:grid-cols-2`**, por lo que en móvil los turnos aparecían en **una sola columna**. Pasó a **`grid-cols-2`** desde el ancho mínimo (`lg`/`xl`/`2xl` sin cambio de criterio). Se ajustaron **`gap-2 sm:gap-3 md:gap-4`** y **`p-3 sm:p-4`** para compensar el menor ancho por celda en pantallas estrechas.
- **Fondo modo claro:** gradiente `from-blue-50 to-zinc-100`; modo oscuro transparente (compatibilidad con fondos tipo glass del layout).
- **Título:** “Padel” en color de texto estándar + “Book” en lima (mejor contraste que todo el título en lima).
- **Tarjeta superior:** simplificación del texto de disponibilidad (máximo “X de Y horarios disponibles”); eliminación de barra de progreso con gradiente emerald/amarillo/naranja y etiquetas largas asociadas.
- **Botón** “Ir al próximo disponible” (`data-testid="next-available-btn"`) debajo de la tarjeta cuando el header ya cargó.
- **Selección de canchas:** de grid fijo a **flex + wrap** con la celda reutilizable para mantener alineación visual en distintos números de canchas.

#### Nota (alcance de cada cambio)

La constante **`COURT_CARD_LIST_CELL`** solo afecta el **listado de canchas** (selector superior). La **columna única de horarios en móvil** venía de la **grilla de slots** (`grid-cols-1`), no de esa constante; por eso el ajuste de dos columnas en “Horarios disponibles” es independiente y está descrito en el segundo punto anterior.

### `components/landing-page/Navbar.tsx`

- En el commit inicial de la rama se ajustó el logo tipográfico; **respecto a la base que ya tenía `main`**, la versión final integrada coincide con el trabajo paralelo en upstream (dos spans “Padel” / “Book”). No hay delta neto respecto al `main` previo al PR solo en este archivo; el valor está en **no diverger** del landing ya unificado.

### `tests/e2e/badges.spec.ts`

- Eliminación de tests de depuración, screenshots obligatorios y aserciones frágiles de colores RGB concretos del badge demo.
- Tests centrados en **`[data-testid="time-slot"]`**: texto **“Disponible”**, **“No disponible”** donde aplique (con `skip` si no hay slots no clickeables), `border-radius` pill y `font-weight` coherente con CSS actual.

## Integración con `main`

Antes del merge del PR, **`main` incluía** mejoras paralelas (por ejemplo efecto glass en dashboard, ajustes mobile). Se integró **`origin/main` en la rama feature** y se resolvieron conflictos principalmente en **`HomeSection.tsx`** y **`Navbar.tsx`**, combinando:

- Layout **`COURT_CARD_LIST_CELL`** y refinamientos de la feature con **estilos glass / rejilla responsive** de upstream donde correspondía.
- Sección demo de **Estados** de badges en Home mantenida donde el diseño de `main` la incluye.

## Verificación recomendada

- Abrir **dashboard tenant** (tema `.dashboard-theme`): revisar ingresos, turnos activos, ADMIN y modal de pago/reembolso.
- **Mis turnos** en modo claro y oscuro.
- **Home / grilla de horarios:** badges “Disponible” / “No disponible”, botón “Ir al próximo disponible”, disposición de canchas con 3, 5 o más items si el club lo permite.
- **Móvil (viewport estrecho):** confirmar **dos columnas** en la sección **“Horarios disponibles”** (no una sola columna apilada) y lectura cómoda de hora y precio por celda.
- Ejecutar E2E de badges contra entorno de test (`/test`) cuando el pipeline o entorno local lo permita.

---

## Actualización de layout (posterior al merge del PR)

| Área | Cambio |
|------|--------|
| Selector de canchas (`COURT_CARD_LIST_CELL`) | Siempre **2 columnas**; sin tercera columna en `lg`. |
| Grilla de turnos (`Horarios disponibles`) | **`grid-cols-2`** en el breakpoint por defecto (antes `grid-cols-1` hasta `sm`). |

*Documento generado para dejar registro del contenido funcional y visual de la rama integrada en abril de 2026; tabla de seguimiento añadida para los ajustes de layout en Home.*
