# Fix: horarios que desaparecen al cargar (render inicial)

**Fecha:** 28 de abril de 2026

---

## Problema reportado

En la pantalla de reservas, algunos horarios no se mostraban en el primer render de la grilla.  
Después de unos instantes (o tras actualizar datos), esos horarios volvían a aparecer.

## Diagnóstico

Se detectó un estado intermedio en la carga de slots donde algunos registros podían llegar con datos de hora incompletos o en formato alternativo (`time` / `timeRange`), y el frontend intentaba renderizarlos como si tuvieran `startTime` y `endTime` completos.

Ese desfasaje provocaba tarjetas de turno vacías o con contenido inconsistente durante el arranque.

## Solución aplicada

Se reforzó la normalización de slots en el proveedor global de estado para que el render use un formato de tiempo estable desde el primer momento.

### Cambios de implementación

1. Se agregó una función de normalización de horarios:
   - Prioriza `startTime` / `endTime`.
   - Usa fallback en `time`.
   - Usa fallback en `timeRange` cuando falta alguno de los anteriores.
2. Se aplicó esta normalización en:
   - La vista por cancha (`timeSlots`).
   - La vista unificada (`unifiedTimeSlots`).
3. Se filtraron slots inválidos antes de renderizar:
   - Si un slot no tiene hora de inicio válida, no se muestra en la grilla.

## Archivo modificado

- `components/providers/AppStateProvider.tsx`

## Resultado esperado

- La grilla deja de mostrar “huecos” o desapariciones temporales de horarios al cargar.
- Los turnos visibles desde el primer paint se mantienen consistentes con el estado final.

## Validación sugerida

1. Abrir el dashboard en móvil y desktop.
2. Refrescar la página varias veces.
3. Verificar que no aparezcan tarjetas sin hora ni parpadeos de slots.
4. Probar tanto en “Vista unificada” como “Por cancha”.

## Riesgo e impacto

- **Impacto funcional:** bajo (normalización de datos de presentación).
- **Riesgo:** bajo, porque no altera reglas de negocio ni disponibilidad en backend; solo robustecer el mapeo previo al render.

