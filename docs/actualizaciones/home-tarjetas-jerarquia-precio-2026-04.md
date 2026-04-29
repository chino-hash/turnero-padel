# Documentación: jerarquía visual en tarjetas de cancha y horarios (Home)

**Fecha de referencia:** abril de 2026.  
**Ámbito:** vista pública de reserva — componente `components/HomeSection.tsx`.

## Resumen

Se mejoró la **escaneabilidad** del selector de canchas y de la grilla de turnos: orden visual explícito (disponibilidad → ilustración → nombre en canchas; hora → estado → cancha en slots). El **precio por persona no se muestra** ni en tarjetas de cancha ni en celdas de horario (se detalla al elegir turno y en el flujo de reserva / modal).

## Objetivos de diseño

1. **Turnos (celdas):** hora primero, luego estado, luego cancha; sin precio en la celda.
2. **Canchas (selector):** disponibilidad destacada, ilustración, nombre; sin precio en la tarjeta.

## Comportamiento actual

### Tarjetas de cancha

- **Disponibilidad:** badge arriba a la izquierda (porcentaje en negrita + “Disponible”).
- **Ilustración** de cancha con color por número de cancha.
- **Nombre** centrado debajo; padding algo más compacto (`p-2 sm:p-2.5 lg:p-3`).

### Celdas de horario (slots)

- Hora → badge → nombre de cancha; tarjetas compactas (`min-h` ~76–80px).

## `data-testid` relevantes

| Test ID | Uso |
|--------|-----|
| `court-name` | Nombre en tarjeta de cancha |
| `slot-time-range` | Franja horaria en la celda |

## Verificación manual sugerida

- Selector de canchas: sin texto de precio; layout más denso.
- Grilla de horarios: sin precio en celda; modal con detalle al reservar.

## Archivos tocados

- `components/HomeSection.tsx`
