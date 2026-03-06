# Pendientes - Pestaña Torneo

**Ruta:** `/admin-panel/admin/torneos`  
**Archivo principal:** `app/admin-panel/admin/torneos/page.tsx`

---

## Cambios realizados (alineados con el proyecto)

- **Backend y persistencia:** APIs reales para torneos, inscripciones, partidos y sorteos; modelo en Prisma. Super Admin puede seleccionar tenant al crear torneo. Ver [admin-torneos-superadmin-inscripciones-2026-02.md](../actualizaciones/admin-torneos-superadmin-inscripciones-2026-02.md).
- **Cuadro visual (bracket):** En la pestaña Fixture, torneos en formato Eliminatoria directa muestran cuadro eliminatorio visual con rondas y conectores. Ver [admin-torneos-bracket-y-vista-previa-premios-2026-03.md](../actualizaciones/admin-torneos-bracket-y-vista-previa-premios-2026-03.md).
- **Vista previa de premios:** En el wizard de creación, el panel derecho muestra premios según formato (Liga de Oro/Plata para fase de grupos + doble eliminatoria, o 1er/2do lugar para eliminatoria directa).
- **Formato del torneo:** Orden visual de botones (Fase de grupos + Doble Eliminatoria a la izquierda, Eliminatoria directa a la derecha); valor por defecto `GROUPS_DOUBLE_ELIMINATION`. Ver [admin-torneos-formato-botones-2026-03.md](../actualizaciones/admin-torneos-formato-botones-2026-03.md).
- **Layout unificado:** Mismo bloque de título que Usuarios, Turnos y Estadísticas (admin-panel-sheet-layout, unificación títulos).

---

## Estado actual

La pestaña Torneo tiene historial de torneos con datos de API, wizard de creación con persistencia, detalle con pestañas (Info, Inscripciones, Fixture/Cuadro), cuadro eliminatorio visual para formato eliminatoria directa, vista previa de premios en el wizard e inscripciones gestionadas por API. Parte del flujo (bloqueo de canchas, publicación, pagos de inscripción) sigue pendiente.

---

## Implementado

- [x] Vista historial de torneos con datos de API
- [x] Wizard de creación en 3 pasos con persistencia
- [x] Paso 1: título, categoría, premios, parejas mínimas y máximas; formato (Fase de grupos + Doble Eliminatoria / Eliminatoria directa) con valor por defecto y orden visual unificado
- [x] Paso 2: selección de días y franjas horarias
- [x] Paso 3: vista previa (cronograma, premios según formato: Liga Oro/Plata o 1er/2do) y publicación
- [x] Categorías (8va, 7ma, 6ta, 5ta, 4ta, 3ra, 2da, 1ra, Mixto, Suma)
- [x] Detalle de torneo con pestañas: Info, Inscripciones, Fixture/Cuadro
- [x] Cuadro eliminatorio visual (bracket) para formato Eliminatoria directa
- [x] Inscripciones: APIs y gestión desde el detalle; Super Admin puede elegir tenant al crear
- [x] UI y header consistentes con el resto del admin
- [x] Paso 2: botón "Confirmar Horarios" habilitado cuando la franja tiene inicio y cierre
- [x] Paso 3: botón "Volver al paso anterior" en esquina inferior izquierda de la tarjeta

**Detalle:** [admin-torneos-formulario-2026-02.md](../actualizaciones/admin-torneos-formulario-2026-02.md), [admin-torneos-bracket-y-vista-previa-premios-2026-03.md](../actualizaciones/admin-torneos-bracket-y-vista-previa-premios-2026-03.md), [admin-torneos-formato-botones-2026-03.md](../actualizaciones/admin-torneos-formato-botones-2026-03.md)

---

## Pendiente para dar por terminada

### 1. Backend completo (parcialmente implementado)

- Modelo y APIs de torneos, inscripciones, partidos y sorteos ya existen.
- Pendiente: completar reglas de negocio que falten (ej. edición/eliminación con restricciones).

### 2. ~~Eliminar datos mock~~ (hecho)

- Historial y wizard usan datos de API.

### 3. Inscripción de jugadores (parcialmente implementado)

- Sistema para que jugadores se inscriban al torneo.
- Gestión de parejas (formar parejas o inscribir parejas).
- Estados: abierto inscripciones, cerrado, en curso, finalizado.

### 4. Bloqueo de canchas

- Al crear torneo, bloquear las canchas en las fechas/horarios definidos.
- Evitar que se reserven para uso normal durante el torneo.

### 5. Gestión de partidos

- Cuadro de partidos o fixtures (opcional según alcance).
- Siguientes rondas, resultados, ganadores.

### 6. Pagos de inscripción

- Si aplica: cobro de inscripción con Mercado Pago u otro medio.
- Registrar pagos asociados al torneo.

### 7. Publicación y difusión

- Publicar torneo para que los usuarios lo vean (ej. en dashboard o sección pública).
- Notificación o aviso de torneos abiertos.

### 8. Editar y eliminar torneos

- Editar torneo existente (antes de abrir inscripciones o según reglas).
- Eliminar o cancelar torneo con confirmación.

---

## Referencias

- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md`
- Schema Prisma: modelo Tournament y relaciones (inscripciones, partidos, etc.)
- Actualizaciones: [admin-torneos-bracket-y-vista-previa-premios-2026-03.md](../actualizaciones/admin-torneos-bracket-y-vista-previa-premios-2026-03.md), [admin-torneos-formato-botones-2026-03.md](../actualizaciones/admin-torneos-formato-botones-2026-03.md), [admin-torneos-superadmin-inscripciones-2026-02.md](../actualizaciones/admin-torneos-superadmin-inscripciones-2026-02.md), [dashboard-torneos-canchas-fechas-2026-03.md](../actualizaciones/dashboard-torneos-canchas-fechas-2026-03.md)
- APIs de bookings para bloqueo de canchas
