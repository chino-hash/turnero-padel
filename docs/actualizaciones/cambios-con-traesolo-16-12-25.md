# Cambios Realizados - 16 de Diciembre 2025

Documentación de las modificaciones realizadas en la sesión de pair programming con Trae (Modelo Gemini-3-Pro-Preview).

## 1. Estilos del Scrollbar en Navegación Admin

**Objetivo:** Unificar la apariencia del scrollbar horizontal en el menú de navegación administrativo con el estilo oscuro de la aplicación.

**Archivos Modificados:**
- `turnero-padel/app/globals.css`

**Cambios:**
- Se agregaron reglas CSS para el selector `[data-testid="admin-navigation"]`.
- Se aplicó `scrollbar-width: thin`.
- Se configuró el `track` como transparente y el `thumb` con el color `var(--muted)` y borde redondeado.

## 2. Mejora de Contraste en Selector de Fechas

**Objetivo:** Mejorar la legibilidad de los textos (días, números, meses) en el componente de selección de fechas, específicamente para el modo oscuro.

**Archivos Modificados:**
- `turnero-padel/components/HomeSection.tsx`

**Cambios:**
- **Móvil:** Se ajustaron las clases de color de texto para los botones de fecha (`date-btn-mobile`).
  - Mes: de `text-gray-400` a `text-white/80`.
  - Seleccionado: a `text-white/90`.
- **Escritorio:** Se realizaron ajustes similares para garantizar que la fecha ("19 nov") sea legible sobre el fondo oscuro (`bg-gray-800`).

## 3. Optimización de Vista Expandida de Turnos (Dark Mode)

**Objetivo:** Corregir la visualización de los detalles expandidos de un turno (pagos individuales, extras, totales) que presentaban problemas de contraste (fondo claro en tema oscuro).

**Archivos Modificados:**
- `turnero-padel/components/AdminTurnos.tsx`

**Cambios:**
- **Tarjetas de Jugadores:**
  - Se implementó lógica condicional para el fondo y borde: `bg-gray-800 border-gray-700` en modo oscuro vs `bg-gray-50 border-gray-200` en modo claro.
  - Se ajustaron los colores de texto para nombres y roles (`text-gray-300`/`text-gray-400`).
- **Botones de Estado ("Pendiente"):**
  - Se suavizó el color de fondo en hover para modo oscuro (`hover:bg-red-900/20`).
- **Sección de Extras:**
  - El título "Extras Agregados" ahora cambia a gris claro/blanco en modo oscuro.
- **Tarjetas de Totales Financieros:**
  - Se reemplazaron los fondos sólidos claros (`bg-blue-50`) por variantes traslúcidas oscuras (`bg-blue-900/30`) en modo oscuro.
  - Se ajustaron los colores de texto de los montos y etiquetas para asegurar contraste suficiente (ej. `text-blue-200` en lugar de `text-blue-700`).

## 4. Visibilidad de Navegación Admin en Móvil

**Objetivo:** Hacer visible el menú de navegación del panel de administración en dispositivos móviles, ya que estaba oculto por defecto.

**Archivos Modificados:**
- `turnero-padel/app/admin-panel/components/AdminLayoutContent.tsx`

**Cambios:**
- Se eliminó la clase `hidden md:flex` del elemento `nav`.
- Se añadió `flex flex-1 overflow-x-auto` para permitir que el menú se muestre en móvil con desplazamiento horizontal si es necesario.
- Esto permite acceder a las secciones (Canchas, Turnos, Usuarios, etc.) desde dispositivos pequeños.

## 5. Toggle de Grilla de Disponibilidad

**Objetivo:** Ocultar la grilla de disponibilidad por defecto para limpiar la interfaz y evitar cargas de datos innecesarias al inicio.

**Archivos Modificados:**
- `turnero-padel/components/admin/AdminAvailabilityGrid.tsx`

**Cambios:**
- Se implementó un estado local `abierta` (default `false`).
- **Optimización de Fetching:** Se modificó el hook `useSWR` para que pase `null` como key cuando la grilla está cerrada, evitando peticiones a la API y revalidaciones en segundo plano.
- **Interfaz:**
  - Si la grilla está cerrada, solo se muestra un botón "Mostrar grilla".
  - Al abrirla, se muestra la tabla y botones para "Ocultar grilla" y "Actualizar".
