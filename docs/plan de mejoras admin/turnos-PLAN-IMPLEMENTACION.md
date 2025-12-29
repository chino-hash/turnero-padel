# Plan de implementación gradual para mejoras de `turnos.md`

## Objetivo
Asegurar la continuidad del servicio y la preservación de información crítica mientras se mejora el documento `turnos.md` mediante un proceso controlado, versionado y validado en fases.

## Principios
- Respaldo previo a cualquier modificación.
- Cambios pequeños, atómicos y reversibles.
- Versionado explícito del documento y changelog separado.
- Verificación de integridad tras cada cambio.
- Validación en entorno controlado antes de desplegar.

## Flujo operativo
1) Backup: copiar el archivo original a `turnos.backup.md` (con fecha si se desea).
2) Branch de trabajo: realizar cambios en una rama dedicada (p. ej. `docs/turnos-improvements`).
3) Fases de mejora (ver más abajo) con validaciones tras cada fase.
4) Changelog: anotar cada modificación en `turnos-CHANGELOG.md`.
5) Revisión: verificación interna (linting, enlaces, coherencia) y aprobación.
6) Despliegue: merge a main y actualización de índices/documentación relacionada.
7) Monitoreo: revisar que no haya roturas de referencias internas.

## Versionado del documento
- Esquema SemVer para el documento: `Doc-Version: vMAJOR.MINOR.PATCH`.
- MAJOR: reestructuración sustancial o cambios de contratos.
- MINOR: nuevas secciones/capítulos sin romper compatibilidad.
- PATCH: correcciones de errores, ortografía, formato.
- Registrar versión y fecha al inicio de `turnos.md`.
 - Sugerencia de encabezado: `<!-- Doc-Version: v1.0.0 | Fecha: AAAA-MM-DD -->`.

## Changelog
- Archivo: `docs/plan de mejoras admin/turnos-CHANGELOG.md`.
- Entradas por versión:
  - `## vX.Y.Z - AAAA-MM-DD`
  - Cambios: lista de modificaciones y motivación.
  - Impacto: si afecta a frontend/backend/contratos.
  - Verificación: cómo se validó.
  - Rollback: cómo revertir si fuese necesario.

## Verificación de integridad
- Estructura Markdown: títulos coherentes (H1–H3), listas consistentes.
- Enlaces internos: rutas y anchors correctos.
- Bloques de código: JSON válido cuando corresponda.
- Estilo: terminología consistente (UTC, pricing, estados).
- Opcional: `markdownlint`/`remark` para linting.
 - Comprobación local: previsualizar el Markdown en el IDE y revisar difs.

## Validación en entorno controlado
- Render local del Markdown (visor o preview del IDE).
- Revisar enlaces hacia otros docs del repo.
- Validar ejemplos JSON con un validador.
- Chequeo por un segundo revisor (si aplica).

## Fases de implementación

### Fase 0 — Backup y versionado inicial
- Crear `turnos.backup.md`.
- Añadir `Doc-Version: v1.0.0` en `turnos.md`.
- Entrega: versión inicial registrada.
- Verificación: diff con backup, consistencia de encabezado.

### Fase 1 — Corrección de errores evidentes
- Ortografía, gramática, acentos, comillas y consistencia de términos.
- Corrección de ejemplos JSON (comas, claves, números).
- Alineación de listas y numeraciones.
- Entrega: `v1.0.1`.
- Verificación: linting y lectura cruzada.

### Fase 2 — Formato y legibilidad
- Encabezados claros, índice si procede.
- Estilo consistente en bullets y bloques.
- Mejorar claridad de estados/transiciones y permisos.
- Entrega: `v1.1.0`.
- Verificación: revisión de estructura y enlaces internos.

### Fase 3 — Actualización de información obsoleta
- Ajustar secciones para reflejar la última arquitectura (servicio de pricing en backend, SWR/React Query, `setInterval` visual).
- Confirmar contratos de API y nombres de rutas reales.
- Entrega: `v1.2.0`.
- Verificación: coherencia con el código y endpoints existentes.

### Fase 4 — Detalles operativos y pruebas
- Añadir criterios de aceptación por fase.
- Agregar checklists operativas.
- Documentar procedimiento de cierre con auditoría.
- Entrega: `v1.3.0`.
- Verificación: revisión funcional por el equipo.

### Fase 5 — Mantenimiento continuo
- PATCHes programados para correcciones menores.
- MINOR para nuevas aclaraciones sin romper compatibilidad.
- MAJOR sólo con cambios fuertes de arquitectura/contratos.

## Control de versiones por modificación
- Commit por cambio atómico (ej.: “docs: corrige ejemplos JSON en contratos de API”).
- Referencia a issue/ticket cuando aplique.
- Pull Request con descripción, evidencias de verificación y checklist.

## Checklist tras cada cambio
- Backup actualizado o confirmación de reversibilidad.
- Versión del documento incrementada correctamente.
- Changelog con fecha, cambios, impacto, verificación y rollback.
- Integridad: títulos, enlaces, bloques de código válidos.
- Validación local y revisión.

## Continuidad del servicio y preservación de información
- Los cambios son sobre documentación; no deben afectar el servicio.
- Mantener copia de seguridad (`turnos.backup.md`) y posibilidad de revertir vía VCS.
- Evitar cambios masivos simultáneos; usar fases pequeñas y PRs.

## Plan de rollback
- Restaurar `turnos.md` desde `turnos.backup.md` o revert del commit.
- Registrar en changelog la reversión y su motivo.

## Entregables
- `turnos.backup.md` (respaldo).
- `turnos-CHANGELOG.md` (registro de cambios).
- `turnos.md` con `Doc-Version` y mejoras aplicadas por fases.