# Cambios con TraeSolo — 16/12/2025

## Sistema de colores por número de cancha
- Asignación automática por número:
  - Cancha 1: #8b5cf6 (morado)
  - Cancha 2: #ef4444 (rojo)
  - Cancha 3: #008000 (verde)
  - Cancha 4: #ff9933 (naranja)
  - Cancha 5: #f54ea2 (rosa)
  - Cancha 6: #00c4b4 (turquesa)
  - Cancha 7: #e2e8f0 (gris claro)
- Paleta cíclica para N > 7: se repite el mismo orden de colores.
- Detección de número:
  - Se infiere desde el nombre “Cancha N”.
  - Compatibilidad con alias históricos “Court A/B/C” e IDs originales para 1–3.

## Implementación en backend
- Se actualiza la derivación de colores en `turnero-padel/lib/services/courts.ts:46–69` para basarse en el número de cancha y aplicar la paleta 1–7 con clases Tailwind.
- Fallback seguro: si no se puede inferir el número, se asigna un color por defecto estable.

## Implementación en frontend (HomeSection)
- Asignación de hex por número:
  - `turnero-padel/components/HomeSection.tsx:118–131` selecciona hex de la paleta por número para la cancha enfocada.
  - `turnero-padel/components/HomeSection.tsx:340–347` usa la misma paleta para cada tarjeta de cancha.
- Leyenda número-color:
  - Se agrega una leyenda para “Cancha N” ↔ color, visible durante la creación de nuevas canchas: `turnero-padel/components/HomeSection.tsx:320–339`.
- Visualización especial solo al crear cancha:
  - La UI se activa automáticamente por 60s al recibir `courts_updated` con acción `created` (SSE).
  - Suscripción y estado: `turnero-padel/components/HomeSection.tsx:3–12` (import), `turnero-padel/components/HomeSection.tsx:76–83` (estado), `turnero-padel/components/HomeSection.tsx:98–106` (handler).
  - Separación en dos contenedores:
    - `courts-available`: muestra únicamente canchas disponibles con etiquetas y colores distintivos.
    - `courts-other`: muestra canchas no disponibles (no se muestran como disponibles).
  - Render condicional de estos contenedores: `turnero-padel/components/HomeSection.tsx:343–431`.

## Disponibilidad administración
- Se elimina el límite de 3 canchas en la API de disponibilidad admin.
  - Cambio en `turnero-padel/app/api/admin/availability/route.ts:34–39`: se quita `take: 3`.

## Eventos en tiempo real (SSE)
- Emisiones existentes aprovechadas:
  - Crear cancha: `turnero-padel/app/api/courts/route.ts:41–52` (emite `courts_updated` con `action: 'created'`).
  - Actualizar cancha: `turnero-padel/app/api/courts/route.ts:69–86`.
  - Infraestructura SSE: `turnero-padel/lib/sse-events.ts:37–61`, endpoint `turnero-padel/app/api/events/route.ts:9–86`.

## Validaciones y estado
- Activación exclusiva durante creación de cancha: los elementos especiales no aparecen antes de tiempo.
- Estado consistente:
  - Antes y después: grilla normal sin separación especial.
  - Durante creación: separación clara entre disponibles y no disponibles, con etiquetas y colores uniformes.
- Números fuera de rango: la paleta aplica de forma cíclica.

## Accesibilidad
- Contraste:
  - Modo claro: texto negro sobre fondos claros.
  - Modo oscuro: texto de alto contraste sobre fondo oscuro.
- Identificadores:
  - Leyenda textual “Cancha N” y swatches de color pequeños para reforzar la identificación visual y textual.

## Notas de uso
- Para asignar correctamente los colores nuevos (4–7), se recomienda nombrar las canchas como “Cancha 4”, “Cancha 5”, etc.
- Si se requiere que la visualización especial dure más o se aplique solo a la cancha recién creada, se puede ajustar la duración y filtrar por `court.id` en el handler SSE.