- La grilla ahora solo consume recursos y espacio en pantalla cuando el usuario decide verla.

---
*Generado automáticamente por Trae AI.*

## 6. Mensaje de indisponibilidad dentro del grid de horarios

**Objetivo:** Mostrar el mensaje de “Se acabaron los turnos de hoy 😞” dentro del contenedor del grid y en grande, solo cuando no haya turnos disponibles.

**Archivos Modificados:**
- `turnero-padel/components/HomeSection.tsx`

**Cambios:**
- Se eliminaron los mensajes duplicados fuera del grid (móvil y desktop).
- Se integró el mensaje dentro del `div` del grid (`data-testid="slots-grid"`) usando `col-span-full`, centrado y con tipografía grande.
- Se muestra únicamente cuando `!hasAvailableSlots`, respetando la lógica que excluye horarios pasados si la fecha seleccionada es hoy.

**Referencias:**
- `turnero-padel/components/HomeSection.tsx:142` (cálculo de `hasAvailableSlots`)
- `turnero-padel/components/HomeSection.tsx:833` (render del grid y mensaje integrado)

## 7. Scrollbar oscuro en grilla de disponibilidad del admin

**Objetivo:** Unificar el color negro/oscuro del scrollbar horizontal en la tabla de disponibilidad del admin, alineado con los estilos existentes.

**Archivos Modificados:**
- `turnero-padel/components/admin/AdminAvailabilityGrid.tsx`
- `turnero-padel/app/globals.css`

**Cambios:**
- Se añadió `data-testid="admin-availability-grid"` al contenedor con `overflow-x-auto` para apuntar estilos de forma precisa.
- Se definieron reglas de scrollbar:
  - Firefox: `scrollbar-width: thin; scrollbar-color: var(--input) transparent;`
  - WebKit/Chromium: `::-webkit-scrollbar` (altura), `::-webkit-scrollbar-track` (transparente), `::-webkit-scrollbar-thumb` (color oscuro vía `var(--muted)` y borde redondeado).
- Se mantienen los tokens de tema para adaptar el color en modo oscuro y claro, asegurando coherencia con el resto del panel.

**Referencias:**
 - `turnero-padel/components/admin/AdminAvailabilityGrid.tsx:46`
 - `turnero-padel/app/globals.css` (bloque `[data-testid="admin-availability-grid"]`)
## 8. Modo oscuro en Panel de Usuarios

- Objetivo: Adaptar la vista de usuarios al sistema de tema y variantes `dark:` para coherencia visual.
- Archivos modificados:
  - `turnero-padel/app/admin-panel/admin/usuarios/page.tsx`
