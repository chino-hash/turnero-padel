# Punto 10 - Validación y ajuste (marca + conversión)

Playbook para validar hipótesis de mensaje, claridad de propuesta y conversión a reserva usando **analytics básico**, con un ritmo semanal simple y decisiones explícitas.

**Referencias**

- Aplicación en puntos de contacto: [aplicacion-marca-punto-9-puntos-de-contacto.md](./aplicacion-marca-punto-9-puntos-de-contacto.md)
- Manual de marca: [manual-de-marca-turnero.md](./manual-de-marca-turnero.md)
- Detalle de identidad (trabajo continuo): [identidad-marca-fase-1-y-2.md](./identidad-marca-fase-1-y-2.md)

---

## Indice

1. [Marco de validación](#1-marco-de-validación)
2. [Instrumentación mínima (eventos y segmentos)](#2-instrumentación-mínima-eventos-y-segmentos)
3. [Plantilla de experimento](#3-plantilla-de-experimento)
4. [Backlog inicial (10 experimentos)](#4-backlog-inicial-10-experimentos)
5. [Ritmo semanal y reglas de decisión](#5-ritmo-semanal-y-reglas-de-decisión)

---

## 1) Marco de validación

### Qué validamos (4 dimensiones)

1. **Claridad de propuesta (marca):** un usuario nuevo entiende en menos de 10 segundos qué resuelve Turnero.
2. **Conversión a reserva (producto):** más inicios de reserva y más confirmaciones completadas.
3. **Confianza operativa (producto):** menos abandono en pasos críticos y menos errores percibidos.
4. **Recurrencia (negocio):** más usuarios con 2+ reservas en 14 días (o la ventana que definas).

### Métricas recomendadas (mínimo viable)

**Métrica primaria (por experimento, elegir una):**

- `reserva_completada` (conversion end-to-end)
- `inicio_reserva` (si el cuello de botella está arriba del funnel)
- `confirmacion_vista` (si el problema es confianza post-acción)

**Guardrails (no empeorar mientras optimizás):**

- tasa de error visible (pagos / confirmación / disponibilidad)
- tiempo medio hasta completar reserva (si lo medís)
- soporte: tickets por reserva (si lo medís)

### Regla práctica de “tamaño mínimo” (analytics básico)

Si no tenés motor estadístico avanzado, usá reglas simples:

- Corré el experimento **7 días completos** (o 2 fines de semana si el producto es muy weekend-heavy).
- Pedí al menos **200 inicios de reserva** en el periodo (si no llegás, extendé a 14 días o bajá la ambición del cambio).
- Si la diferencia es chica, **repetí** el experimento con copy más contrastante (no micro-ajustes).

---

## 2) Instrumentación mínima (eventos y segmentos)

### Propiedades comunes (adjuntar a todos los eventos)

- `club_id` (o slug)
- `fuente` (`qr_club`, `whatsapp_club`, `organico`, `email_club`, `otro`)
- `dispositivo` (`mobile`, `desktop`)
- `experimento_id` (string)
- `variante` (`A`, `B`)

### Eventos sugeridos (nombres)

> Ajustá nombres a tu stack (GA4, PostHog, Mixpanel, etc.), pero mantené el significado.

1. `page_view_landing` (o page_view con `page_type=landing`)
2. `cta_reserva_click`
3. `reserva_flow_start`
4. `horario_selected`
5. `reserva_submit`
6. `reserva_completed`
7. `reserva_error` (con `error_code`)
8. `confirmacion_view`
9. `share_invite_click` (si existe compartir)
10. `recordatorio_open` (push/email/whatsapp tracked)

### Segmentación mínima (para lectura semanal)

- por `fuente` (QR vs WhatsApp vs orgánico)
- por `club_id` (top 5 clubes por volumen)
- por `dispositivo` (mobile suele ser el 80%)

---

## 3) Plantilla de experimento

Copiá esta tabla por cada experimento:

| Campo | Contenido |
|---|---|
| ID | EXP-### |
| Hipótesis | Si cambiamos X, entonces sube Y porque Z |
| Cambio | (copy/UI/flujo) |
| Alcance | (landing / paso del funnel / recordatorio) |
| Métrica primaria | (una sola) |
| Guardrails | (lista corta) |
| Variantes | A vs B |
| Duración | 7 o 14 días |
| Criterio de éxito | p.ej. +10% relativo en métrica primaria sin romper guardrails |
| Decisión | Ship / Revert / Iterar |

---

## 4) Backlog inicial (10 experimentos)

> Todos están alineados a activación de reservas y claridad de marca. Priorizá los que tocan el paso con mayor abandono.

| ID | Hipótesis (resumida) | Cambio | Métrica primaria | Notas |
|---|---|---|---|---|
| EXP-001 | Un hero más “acción inmediata” sube inicio de reserva | Hero: "Reservá tu cancha en segundos" + CTA "Reservar ahora" | `reserva_flow_start` | medir por `fuente=qr_club` |
| EXP-002 | Beneficios en orden “confirmación primero” reduce abandono | Reordenar bullets (confirmación, recordatorio, rapidez) | `reserva_completed` | comparar vs baseline |
| EXP-003 | CTA secundario “Ver horarios” roba foco | Quitar CTA secundario o degradarlo a link texto | `reserva_completed` | guardrail: no bajar starts |
| EXP-004 | Microcopy de selección de horario reduce dudas | Texto ayuda: "Gris = no disponible" más visible | `horario_selected` | si sube selección, mirar completed |
| EXP-005 | Confirmación más explícita aumenta share/recurrencia | Titular confirmación + CTA "Creá tu próximo partido" | `share_invite_click` o `reserva_completed` (14d) | elegí una métrica primaria |
| EXP-006 | Errores con acción clara reducen abandono post-error | CTA doble: "Elegir otro horario" / "Reintentar pago" | `reserva_completed` después de `reserva_error` | segmentá por `error_code` |
| EXP-007 | Recordatorio más corto aumenta aperturas | 1 línea + CTA único | `recordatorio_open` | si no medís opens, usá asistencia/no-show |
| EXP-008 | Mensaje WhatsApp con urgencia suave sube clicks | Variante B con horario punta + CTA único | `cta_reserva_click` | medir por club |
| EXP-009 | Social proof del club aumenta confianza | Bloque "Club aliado" con nombre + logo | `reserva_completed` | cuidado con clutter |
| EXP-010 | “Sin WhatsApp” como ancla reduce fricción percibida | Subtítulo con ancla anti-chat | `reserva_flow_start` | medir también tiempo a start |

---

## 5) Ritmo semanal y reglas de decisión

### Reunión semanal (30-45 minutos)

**Agenda fija**

1. Resultados de experimentos activos (ship/revert/iterar).
2. Top 3 cuellos de botella del funnel (por paso y por club).
3. Decisión de próximos 1-2 experimentos (máximo).

### Qué mirar en analytics básico (orden)

1. `reserva_completed` total y por `fuente` y `club_id`
2. Conversión por etapa:
   - landing -> `cta_reserva_click`
   - click -> `reserva_flow_start`
   - start -> `reserva_completed`
3. Errores: conteo de `reserva_error` por `error_code`
4. Recurrencia: % usuarios con 2+ reservas en 14 días (definición simple)

### Reglas anti-sesgo

- No lances 2 experimentos que toquen el mismo flujo simultáneamente.
- No cambies hero + CTA + paso interno en la misma semana sin poder atribuir.
- Si el tráfico es bajo, **aumentá contraste del copy** o **extendé duración**, no fragmentes en micro-tests.

### Política de decisión (simple)

- Si cumple criterio de éxito y guardrails ok: **Ship**
- Si empeora guardrails: **Revert** inmediato
- Si mejora starts pero baja completed: **Iterar** (hipótesis nueva: “atrae pero no convence”)
