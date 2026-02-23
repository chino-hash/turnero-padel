# Pendientes - Pestaña Torneo

**Ruta:** `/admin-panel/admin/torneos`  
**Archivo principal:** `app/admin-panel/admin/torneos/page.tsx`

---

## Estado actual

La pestaña Torneo tiene un historial de torneos con datos mock y un wizard para crear nuevos torneos (datos, días/franjas, vista previa). No hay persistencia ni APIs reales.

---

## Implementado

- [x] Vista historial de torneos (UI)
- [x] Wizard de creación en 3 pasos
- [x] Paso 1: título, categoría, premios, parejas mínimas
- [x] Paso 2: selección de días y franjas horarias
- [x] Paso 3: vista previa y publicación
- [x] Categorías (8va, 7ma, 6ta, 5ta, 4ta, 3ra, 2da, 1ra, Mixto, Suma)
- [x] Vista previa en vivo al crear
- [x] UI consistente con el resto del admin

---

## Pendiente para dar por terminada

### 1. Backend completo

- Modelo de datos para Torneo en Prisma (si no existe).
- APIs: crear, listar, obtener, actualizar torneos.
- Persistir en base de datos en lugar de mock.

### 2. Eliminar datos mock

- Sustituir `TORNEOS_HISTORIAL_MOCK` por datos de la API.
- Conectar el wizard de creación con el endpoint real.

### 3. Inscripción de jugadores

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
- Schema Prisma: verificar si existe modelo Tournament/Torneo
- APIs de bookings para bloqueo de canchas
