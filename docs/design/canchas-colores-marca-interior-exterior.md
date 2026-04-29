# Colores de canchas: marca, estado actual y propuesta interior / exterior

**Fecha:** 2026-04-28  
**Estado:** Implementado en runtime productivo: `Court.courtType` (OUTDOOR/INDOOR), color por tipo, default OUTDOOR en alta de tenant y edición desde admin/super admin.

---

## 1. Propósito

Unificar criterios sobre **qué colores usa la aplicación** frente a **qué colores tienen las canchas en UI**, y proponer una dirección coherente para distinguir **canchas techadas (interior/cubierta)** y **canchas al aire libre (exterior)** sin repetir el efecto “arcoíris” de una paleta distinta por número de cancha sin significado.

---

## 2. Radiografía de la paleta global (página / tema)

Definición principal en `app/globals.css`:

| Rol | Token / variable | Valor típico | Uso en UI |
|-----|------------------|--------------|-----------|
| Acento marca lima | `--color-neon-lime` | `#BEF264` (tema club / oscuro); en `:root` claro puede aparecer también verde oscuro para algunos contrastos | Badges “Disponible”, marca “Book”, botón “Ir al próximo disponible”, gradientes landing |
| Acento interacción / precio | `--electric-teal` | `#0EA5E9` | Selección de slots, bordes activos, total en modal, toggles |
| Tema club | `.dashboard-theme` | Fondos y cards con **matiz violeta suave** (~277 en OKLCH); `--primary` alineado a esa familia | Dashboard tenant (`SlugDashboardClient`) |
| Neutros | `--background`, `--foreground`, `--card`, `--muted`, etc. | OKLCH / zinc | Base shadcn + overrides dashboard |
| Derivados lima | `--dashboard-lime-surface`, `--dashboard-lime-border`, … | `color-mix` con `--card` / `--border` | Superficies y bordes del dashboard |

La **landing** y el **hero** enfatizan negro + lima; el manual histórico de marca en `docs/analisis/identidad-marca-fase-1-y-2.md` describe otra paleta (azul `#0D5BFF`, etc.): conviene tratarla como **referencia de posicionamiento**, no como duplicado exacto del CSS actual (véase también `docs/analisis/estado-identidad-marca-implementado-vs-faltante.md`).

---

## 3. Estado actual: colores por cancha en código

### 3.1 Fuente de verdad técnica

- Archivo: `lib/court-colors.ts`
- **`COURT_COLOR_PALETTE`**: gradientes Tailwind por índice (morado, rojo, verde bosque, naranja, rosa, cian, gris).
- **`COURT_COLOR_HEX`**: hex alineados para texto inline (slots, dashboard).
- **`COURT_TYPE_COLORS`**: colores por tipo (`OUTDOOR` verde, `INDOOR` azul) usados en runtime.
- **`getCourtFeaturesByType(type)` / `getCourtHexByType(type)`**: helpers de color por clasificación.
- **`getCourtFeaturesByIndex(n)`**: asignación por **número de cancha** `(n - 1) % paleta.length`.
- **`getCourtHexForDisplay(courtId, courtName)`**: mismo criterio por número extraído del nombre.

### 3.2 Dónde impacta

- Bootstrap / creación de tenant: `getCourtFeaturesByIndex` en `lib/services/tenants/bootstrap.ts`, `app/api/tenants/route.ts`.
- Servicio: `lib/services/courts.ts` — si `Court.features` en BD **no** es un JSON con `color`, `bgColor`, `textColor`, se recalculan colores con la paleta por índice.
- UI: `components/HomeSection.tsx` (nombre de cancha en slots con `getCourtHexForDisplay`; tarjetas usan `court.color` / features).

### 3.3 Documentación que ya hablaba de esto

| Documento | Qué dice sobre colores de canchas |
|-----------|-----------------------------------|
| [feature-dashboard-ui-booking-pr5-2026-04.md](../actualizaciones/feature-dashboard-ui-booking-pr5-2026-04.md) | PR #5: alineación con marca lima; en **Canchas** explícitamente: *tercer color de paleta fijo a verde bosque `#008000`* en `lib/court-colors.ts` para consistencia con visualización por número. Lista cambios en Home y tokens CSS. |
| [identidad-marca-fase-1-y-2.md](../analisis/identidad-marca-fase-1-y-2.md) | **Sistema de color** de marca (primario azul, acentos cyan/violeta, estados). No describe la paleta por cancha; sirve de contraste con lo implementado en app. |
| [database-diagram.md](../architecture/database-diagram.md) | Ejemplo de `Court.features` como JSON de **amenities** (`lighting`, `roof`, `parking`, …). **No coincide** con el uso actual en servicios, donde `features` suele almacenar **colores UI** o mezclas históricas. Tratar el diagrama como **orientativo** hasta que modelo y código unifiquen un solo esquema. |

