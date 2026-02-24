# Mejoras UX del modal de Crear/Editar Cancha

**Fecha:** 24 de febrero de 2026

Documentación de las mejoras realizadas en el modal de gestión de canchas: scroll interno y selección de horarios cada 30 minutos.

---

## Objetivo

- Permitir scroll dentro del modal cuando el contenido supera la altura de la pantalla.
- Simplificar la selección de horarios operativos (Apertura/Cierre) mostrando únicamente opciones cada 30 minutos, en lugar de cada minuto.

---

## 1. Scroll dentro del modal

### Problema
En pantallas pequeñas o con poco espacio, el formulario del modal (Tenant, Nombre, Precio, Descripción, Horarios operativos, etc.) se desbordaba y no era posible desplazarse para ver o acceder a todos los campos.

### Solución
Se agregaron las clases CSS `max-h-[90vh]` y `overflow-y-auto` al contenedor interno del modal.

### Archivo modificado
- `app/admin-panel/admin/canchas/page.tsx`

### Cambio aplicado

```tsx
// Antes
<div className={`rounded-lg p-6 w-full max-w-md ${...}`}>

// Después
<div className={`rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${...}`}>
```

- **`max-h-[90vh]`**: Limita la altura del modal al 90% de la ventana del navegador.
- **`overflow-y-auto`**: Habilita scroll vertical cuando el contenido supera esa altura.

El usuario puede desplazarse dentro del modal para completar todos los campos sin que el modal quede cortado fuera de la pantalla.

---

## 2. Selección de horarios cada 30 minutos

### Problema
Los campos de Apertura y Cierre usaban `<input type="time">`, cuyo selector nativo mostraba minutos de 1 en 1 (00, 01, 02, …). Esto hacía la selección tediosa y poco útil para franjas horarias típicas de canchas (08:00, 08:30, 09:00, etc.).

### Solución
Se reemplazaron los inputs nativos por componentes `Select` con opciones predefinidas cada 30 minutos, desde 00:00 hasta 23:30.

### Archivo modificado
- `app/admin-panel/admin/canchas/page.tsx`

### Nuevas funciones auxiliares

```tsx
/** Genera opciones de hora cada 30 minutos (00:00 a 23:30) */
function getTimeOptions30Min(): string[] {
  const options: string[] = []
  for (let h = 0; h < 24; h++) {
    options.push(`${h.toString().padStart(2, '0')}:00`)
    options.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return options
}

/** Redondea una hora al intervalo más cercano de 30 minutos */
function roundTimeTo30Min(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const totalMins = h * 60 + m
  const rounded = Math.round(totalMins / 30) * 30
  const nh = Math.floor(rounded / 60) % 24
  const nm = rounded % 60
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`
}
```

### Componentes afectados

| Antes                         | Después                                  |
|------------------------------|------------------------------------------|
| `<Input type="time" step={1800}>` (Apertura) | `<Select>` con opciones cada 30 min       |
| `<Input type="time" step={1800}>` (Cierre)   | `<Select>` con opciones cada 30 min       |

### Normalización al editar

Cuando se edita una cancha existente, si sus horarios guardados están en franjas no múltiplos de 30 minutos (ej. 08:15, 16:45), se redondean al intervalo más cercano al cargar el formulario:

```tsx
operatingHours: {
  ...oh,
  start: roundTimeTo30Min(oh.start),
  end: roundTimeTo30Min(oh.end),
}
```

### Opciones generadas

Las opciones van de `00:00` a `23:30` en pasos de 30 minutos (48 valores en total).

---

## Resumen de archivos modificados

| Archivo                                     | Cambios                                                                 |
|---------------------------------------------|-------------------------------------------------------------------------|
| `app/admin-panel/admin/canchas/page.tsx`    | Modal con scroll; Select para Apertura/Cierre; helpers de tiempo; `handleEdit` normaliza horarios |

---

## Notas técnicas

1. **Scroll**: Solo el contenido del modal hace scroll; el overlay de fondo permanece fijo.
2. **Compatibilidad**: Los `Select` se comportan igual en todos los navegadores, a diferencia del `step` de `<input type="time">`, que varía por navegador.
3. **Datos existentes**: Horarios ya guardados en la base de datos no se modifican; la normalización aplica solo a la vista del formulario al editar.