- Cambios:
  - Se reemplazaron colores fijos por tokens del tema: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`.
  - Se añadieron variantes `dark:` en iconos (`Users`, `TrendingUp`, `Calendar`, `Star`), badges por categoría y contadores.
  - Referencias:
    - Contenedor raíz: `turnero-padel/app/admin-panel/admin/usuarios/page.tsx:68`
    - Título y “Última actualización”: `turnero-padel/app/admin-panel/admin/usuarios/page.tsx:82-86`
    - Métricas principales: `turnero-padel/app/admin-panel/admin/usuarios/page.tsx:95-99, 107-111, 119-123, 131-135`
    - Sección de descuentos: `turnero-padel/app/admin-panel/admin/usuarios/page.tsx:151-178`
    - Encabezados y filas de tabla: `turnero-padel/app/admin-panel/admin/usuarios/page.tsx:197-227`

## 9. Modo oscuro en Panel de Estadísticas

- Objetivo: Uniformar el modo oscuro en métricas, gráficos y paneles informativos.
- Archivos modificados:
  - `turnero-padel/app/admin-panel/admin/estadisticas/page.tsx`
- Cambios:
  - `SimpleChart` ahora usa `bg-muted` y textos con `text-muted-foreground`.
  - Contenedor, título y fecha migrados a tokens del tema.
  - Métricas y iconos con `dark:` para mantener contraste.
  - Paneles de resumen financiero (verde/amarillo/azul) con `dark:bg-*-900` y `dark:border-*-800`.
  - Referencias:
    - `SimpleChart`: `turnero-padel/app/admin-panel/admin/estadisticas/page.tsx:9-16`
    - Contenedor y encabezado: `turnero-padel/app/admin-panel/admin/estadisticas/page.tsx:58, 72-76`
    - Métricas: `turnero-padel/app/admin-panel/admin/estadisticas/page.tsx:85-89, 97-101, 109-113, 121-125`
    - Promociones: `turnero-padel/app/admin-panel/admin/estadisticas/page.tsx:163-181`
    - Resumen financiero: `turnero-padel/app/admin-panel/admin/estadisticas/page.tsx:206-236`

## 10. Modo oscuro en Canchas, Productos y Torneos

- Objetivo: Extender el patrón de dark mode a secciones administrativas restantes.
- Archivos modificados:
  - `turnero-padel/app/admin-panel/admin/canchas/page.tsx`
  - `turnero-padel/app/admin-panel/admin/productos/page.tsx`
  - `turnero-padel/app/admin-panel/admin/torneos/page.tsx`
- Cambios (Canchas):
  - Títulos y descripciones a `text-foreground` y `text-muted-foreground`.
  - Bloques informativos con `bg-muted`; acento verde con `dark:` en montos.
  - Modal usa `bg-card` y `text-foreground`; labels migradas a `text-muted-foreground`.
  - Referencias:
    - Encabezado: `turnero-padel/app/admin-panel/admin/canchas/page.tsx:191-199`
    - Estado y bloques: `turnero-padel/app/admin-panel/admin/canchas/page.tsx:213-229`
    - Modal: `turnero-padel/app/admin-panel/admin/canchas/page.tsx:256-263, 271-334`
- Cambios (Productos):
  - Contenedor a `bg-background`; encabezado y fecha con tokens.
  - Filtros (`select`) con `dark:border`, `dark:bg`, `dark:text`.
  - Métricas y badges con variantes `dark:`; estados vacíos con `text-muted-foreground`.
  - Tabla con estado `outline` para activo/inactivo y `dark:` en bordes/colores.
  - Referencias:
    - Encabezado: `turnero-padel/app/admin-panel/admin/productos/page.tsx:312-315`
    - Filtros: `turnero-padel/app/admin-panel/admin/productos/page.tsx:335-346`
    - Métricas: `turnero-padel/app/admin-panel/admin/productos/page.tsx:353-409`
    - Tabla y estados: `turnero-padel/app/admin-panel/admin/productos/page.tsx:424-492`
    - Confirmación de eliminación: `turnero-padel/app/admin-panel/admin/productos/page.tsx:639-642`
- Cambios (Torneos):
  - Título y descripción con tokens; navegación y stepper adaptados al tema.
  - Formularios e inputs con `bg-background`, `border-input`, `text-muted-foreground`.
  - Tarjetas y vista previa con `bg-card`, `border-border`, y acentos `dark:`.
  - Referencias:
    - Encabezado: `turnero-padel/app/admin-panel/admin/torneos/page.tsx:134-137`
    - Stepper: `turnero-padel/app/admin-panel/admin/torneos/page.tsx:149-175`
    - Formulario (grupo evento/categorías): `turnero-padel/app/admin-panel/admin/torneos/page.tsx:193-267`
    - Días del torneo y bloques: `turnero-padel/app/admin-panel/admin/torneos/page.tsx:347-413, 423-448`
    - Vista previa (panel derecho): `turnero-padel/app/admin-panel/admin/torneos/page.tsx:494-593`

## 11. Verificación y notas

- Se verificaron las rutas: `/admin-panel/admin/usuarios`, `/admin-panel/admin/estadisticas`, `/admin-panel/admin/canchas`, `/admin-panel/admin/productos`, `/admin-panel/admin/torneos`.
- Los errores observados en el navegador (SSE, `api/auth/session`, `api/courts`, `api/productos`, `api/slots`) son propios de endpoints y tiempo real, no del estilado ni del modo oscuro.
- El modo oscuro funciona a través de:
  - `@custom-variant dark (&:is(.dark *))` en `turnero-padel/app/globals.css`.
  - `AppStateProvider` que alterna la clase `.dark` en `<html>` y provee `isDarkMode` al layout admin.
## 12. Modo oscuro: Resumen Financiero y Filtros del panel

**Objetivo:** Atenuar elementos que sobresalían en dark mode y mejorar contraste sin perder legibilidad.

**Archivos Modificados:**
- `turnero-padel/components/AdminTurnos.tsx`
- `turnero-padel/app/admin-panel/admin/estadisticas/page.tsx`
- `turnero-padel/app/admin-panel/admin/page.tsx`

**Cambios:**
- Resumen Financiero (Turnos):
  - Icono `TrendingUp` con `dark:text-green-400`.
  - Cajas verde/amarillo/azul con fondos translúcidos `dark:bg-*-900/20`.
  - Textos ajustados a `dark:text-*-300/400` para reducir brillo.
- Resumen Financiero (Estadísticas):
  - Fondos `dark:bg-*-900/20` y números principales `dark:text-*-300`.
  - Bordes mantienen `dark:border-*-800` para separación sutil.
- Métricas del Dashboard (Admin):
  - Colores controlados con `dark:text` en los cinco indicadores.
  - Badges y bordes en “Vista rápida” usan `dark:bg-*-900/30` y `dark:text-*-300`; contenedores con `dark:border-gray-800`.
- Bloque de Filtros (Turnos):
  - Contenedor `dark:bg-gray-900/20`.
  - Labels `dark:text-gray-300`.
  - Selects con `dark:bg-gray-900/30 dark:border-gray-700 dark:text-gray-200`.

**Referencias:**
## 13. Eliminación del card “Accesos rápidos” en el Dashboard

**Objetivo:** Simplificar la interfaz removiendo el bloque redundante de accesos rápidos.

**Archivos Modificados:**
- `turnero-padel/app/admin-panel/admin/page.tsx`

**Cambios:**
- Se eliminó el `Card` completo que contenía el título “Accesos rápidos” y los enlaces a Canchas, Turnos, Usuarios y Productos.
- Se retiró el import no usado `Package` para evitar advertencias.

**Referencias:**
- Eliminación del bloque: `turnero-padel/app/admin-panel/admin/page.tsx:727-751`
- Limpieza de imports: `turnero-padel/app/admin-panel/admin/page.tsx:28`

## 14. Azul eléctrico en el ícono del header

**Objetivo:** Uniformar el encabezado con un degradado azul eléctrico consistente con los botones.

**Archivos Modificados:**
- `turnero-padel/app/admin-panel/components/AdminLayoutContent.tsx`

**Cambios:**
- Actualizado el degradado del contenedor del ícono: de `from-blue-600 to-blue-700` a `from-blue-500 to-blue-600`.

**Referencias:**
- Degradado del ícono: `turnero-padel/app/admin-panel/components/AdminLayoutContent.tsx:29-31`

## 15. Botón “Admin” con mayor jerarquía visual

**Objetivo:** Mejorar la visibilidad del botón título “Admin” alineándolo con el estilo azul eléctrico y añadiendo accesibilidad.

**Archivos Modificados:**
- `turnero-padel/app/admin-panel/components/AdminTitleButton.tsx`

**Cambios:**
- Se aplicó degradado `bg-gradient-to-r from-blue-500 to-blue-600`, texto blanco y `shadow-md`.
- Se añadieron `px-3 py-1.5`, `rounded-md` y foco accesible con `focus:ring-2`.

**Referencias:**
- Estilos nuevos del botón: `turnero-padel/app/admin-panel/components/AdminTitleButton.tsx:14-22`

## 16. Mostrar precio por cancha en la tarjeta “Canchas”

**Objetivo:** Visualizar el precio total por cancha dentro del card de “Canchas” para referencia rápida.

**Archivos Modificados:**
- `turnero-padel/app/admin-panel/admin/page.tsx`

**Cambios:**
- Se añadió una lista compacta bajo “Activas” con `Nombre: $Precio` calculado como `basePrice × priceMultiplier`.

**Referencias:**
- Render de precios: `turnero-padel/app/admin-panel/admin/page.tsx:635-638`

## 17. Legibilidad del nombre de cancha en lista compacta (modo oscuro)

**Objetivo:** Aclarar el nombre de la cancha en la vista “Vista rápida de turnos” cuando está activo el modo oscuro.

**Archivos Modificados:**
- `turnero-padel/app/admin-panel/admin/page.tsx`

**Cambios:**
- Se condicionó el color del texto del nombre de la cancha: `text-gray-200` en modo oscuro y `text-gray-800` en modo claro.
- Se incorporó `isDarkMode` desde el `AppStateProvider` para aplicar la lógica de tema.

**Referencias:**
- Uso de `isDarkMode` en el componente: `turnero-padel/app/admin-panel/admin/page.tsx:105`
- Texto aclarado en la lista compacta: `turnero-padel/app/admin-panel/admin/page.tsx:729-732`
## 18. Aclarar métricas y títulos en modo oscuro (Dashboard y Turnos)

- Objetivo: Mejorar la legibilidad de números grandes y encabezados en dark mode.
- Archivos modificados:
  - `turnero-padel/app/admin-panel/admin/page.tsx`
  - `turnero-padel/components/AdminTurnos.tsx`
- Cambios:
  - Dashboard (tarjetas de “Canchas”, “Turnos”, “Usuarios”, “Ingresos”): números principales pasan a `text-gray-900 dark:text-white`.
  - Turnos (sección admin): título `h2` “Gestión de Turnos” y métricas rápidas (“Total Turnos”, “Confirmados”, “Ingresos”) con `text-gray-900 dark:text-white`.
- Referencias:
  - Dashboard: `turnero-padel/app/admin-panel/admin/page.tsx:673, 694, 710, 730`
  - Turnos: `turnero-padel/components/AdminTurnos.tsx:1072, 1112, 1126, 1140`

## 19. Contraste del botón “Pendiente” en modo oscuro

- Objetivo: Aumentar el contraste del botón rojo “Pendiente” sobre fondos oscuros.
- Archivos modificados:
  - `turnero-padel/components/AdminTurnos.tsx`
- Cambios:
  - En modo oscuro: `border-red-500 text-red-300 bg-red-900/30 hover:bg-red-900/40`.
  - En modo claro se mantiene: `border-red-300 text-red-600 hover:bg-red-50`.
  - El estado “Pagado” continúa con `bg-green-600 hover:bg-green-700 text-white`.
- Referencias:
  - Botón toggle de pago individual: `turnero-padel/components/AdminTurnos.tsx:899-909`

## 20. Selección múltiple en “Asignado a” para Extras

- Objetivo: Permitir escoger varios jugadores a la vez al agregar un extra y dividir el costo proporcionalmente.
- Archivos modificados:
  - `turnero-padel/components/AdminTurnos.tsx`
  - `turnero-padel/app/admin-panel/admin/page.tsx`
  - `turnero-padel/components/ui/popover.tsx` (reutilizado)
  - `turnero-padel/lib/utils/extras.ts` (nueva utilidad de prorrateo)
- Cambios:
  - Se reemplazó el `Select` de “Asignado a” por un `Popover` con checkboxes para `Jugador 1..4` y opción “Todos los jugadores”.
  - Estado `selectedPlayers` que mantiene la selección hasta que el usuario la cambie.
  - “Todos los jugadores” marca/desmarca las cuatro casillas. Si se marcan las cuatro manualmente, el estado se muestra como “Todos”.
  - Fallback sin tocar backend para 2–3 jugadores: se crean múltiples extras locales (uno por jugador) con el costo total prorrateado equitativamente.
  - Para 4 seleccionados se envía `assignedToAll = true`; para 1 seleccionado se envía el jugador específico.
- Referencias:
  - Popover y checkboxes: `turnero-padel/components/AdminTurnos.tsx:1856–1872`, `turnero-padel/app/admin-panel/admin/page.tsx:930–946`
  - Envío y fallback multi-jugador: `turnero-padel/components/AdminTurnos.tsx:539–607`, `turnero-padel/app/admin-panel/admin/page.tsx:471–475`
  - Utilidad de reparto: `turnero-padel/lib/utils/extras.ts:1–10`

## 21. Agrupación visual de Extras compartidos

- Objetivo: Mostrar una sola fila por extra cuando está compartido entre varios jugadores, con etiqueta clara y costo total sumado.
- Cambios:
  - Se agrupan extras por nombre y conjunto de jugadores. El encabezado “Extras Agregados” muestra la cantidad de grupos.
  - Etiqueta: “(Compartido por Jx y Jy)” con abreviaturas J1–J4.
  - Al eliminar un grupo, se eliminan todas las filas internas que lo componen.
- Referencias:
  - Conteo y render de grupos: `turnero-padel/components/AdminTurnos.tsx:1018–1056`, `turnero-padel/components/AdminTurnos.tsx:1058–1115`

## 22. Mejora de visibilidad en spans de la lista de extras

- Objetivo: Aumentar contraste y jerarquía visual para nombre, etiqueta y precio de cada extra.
- Cambios:
  - Nombre del producto con `font-medium` y color dependiente del tema (`text-white` en oscuro / `text-gray-900` en claro).
  - Precio con `font-semibold` y color dependiente del tema.
  - Etiqueta secundaria (“Compartido por …”) con `text-xs` y color secundario de alto contraste (`text-gray-300` oscuro / `text-gray-500` claro).
- Referencias:
  - Ajustes de tipografía y colores: `turnero-padel/components/AdminTurnos.tsx:1090–1111`

## 23. Pruebas unitarias y E2E

- Unitarias:
  - `turnero-padel/__tests__/lib/utils/extras.test.ts`: verifica prorrateo con redondeo a centavos y distribución de residuo.
  - Ejecutar: `npm run test:unit`
- E2E:
  - `turnero-padel/tests/e2e/extras-multiselect.spec.ts`: valida selección de J3 y J4 y visualización “Compartido por J3 y J4”.
  - Requisitos: servidor en `npm run dev` y navegadores Playwright instalados (`npx playwright install`).
  - Ejecutar: `npm run test:playwright -- tests/e2e/extras-multiselect.spec.ts`

## 24. Sistema de visualización y colores de canchas (1–7, cíclico)

- Asignación automática de colores por número:
  - 1: #8b5cf6 (morado), 2: #ef4444 (rojo), 3: #008000 (verde)
  - 4: #ff9933 (naranja), 5: #f54ea2 (rosa), 6: #00c4b4 (turquesa), 7: #e2e8f0 (gris claro)
  - Para N>7, la paleta se repite en orden (cíclica).
- Backend:
  - Derivación por número de “Cancha N” y compatibilidad con alias históricos (Court A/B/C, IDs legacy) para 1–3.
  - Referencia: `turnero-padel/lib/services/courts.ts:46–69` (función de colores por número).
- Frontend (HomeSection):
  - Hex por número para la cancha seleccionada: `turnero-padel/components/HomeSection.tsx:118–131`.
  - Hex por número para cada tarjeta de cancha: `turnero-padel/components/HomeSection.tsx:340–347`.
  - Leyenda número-color visible durante la creación: `turnero-padel/components/HomeSection.tsx:320–339`.
- Visualización especial solo al crear cancha:
  - Se activa automáticamente durante ~60s cuando se recibe `courts_updated` con `action: 'created'` (SSE).
  - La grilla se separa en:
    - `courts-available`: muestra únicamente canchas disponibles con su color y etiqueta.
    - `courts-other`: muestra canchas no disponibles (no se presentan como disponibles).
  - Render condicional y estados: `turnero-padel/components/HomeSection.tsx:343–431`.
- SSE y endpoints usados:
  - Emisión en creación/actualización de cancha: `turnero-padel/app/api/courts/route.ts:41–52, 69–86`.
  - Infraestructura SSE: `turnero-padel/lib/sse-events.ts:37–61`, endpoint `turnero-padel/app/api/events/route.ts:9–86`.
- Disponibilidad admin:
  - Se elimina el límite `take: 3` para incluir 4ª/5ª/6ª/7ª cancha.
  - Referencia: `turnero-padel/app/api/admin/availability/route.ts:34–39`.
- Validaciones y estado:
  - Los elementos especiales no aparecen antes del evento de creación; se desactivan automáticamente después.
  - La paleta cíclica garantiza color consistente para números fuera del rango 1–7.
- Accesibilidad:
  - Contraste mantenido: textos oscuros sobre fondos claros y variantes `dark:` en modo oscuro.
  - Leyenda textual “Cancha N” más swatches de color para identificación clara.

## 25. Rediseño de grilla de disponibilidad (Dark Mode + BEM)

- Objetivo: Transformar la grilla en una interfaz administrativa profesional, con esquema dark, accesible y responsive.
- Archivos modificados:
  - `turnero-padel/components/admin/AdminAvailabilityGrid.tsx`
  - `turnero-padel/components/admin/CourtStatusIndicator.tsx`
  - `turnero-padel/app/globals.css`
- Cambios clave:
  - Estructura BEM y semántica de tabla con roles/aria:
    - Contenedores y tabla: `availability-grid`, `availability-grid__scroll`, `availability-grid__table`, `availability-grid__head`, `availability-grid__row`, `availability-grid__cell`, `availability-grid__badges`.
    - Encabezados fijos: `sticky top-0` para `th`.
    - Referencias:
      - `turnero-padel/components/admin/AdminAvailabilityGrid.tsx:51-66`, `:67-93`, `:95-124`
  - Zebra striping y esquema de color Dark Mode:
    - Filas pares: `#1a1a1a`; impares: `#262626`; texto principal: `#e6e6e6`.
    - Referencias:
      - Bloque BEM en `turnero-padel/app/globals.css:409+`
  - Rediseño de indicadores:
    - Sustitución de círculos por badges rectangulares 28×28, borde 4px, espaciado 12px.
    - Estados:
      - Libre: fondo transparente, borde `#2d5e2d`, texto gris 70% (`opacity`).
      - Ocupado: fondo `#6d2a2a`, “×” 10px + número en blanco y sombra suave en hover.
      - Pendiente: borde ámbar y fondo tenue.
    - Referencias:
      - `turnero-padel/components/admin/CourtStatusIndicator.tsx:17-41`
      - Estilos en `turnero-padel/app/globals.css:409+`
  - Maquetación y rendimiento visual:
    - Padding de celdas: mínimo 16px (`px-4 py-4`), alineación vertical centrada (`align-middle`).
    - Transiciones `300ms ease-in-out`, CLS reducido con dimensiones fijas en badges.
    - Preferencia de color según sistema con `prefers-color-scheme: dark`.
  - Accesibilidad:
    - `role="table"`, `rowgroup`, `columnheader`, `cell`, `aria-label` por secciones.
    - `data-state` en badges para manejos dinámicos.