Otros documentos ([admin-canchas-documentacion.md](../admin/admin-canchas-documentacion.md), [courts.md](../apis/courts.md)) apenas mencionan `features` o colores visuales.

---

## 4. Problema percibido

- Varios colores fuertes simultáneos (una hue por cancha) pueden leerse como **decoración** sin semántica.
- Los acentos globales (**lima** = disponibilidad/marca, **teal** = foco/acción) deben **reservarse** para esos roles.

---

## 5. Propuesta: dos familias semánticas (interior vs exterior)

**Principio:** el color de tipo de cancha **no** debe competir con lima ni con el teal de selección; usar tonos **contenidos** y siempre acompañar con **etiqueta textual** (“Techada”, “Al aire libre”) o icono.

### Opción A — Alineada al tema dashboard (recomendada)

| Tipo | Rol visual | Hex sugerido (texto / icono) | Notas |
|------|------------|------------------------------|--------|
| **Interior / techada** | Familia del primary violeta del club | `#6d5ebd` – `#7c6fd4` | Refuerza el matiz ~277 de `.dashboard-theme` |
| **Exterior / aire libre** | Cielo, sin usar el teal de UI | `#38bdf8` – `#5ab3e8` | Cercano al frío del sistema pero **distinto** de `#0EA5E9` |

Fondos: preferir `color-mix` con `--card` al 12–18 % en lugar de bloques enteros saturados.

### Opción B — Más neutra

- Interior: `#57534e` / `#64748b` (stone/slate cálido).
- Exterior: `#64748b` / `#475569` (slate frío).

### Opción C — Contraste un poco mayor

- Interior: ámbar contenido (ej. `#b45309` texto sobre fondo claro, o solo icono `#d97706`).
- Exterior: azul cielo contenido (`#0284c7` / `#0369a1`).

### Modo oscuro

Aclarar los mismos matices (~10 %) o equivalentes legibles sobre `#18181b` / cards oscuras (p. ej. `#94a3b8`, `#a5b4fc`, `#7dd3fc`) verificando contraste WCAG.

### Leyenda obligatoria

Pequeña leyenda en la zona de reserva: **Techada** = color/muestra A, **Aire libre** = color/muestra B.

---

## 6. Datos necesarios (enlace con modelo)

Para aplicar la propuesta hace falta clasificar cada cancha:

- **Etiquetas** en datos (p. ej. `techada`, `aire libre`, `indoor`, `outdoor`) — ya aparecen en tests de integración.
- O campo dedicado en BD (enum) si se quiere evitar ambigüedad.

Hoy `Court.features` en TypeScript (`types/types.ts`) modela sobre todo **estilos** (`color`, `bgColor`, `textColor`); el servicio mezcla eso con fallback por índice. Una evolución limpia sería separar **estilo persistido** / **tags de negocio** / **tipo cubierta** en el modelo o en un JSON bien acordado (véase discrepancia con `database-diagram.md`).

---

## 7. Referencias de código

- `lib/court-colors.ts` — paleta y helpers.
- `app/globals.css` — `:root`, `.dashboard-theme`, `--electric-teal`, `--color-neon-lime`.
- `components/HomeSection.tsx` — slots y selector de canchas.
- `lib/services/courts.ts` — `transformCourtData`, colores por defecto.

---

## 8. Changelog del documento

| Fecha | Cambio |
|-------|--------|
| 2026-04-28 | Creación: radiografía de marca, revisión de docs existentes, propuestas interior/exterior y criterios de reserva de acentos. |
| 2026-04-28 | Actualización de estado: implementación end-to-end validada; bugfix en `PUT /api/courts` para edición de tipo y mejora de diagnóstico de errores. Ver detalle en `docs/actualizaciones/canchas-court-type-exterior-interior-fix-put-2026-04.md`. |
