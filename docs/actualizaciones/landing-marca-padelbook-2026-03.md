# Landing: unificación de marca PadelBook

**Fecha:** 3 de marzo de 2026

Documentación de los cambios realizados para eliminar referencias al nombre antiguo "Padel Listo" en la landing y unificar la marca como **PadelBook**, evitando confusiones.

---

## Objetivo

- Reemplazar todas las menciones de "Padel Listo" (y variantes) por "PadelBook" en la landing page.
- Actualizar el email de contacto de `contacto@padellisto.com` a `contacto@padelbook.com`.
- Afecta al componente React de la landing y al archivo HTML estático (`index.html`).

---

## Archivos modificados

| Archivo | Descripción |
|---------|-------------|
| **components/LandingPage.tsx** | Componente principal de la landing (Next.js). |
| **index.html** | Versión estática de la landing (título, comentarios y textos alternativos). |

---

## Cambios en `components/LandingPage.tsx`

| Ubicación | Antes | Después |
|-----------|--------|---------|
| Hero (párrafo) | "padelbook es la app definitiva" | "PadelBook es la app definitiva" |
| Hero (alt imagen) | "Vista previa de la app padelbook" | "Vista previa de la app PadelBook" |
| Sección About (etiqueta) | "Sobre Padel Listo" | "Sobre PadelBook" |
| Sección About (párrafo) | "En Padel Listo, combinamos..." | "En PadelBook, combinamos..." |
| Sección Features (etiqueta) | "Por qué Padel Listo" | "Por qué PadelBook" |
| Testimonios (intro) | "confían en Padel Listo para gestionar..." | "confían en PadelBook para gestionar..." |
| Testimonio Carlos Martínez | "Antes de usar Padel Listo, tenía que llamar..." | "Antes de usar PadelBook, tenía que llamar..." |
| Testimonio María González | "Padel Listo ha transformado nuestra operación" | "PadelBook ha transformado nuestra operación" |
| Imagen gestión clubes (alt) | "Panel de gestión para clubes de Padel Listo" | "Panel de gestión para clubes de PadelBook" |
| CTA Descarga | "Descarga Padel Listo hoy mismo..." | "Descarga PadelBook hoy mismo..." |
| Footer (copyright) | "© 2025 Padel Listo. Todos los derechos reservados." | "© 2025 PadelBook. Todos los derechos reservados." |
| Footer (contacto) | contacto@padellisto.com | contacto@padelbook.com |

**Nota:** El logo en el header y footer se mantiene como **padel**<span style="color:#BEF264">**book**</span> (estilo visual de marca).

---

## Cambios en `index.html`

| Ubicación | Antes | Después |
|-----------|--------|---------|
| `<title>` | "Padel Listo - Reserva tu cancha" | "PadelBook - Reserva tu cancha" |
| Hero (alt imagen) | "Vista previa de la app Padel Listo en un teléfono" | "Vista previa de la app PadelBook en un teléfono" |
| Comentario sección About | "About Section: Sobre Padel Listo" | "About Section: Sobre PadelBook" |
| Imagen gestión clubes (alt) | "Panel de gestión para clubes de Padel Listo" | "Panel de gestión para clubes de PadelBook" |

El resto del `index.html` ya utilizaba "PadelBook" en textos y footer.

---

## Verificación

- Búsqueda en el proyecto (archivos `.tsx` y `.html`): no quedan ocurrencias de "Padel Listo", "padel listo" ni "padellisto" en la landing.
- Linter: sin errores en `LandingPage.tsx`.

---

## Documentación no actualizada

Los documentos en `docs/` que aún mencionan "Padel Listo" (por ejemplo `docs/panel-inicio-especificacion.md`) no se modificaron en esta actualización; la tarea se limitó a la landing y al `index.html`. Si se desea unificar la marca en toda la documentación, puede hacerse en un cambio posterior.