## 26. Modal de Confirmar Reserva: blur de fondo y contraste en total

- Objetivo: El modal estaba demasiado transparente; se añadió blur para separar del fondo y se reforzó el contraste del label del total.
- Archivos modificados:
  - `turnero-padel/app/globals.css`
- Cambios:
  - Desenfoque del fondo del modal:
    - `backdrop-filter: blur(8px);` y `-webkit-backdrop-filter: blur(8px);`
    - Referencia: `turnero-padel/app/globals.css:286-287`
  - Visibilidad del label “Total cancha (4 personas):”
    - Se agregó `.total-label { color: var(--foreground); opacity: 0.95; }`
    - Referencia: `turnero-padel/app/globals.css:445-449`

## 27. Verificación

- Ruta probada: `http://localhost:3000/admin-panel/admin/turnos` (encabezados sticky, zebra striping, badges y blur del modal).
- Observaciones de errores de tiempo real (SSE, `api/auth/session`) no afectan el estilado aplicado.

---
*Actualización agregada automáticamente por Trae AI (16/12/2025) sin borrar contenido previo.*

## 28. Edición de información del dashboard (Admin)

- Objetivo: Agregar una funcionalidad para editar el título, etiquetas de métricas y prefijo de moneda del bloque de resumen del dashboard, sin modificar los placeholders `div` existentes y excluyendo explícitamente la barra de disponibilidad.
- Archivos modificados:
  - `turnero-padel/app/admin-panel/admin/page.tsx`
