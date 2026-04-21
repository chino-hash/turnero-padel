# Estado de identidad de marca: implementado vs. pendiente

Este documento resume **qué está implementado hoy como entregables en Markdown** (estrategia, mensajes, guías y playbooks) y **qué suele faltar** para que eso exista también en producto, canales y medición real.

Fuentes revisadas:

- [identidad-marca-fase-1-y-2.md](./identidad-marca-fase-1-y-2.md)
- [manual-de-marca-turnero.md](./manual-de-marca-turnero.md)
- [aplicacion-marca-punto-9-puntos-de-contacto.md](./aplicacion-marca-punto-9-puntos-de-contacto.md)
- [validacion-marca-punto-10-experimentos.md](./validacion-marca-punto-10-experimentos.md)

---

## Verificación en código (repo) - abril 2026

Esta sección contrasta lo anterior con evidencia en el código actual.

### Nombre de marca en producto vs. documentación de marca

- La documentación de identidad/manual habla de **Turnero de Padel**.
- La UI pública (landing) y metadata del layout hablan de **PadelBook / PADEL BOOK** (no aparece como marca principal "Turnero" en esos puntos).

Evidencia:

```24:31:app/layout.tsx
export const metadata: Metadata = {
  title: "PADEL BOOK",
  description: "Sistema de reservas para canchas de pádel",
  applicationName: "PADEL BOOK",
  openGraph: {
    title: "PADEL BOOK",
    siteName: "PADEL BOOK",
  },
```

```42:49:components/landing-page/Hero.tsx
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Tu Próximo Partido de <span className="gradient-text">Pádel</span>,
                <br />
                a un Solo Tap.
              </h1>
              <p className="text-lg sm:text-xl text-zinc-400 max-w-xl">
                Encuentra canchas disponibles en tu ciudad, reserva en segundos y gestiona todos tus partidos. PadelBook es la app definitiva para jugadores y clubes.
              </p>
```

### Tuteo (manual) vs. voseo en UI (producto)

El manual define **tuteo** al jugador, pero hay strings en UI con **voseo** (Rioplatense).

Evidencia:

```12:15:app/reservas/pendiente/page.tsx
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pago pendiente</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Tu pago está pendiente de acreditación. Cuando se confirme, la reserva quedará activa. Podés revisar el estado en Mis Turnos.
        </p>
```

```941:941:padel-booking.tsx
            <p className="text-sm font-medium">Tenés una reserva con pago pendiente.</p>
```

### Analytics / eventos del Punto 10

- Existe configuración **potencial** para Google Analytics vía `NEXT_PUBLIC_GA_ID` en `lib/config/env.ts`, pero **no encontré uso** de `getAnalyticsConfig()` ni scripts tipo `gtag`/GTM en el código revisado.
- Los nombres de eventos del Punto 10 (`reserva_flow_start`, etc.) están como **especificación en Markdown**, no como instrumentación verificada en el repo en esta revisión.

Evidencia (config existe, pero no hay referencias de uso):

```339:346:lib/config/env.ts
export const getAnalyticsConfig = () => ({
  googleAnalytics: {
    enabled: Boolean(env.NEXT_PUBLIC_GA_ID),
    id: env.NEXT_PUBLIC_GA_ID,
  }
})
```

### Identidad visual (manual) vs. landing actual

El manual propone una dirección/paleta (azul/violeta/cyan), pero la landing usa un sistema visual distinto (negro + acento lima en el hero). Esto no es “incorrecto” por sí solo, pero **no está alineado** con el manual si la intención es coherencia estricta.

Evidencia (extracto del hero):

```35:38:components/landing-page/Hero.tsx
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full">
              <span className="w-2 h-2 bg-[#BEF264] rounded-full animate-pulse" />
              <span className="text-sm text-zinc-300">Reserva en segundos tu cancha</span>
            </div>
```

---

## Qué significa "implementado" acá

- **Implementado (documentación):** existe guía accionable en repo, lista para usar por marketing/producto/diseño.
- **Implementado (producto):** el copy/UI/flujos del software reflejan la guía (esto **no se validó** en esta tarea: este archivo marca la brecha típica).
- **Implementado (medición):** existen eventos/dashboards y ritual semanal con datos reales.

---

## Por archivo: qué ya tenemos

### [identidad-marca-fase-1-y-2.md](./identidad-marca-fase-1-y-2.md)

**Cubierto (contenido completo en un solo documento de trabajo):**

