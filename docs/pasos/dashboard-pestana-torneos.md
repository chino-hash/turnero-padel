# Pestaña "Torneos" en el Dashboard

**Objetivo:** Añadir al dashboard una pestaña nueva llamada **Torneos**, donde se publique el torneo creado en la sección de torneos del admin, con fecha del torneo y dos estados: torneos que vienen y torneos terminados (registro limitado a 1 mes).

---

## Resumen

- **Dónde:** Dashboard del usuario (pestaña nueva junto a las existentes).
- **Origen de datos:** Torneos creados y publicados en la sección Admin → Torneos.
- **Contenido:** Fecha del torneo y dos secciones según estado: "Torneo que viene" y "Torneos terminados".

---

## 1. Pestaña "Torneos" en el Dashboard

- Añadir una **pestaña nueva** en el dashboard con el nombre **Torneos**.
- La pestaña muestra únicamente torneos **publicados** (los creados en Admin → Torneos que estén en estado publicable/visible para el usuario).
- Cada torneo mostrado debe incluir al menos la **fecha del torneo** (y, si aplica, el rango de fechas o los días concretos).

---

## 2. Dos secciones según estado

### 2.1 "Torneo que viene" (próximos / en curso)

- **Qué se muestra:** Torneos cuya fecha (o última fecha) sea **hoy o en el futuro**.
- **Contenido por torneo:**
  - Datos básicos del torneo (título, categoría, etc.).
  - **Fecha del torneo** (o rango de fechas).
  - **Días en que se realiza:** los días que se configuraron al crear el torneo (ej. "Sábado 15 y Domingo 16 de marzo" o listado de fechas/días).
- Objetivo: que el usuario vea claramente **qué torneo viene** y **qué días** se juega.

### 2.2 "Torneos terminados"

- **Qué se muestra:** Torneos ya finalizados (fecha o última fecha **anterior a hoy**).
- **Límite de tiempo:** Mostrar solo torneos terminados en un **registro de 1 mes atrás** (p. ej. desde hace 30 días hasta hoy).
- **Objetivo:** Evitar que la sección se llene con historial antiguo; mantener solo el registro reciente (1 mes) para no sobrecargar la vista ni las consultas.

---

## 3. Criterios sugeridos

| Aspecto | Detalle |
|--------|---------|
| **Pestaña** | Nombre: "Torneos". Misma zona de pestañas del dashboard (ej. junto a Turnos / Reservas / etc.). |
| **Origen** | Torneos creados en Admin → Torneos que estén publicados/visibles para el club. |
| **Fecha del torneo** | Mostrar siempre (fecha única o rango/días según lo definido en el torneo). |
| **"Torneo que viene"** | Fecha ≥ hoy; mostrar días en que se realiza el torneo. |
| **"Torneos terminados"** | Fecha &lt; hoy; solo últimos 30 días (1 mes atrás). |

---

## 4. Consideraciones técnicas (para implementación)

- **API / filtros:** Endpoint o filtros que devuelvan torneos publicados con:
  - `fechaInicio` / `fechaFin` (o equivalente) para clasificar "que viene" vs "terminado".
  - Para "Torneos terminados", filtrar por fecha de fin ≥ (hoy − 30 días).
- **Multitenant:** Solo torneos del tenant del usuario (club) al que pertenece la sesión.
- **Días del torneo:** Usar los días/franjas guardados al crear el torneo para mostrar "qué días va a ser" en la sección "Torneo que viene".

---

## 5. Referencias

- Sección Admin Torneos: [6-parte-de-seccion-de-torneos.md](./6-parte-de-seccion-de-torneos.md)
- Pendientes torneos: [admin-torneos-pendientes.md](./admin-torneos-pendientes.md)
- Dashboard actual (torneos/canchas/fechas): [actualizaciones/dashboard-torneos-canchas-fechas-2026-03.md](../actualizaciones/dashboard-torneos-canchas-fechas-2026-03.md)