- Cambios:
  - Se añadió el botón “Editar información del dashboard” debajo del card de resumen.
  - Se incorporó un modal con campos: Título, etiquetas para “Turnos hoy”, “Confirmados”, “Pagados”, “Ingresos estimados”, “Canchas activas”, y prefijo de moneda.
  - Validaciones: título requerido; prefijo de moneda requerido y máximo 3 caracteres; mensajes de error visibles bajo cada campo.
  - Persistencia en BD usando el modelo `SystemSetting` con la clave `dashboard_settings` mediante la API CRUD (`GET /api/crud/systemSetting?key=dashboard_settings&limit=1`, `POST /api/crud/systemSetting`, `PUT /api/crud/systemSetting/:id`).
  - Notificaciones de éxito/error con `react-hot-toast`; estilo consistente con los componentes UI existentes.
  - Aplicación del `currencyPrefix` en los importes del resumen y en el card de “Ingresos”.
- Referencias:
  - Botón y modal: `turnero-padel/app/admin-panel/admin/page.tsx`
  - Carga inicial de configuración (`useEffect`) y guardado via fetch a la API CRUD: `turnero-padel/app/admin-panel/admin/page.tsx`
- Verificación:
  - Ruta probada: `http://localhost:3000/admin-panel/admin`.
  - Al pulsar “Editar información del dashboard”, el modal permite modificar y guardar; se muestra “Cambios guardados” en caso de éxito.
  - La barra de disponibilidad no se ve afectada por esta edición; los `div` placeholders permanecen sin cambios.