- Base estratégica (propósito, misión, visión, valores, principios y checklist).
- Tagline (3 opciones + recomendación).
- Competencia regional (matriz + patrones + oportunidades + fuentes).
- Buyer personas (3) + mapeo de mensajes + activación vía clubes (60 días) + priorización.
- Posicionamiento (statement + variantes + mensajes por canal + guardrails).
- Voz y tono (voz madre, atributos con ejemplos, matriz por contexto, reglas editoriales, microcopys, checklist).
- Identidad visual (principios, paleta, tipografía, reglas de logo, recursos gráficos, aplicaciones rápidas, checklist).
- Mensajes clave (framework, embudo, bibliotecas web y WhatsApp/Email, objeciones, checklist).

**Brecha típica (no es "falta de doc", falta de aplicación):**

- Coherencia lingüística: el detalle en `identidad-marca-fase-1-y-2.md` está mayormente en **tuteo**, pero hay **inconsistencias reales entre documentos** (ej. el playbook del Punto 9 mezcla formas) y, sobre todo, **el producto hoy no sigue el tuteo del manual** (ver sección de verificación en código arriba).

### [manual-de-marca-turnero.md](./manual-de-marca-turnero.md)

**Cubierto:**

- Versión "manual" corta para **equipo interno + clubes** (resumen ejecutivo B2B, estrategia sintetizada, audiencia/mensajes, voz/tono, visual, gobernanza, glosario).
- Enlace explícito al documento de detalle.

**Brecha típica:**

- El manual referencia paleta/tipografía/logo, pero **no adjunta assets** (SVG/PNG, exportaciones, plantillas Figma). Si el repo no guarda diseño, eso vive fuera y falta enlazarlo o versionarlo.

### [aplicacion-marca-punto-9-puntos-de-contacto.md](./aplicacion-marca-punto-9-puntos-de-contacto.md)

**Cubierto:**

- Mapa priorizado de puntos de contacto (objetivo, mensaje, CTA, owner).
- Guía de copy + principios UI para pantallas críticas.
- Kit mínimo de activación en club (cartel, QR, script, WhatsApp, email) + plan de 7 días.
- KPIs + tabla semanal vacía (plantilla).

**Brecha típica:**

- Ejecución operativa en clubes: QR físico, permisos de comunicación, base de datos de jugadores, responsables reales, y contenido final aprobado por el club.
- Producto: que las pantallas reales usen esos copies (y que existan features mencionados: share, recordatorios, etc., si aún no están).

### [validacion-marca-punto-10-experimentos.md](./validacion-marca-punto-10-experimentos.md)

**Cubierto:**

- Marco de validación (qué medir + guardrails).
- Lista de eventos sugeridos + propiedades mínimas.
- Plantilla de experimento + backlog inicial de 10 pruebas.
- Ritual semanal + reglas anti-sesgo + política ship/revert/iterar.

**Brecha típica:**

- Instrumentación real en analytics (los eventos existen como **especificación**, no como implementación garantizada).
- Tráfico suficiente y disciplina experimental (sin datos, el playbook no "corre solo").

---

## Global: qué falta para cerrar el ciclo completo (marca + conversión)

### 1) Aplicación en producto (alto impacto)

- Copys reales en UI alineados al manual (hero, errores, confirmación, recordatorios).
- Coherencia de tratamiento (**tuteo** al jugador) en todo el funnel.
- Flujos que respalden la promesa (confirmación clara, estados, recuperación de errores).

### 2) Aplicación en canales (club + marketing)

- Producción de piezas físicas/digitales (QR, cartel, plantillas WhatsApp/email) y calendario editorial.
- Guía de co-branding con club (cuándo va marca club vs Turnero) si aplica.

### 3) Medición (para que Punto 10 sea real)

- Implementación de eventos (`reserva_flow_start`, `reserva_completed`, etc.) y propiedades (`fuente`, `club_id`).
- Dashboard mínimo semanal (aunque sea una hoja con exportación).

### 4) Evidencia cualitativa (opcional pero recomendable)

- 5-10 entrevistas cortas a jugadores frecuentes y 3 entrevistas a administradores de club.
- Encuesta post-reserva (1 pregunta) sobre claridad/confianza.

### 5) Consistencia editorial (deuda detectada)

- Unificar voseo/tuteo en documentación y luego en producto.
- Revisar claims: evitar promesas no verificables (ya está como guardrail en manual).

---

## Próximos pasos sugeridos (orden práctico)

1. **Editorial pass** en docs para unificar tuteo y términos clave (1 PR de docs).
2. **Instrumentar analytics mínimo** del Punto 10 (1 PR de producto).
3. **Aplicar copies del Punto 9** en las pantallas reales del flujo de reserva (1 PR de producto).
4. **Pilot en 1 club**: kit QR + WhatsApp + tabla semanal (operación, no código).
