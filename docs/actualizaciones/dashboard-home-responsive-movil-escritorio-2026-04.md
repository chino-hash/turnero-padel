# Documentación: ajustes responsive Home (móvil vs escritorio)

**Fecha de referencia:** abril de 2026.  
**Ámbito:** dashboard de reservas, vista Home (`components/HomeSection.tsx` y `padel-booking.tsx`).

## Resumen

Se aplicaron ajustes para mantener una experiencia fuerte en móvil y mejorar el aprovechamiento de espacio en escritorio:

- estabilización visual al hacer scroll (evitando artefactos donde algunos horarios parecían desaparecer),
- aumento de contraste en tarjetas informativas en modo oscuro,
- distribución responsive de tarjetas de canchas (centradas en móvil y más densas en desktop),
- remaquetado de la card superior en escritorio para reducir vacío visual.

## Objetivos del cambio

1. **Móvil:** conservar centrado y legibilidad actual (look aprobado).
2. **Escritorio:** usar mejor el ancho disponible sin perder jerarquía visual.
3. **Consistencia dark mode:** oscurecer superficies tipo glass para reforzar contraste sobre fondo con blur.
4. **Estabilidad de render:** evitar re-renders continuos durante scroll.

## Cambios implementados

### 1) Estabilización de scroll en dashboard

**Archivo:** `padel-booking.tsx`

- Se eliminó el estado reactivo de scroll (`scrollY`) y el `useEffect` que actualizaba el estado en cada desplazamiento.
- Se reemplazó el cálculo dinámico de blur/overlay por valores estables para el fondo.

**Resultado esperado:** menos trabajo de render durante scroll y menor probabilidad de parpadeos/desapariciones visuales en tarjetas.

### 2) Contraste en tarjetas informativas (dark mode)

**Archivo:** `components/HomeSection.tsx`

- Se aumentó opacidad de superficies `bg-black/*` en:
  - tarjetas de horarios (normal, seleccionada y deshabilitada),
  - bloque de estados,
  - toggles de filtros/vista,
  - botón de actualizar,
  - tarjetas de canchas.

**Resultado esperado:** mejor separación figura/fondo y lectura más estable sobre imagen de fondo.

### 3) Distribución de canchas responsive (manteniendo centrado)

**Archivo:** `components/HomeSection.tsx`

- Se mantuvo el esquema `flex-wrap + justify-center` para conservar la última fila centrada.
- Se actualizó `COURT_CARD_LIST_CELL` para que escale por breakpoint:
  - móvil/sm: 2 columnas,
  - md: 3 columnas,
  - xl: 4 columnas,
  - 2xl: 5 columnas.
- Se ajustó `gap` en desktop para respiración visual (`md:gap-4`).

**Resultado esperado:** en móvil se mantiene el layout centrado que ya gustaba, y en escritorio se aprovecha mejor el ancho.

### 4) Re-layout de card superior en escritorio (opción 2)

**Archivo:** `components/HomeSection.tsx`

- El bloque principal pasó a layout `grid` en `lg+`:
  - columna de contenido principal,
  - columna de precio dedicada.
- El botón **Ir al próximo disponible** dejó de ocupar todo el ancho en desktop:
  - móvil: `w-full`,
  - escritorio: ancho contenido (`lg:w-auto` + `lg:min-w-[360px]`) centrado.

**Resultado esperado:** disminuye el “vacío” horizontal en desktop y mejora el balance visual de la card.

## Archivos afectados

- `padel-booking.tsx`
- `components/HomeSection.tsx`

## Verificación manual sugerida

1. **Móvil (pantalla angosta):**
   - la card superior mantiene proporción y CTA full width,
   - canchas siguen centradas en 2 columnas.
2. **Desktop (pantalla ancha):**
   - card superior se ve más compacta y balanceada,
   - botón CTA no ocupa todo el ancho,
   - canchas pasan a 3/4/5 por fila según ancho disponible, manteniendo centrado.
3. **Scroll continuo en Home:**
   - no deben observarse desapariciones visuales de horarios por artefactos de render.
4. **Modo oscuro:**
   - mejor contraste de tarjetas informativas sobre el fondo.

---

Documento generado para registrar los ajustes de responsive y contraste solicitados para separar correctamente la experiencia móvil y escritorio en Home.