## 29. Blur en overlay de modales (Reserva y Radix)

- Objetivo: El desenfoque del fondo del modal no se veía en producción (Vercel). Se aplicó blur al overlay para asegurar consistencia visual en todos los modales.
- Archivos modificados:
  - `turnero-padel/components/ui/dialog.tsx`
  - `turnero-padel/components/ui/alert-dialog.tsx`
  - `turnero-padel/app/globals.css`
- Cambios:
  - Overlay de Radix `DialogOverlay`: añadido `backdrop-blur-sm` junto a `bg-black/50` para desenfocar el fondo.
  - Overlay de Radix `AlertDialogOverlay`: añadido `backdrop-blur-sm` junto a `bg-black/50` para desenfocar el fondo.
  - Overlay del modal de reserva (`.modal-overlay` en CSS global): añadido `backdrop-filter: blur(6px)` y su prefijo `-webkit-backdrop-filter`.
- Referencias:
  - `turnero-padel/components/ui/dialog.tsx:41` (clase del overlay con `backdrop-blur-sm`)
  - `turnero-padel/components/ui/alert-dialog.tsx:39` (clase del overlay con `backdrop-blur-sm`)
  - `turnero-padel/app/globals.css:271` y `:806` (blur en `.modal-overlay`)
  - `turnero-padel/app/globals.css:289` (blur existente en `.modal-content-new`)
- Contexto:
  - El modal de reserva usa `SlotModal` con overlay propio (`.modal-overlay`) y contenido con blur (`.modal-content-new`).
  - Los modales de confirmación/pago usan Radix (`Dialog`/`AlertDialog`) y ahora también desenfocan el fondo vía overlay.
- Verificación:
  - Servidor local levantado en `http://localhost:3001/` para validación visual del blur en los modales.
  - Tailwind v4 sin configuración personalizada; las clases `backdrop-blur` están en strings estáticas y se conservan en build de producción.
- Nota de despliegue:
  - Asegurar que Vercel despliegue esta copia del proyecto. Si está apuntando a otra carpeta/branch, actualizar el origen antes del build.
