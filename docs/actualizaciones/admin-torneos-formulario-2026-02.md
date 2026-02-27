# Admin Torneos: mejoras en el formulario de creación

**Fecha:** 25 de febrero de 2026

Documentación de los cambios realizados en el wizard de creación de torneos (`/admin-panel/admin/torneos`): campo de parejas máximas, lógica del botón "Confirmar Horarios", cronograma en la vista previa y posición del botón "Volver al paso anterior".

---

## Objetivo

1. **Paso 1 – Reglas:** Mostrar parejas mínimas y parejas máximas; validar que mínimas ≤ máximas.
2. **Paso 2 – Franjas horarias:** Habilitar el botón "Confirmar Horarios" cuando la franja tenga hora de inicio y de cierre completas.
3. **Vista previa:** Mostrar en el cronograma el rango horario completo (inicio - fin) por franja.
4. **Paso 3 – Publicar:** Botón "Volver al paso anterior" más pequeño y fijo en la esquina inferior izquierda de la tarjeta del formulario.

---

## Resumen de cambios por archivo

| Archivo | Cambios |
|---------|--------|
| **app/admin-panel/admin/torneos/page.tsx** | Estado `maxPairs`; campo "Parejas máximas" en REGLAS; validación `minP <= maxP` para continuar; `hasRangeToConfirm` para habilitar "Confirmar Horarios"; cronograma en preview con `r.start - r.end`; tarjeta del paso 3 con `relative`, botón "Volver" con `absolute bottom-8 left-8`. |

---

## 1. Paso 1 – Datos del torneo (Reglas)

### Parejas máximas

- **Antes:** Solo existía el campo "Parejas mínimas"; al publicar se enviaba el mismo valor como `minPairs` y `maxPairs`.
- **Después:**
  - Nuevo estado `maxPairs` (número o `""`).
  - En la sección **REGLAS**, debajo de "Parejas mínimas", se añadió el campo **"Parejas máximas"** con el mismo estilo (icono, placeholder "Ej. 32").
  - Al publicar: `minPairs` y `maxPairs` se envían por separado; si "Parejas máximas" está vacío se usa `128` por defecto.

### Validación

- `canContinueStep1` ahora exige además que `minP <= maxP` (parejas mínimas ≤ parejas máximas). Si no se cumple, no se puede pasar al paso 2.

### Vista previa (panel derecho)

- La insignia de parejas muestra:
  - `"X-Y parejas"` si min y max son distintos.
  - `"Min X"` o `"Max Y"` si solo uno está definido.

---

## 2. Paso 2 – Días y franjas horarias

### Botón "Confirmar Horarios"

- **Antes:** El botón decía "Confirmar Horarios" solo cuando había alguna franja incompleta (`!r.start || !r.end`). Al completar inicio y fin, pasaba a "Agregar Franja" y no se veía "Confirmar Horarios" habilitado.
- **Después:**
  - Nueva función `hasRangeToConfirm(date)`: devuelve `true` si existe al menos una franja con **inicio y cierre** completos.
  - Se muestra **"Confirmar Horarios"** (verde, habilitado) cuando `hasRangeToConfirm(d.date)` es verdadero.
  - Se muestra **"Agregar Franja"** cuando no hay ninguna franja completa.
  - Al hacer clic en "Confirmar Horarios" se sigue llamando a `acceptPendingRange` (limpia franjas vacías y aplica hora de cierre por defecto).

---

## 3. Vista previa – Cronograma

- **Antes:** En la sección "Cronograma" de la vista previa solo se mostraba la hora de inicio (ej. "08:00").
- **Después:** Cada franja muestra el rango completo, p. ej. **"08:00 - 23:59"**. Si solo hay hora de inicio se muestra únicamente esa.

```tsx
// Antes
{r.start}

// Después
{r.start}{r.end ? ` - ${r.end}` : ""}
```

---

## 4. Paso 3 – Vista previa y publicar

### Botón "Volver al paso anterior"

- **Tamaño:** Se mantiene el botón pequeño: `size="sm"`, `h-8`, `px-3`, `text-xs`, icono `w-3.5 h-3.5`.
- **Posición:**
  - La **tarjeta del formulario** (el `div` con `bg-card border border-border/50 shadow-sm rounded-xl p-8`) tiene `relative` para ser el contexto de posicionamiento.
  - El botón "Volver al paso anterior" tiene `absolute bottom-8 left-8`, quedando fijo en la **esquina inferior izquierda** de esa tarjeta (con margen 2rem, coherente con el `p-8`).
- Se eliminó el contenedor `relative` del bloque interno del paso 3 para que el `absolute` del botón se resuelva respecto a la tarjeta y no al contenedor centrado.

### Estructura relevante (paso 3)

```tsx
<div className="relative bg-card border border-border/50 shadow-sm rounded-xl p-8 ...">
  {/* contenido paso 1, 2 o 3 */}
  {step === 3 && (
    <>
      <div className="... max-w-2xl mx-auto">
        {/* ícono, título, descripción */}
        <div className="flex flex-col gap-3 pt-4">
          <div>... botón "Publicar Torneo Ahora" ...</div>
          <Button
            className="absolute bottom-8 left-8 h-8 px-3 text-xs font-medium gap-1.5"
            ...
          >
            Volver al paso anterior
          </Button>
          ...
        </div>
      </div>
    </>
  )}
</div>
```

---

## Notas técnicas

- El modelo y la API de torneos ya soportaban `maxPairs`; solo faltaba el campo en el formulario y la validación en el paso 1.
- `hasPendingRange` fue reemplazada por `hasRangeToConfirm` para la lógica del botón de franjas; el resto del flujo (payload, `acceptPendingRange`) se mantiene.
