# Migración de datos hardcodeados a Base de Datos + Seeds de prueba

Este documento guía la transición de valores fijos en el frontend (duración de turnos, horarios, colores, precios, estados, etc.) a registros en la base de datos, y cómo poblarla con datos de prueba que replican casi exactamente el comportamiento actual.

## Objetivos

- Centralizar configuración en la BD: horarios de operación, duración de slots, precios base, colores por cancha, mapeos de etiquetas/estilos.
- Eliminar arrays estáticos y heurísticas en componentes y utils del frontend.
- Poblar la BD con datos de prueba equivalentes a la UI actual (duración 90', horarios 08:00–22:30, base price, estados y disponibilidad).
- Mantener compatibilidad con el esquema Prisma existente.

---

## Inventario y Mapeo de Datos

Los siguientes valores actualmente están hardcodeados y deben venir de la BD:

- Horarios y duración
  - En `lib/utils/booking-utils.ts`, `app/api/slots/route.ts`, `components/providers/AppStateProvider.tsx`.
  - Migrar a `Court.operatingHours` (JSON string) y/o `SystemSetting`.
- Precios base
  - En `components/HomeSection.tsx`, `components/providers/AppStateProvider.tsx`.
  - Migrar a `Court.basePrice` y opcionalmente `Court.priceMultiplier`. Definir `DEFAULT_BASE_PRICE` en `SystemSetting`.
- Colores de canchas
  - En `HomeSection.tsx` y `TurneroApp.tsx` (paletas según nombre/id).
  - Persistir dentro de `Court.features` como JSON string (e.g. color/bgColor/textColor) y/o tabla `SystemSetting` si hay reglas globales.
- Slots de tiempo
  - Arrays fijos de `'08:00'` a `'22:30'` cada 30 minutos en `BookingForm.tsx`, `BookingFilters.tsx`, `admin/turnos/page.tsx`.
  - Generarlos desde `Court.operatingHours` (start/end/slot_duration).
- Estados y etiquetas
  - StatusOptions y badges (textos/estilos) en `BookingFilters.tsx`, `HomeSection.tsx`, `TurneroApp.tsx`.
  - Usar `Booking.status` y `PaymentStatus` (enums en Prisma). Los labels/estilos pueden centralizarse en `SystemSetting`.

---

## Esquema en Prisma (resumen relevante)

- `Court.operatingHours: String` contiene JSON con `start`, `end`, `slot_duration` (minutos).
- `Court.features: String` puede contener JSON libre (e.g. colores, capacidades).
- `Court.basePrice: Int`, `Court.priceMultiplier: Float`.
- `Booking.status: BookingStatus`, `Booking.paymentStatus: PaymentStatus`.
- `SystemSetting.key/value`: pares llave/valor para configuración global.
- `AdminWhitelist.email`: para admins permitidos; también se apoya en `ADMIN_EMAILS`.

---

## Formatos de Configuración (JSON)

### Court.operatingHours
```json
{
  "start": "08:00",
  "end": "22:30",
  "slot_duration": 90
}
```

### Court.features (colores por cancha)
```json
{
  "color": "#8b5cf6",
  "bgColor": "#a78bfa",
  "textColor": "#ffffff"
}
```

### SystemSetting recomendados
- `DEFAULT_OPERATING_HOURS`: `{"start": "08:00", "end": "22:30"}`
- `DEFAULT_SLOT_DURATION_MINUTES`: `"90"`
- `DEFAULT_BASE_PRICE`: `"6000"`
- `COURT_COLOR_MAP`: JSON con mapeo por nombre/id de cancha
- `STATUS_BADGES`: mapeo de enum → `{label, class}` (para UI)
- `AVAILABILITY_BADGES`: `{"AVAILABLE": {"label": "Disponible", "class": "..."}, "RESERVED": {...}}`

---

## Plan de Migración

1) Preparación
- Verifica `.env` y que `DATABASE_URL` apunte a tu PostgreSQL.
- Asegúrate de tener Prisma configurado y generado.

```bash
npx prisma generate
```

2) Confirmar que el esquema ya soporta lo necesario
- No es necesario cambiar el esquema para esta migración: `Court.operatingHours` y `Court.features` sirven para JSON de configuración; `SystemSetting` almacena defaults y mapeos.
- Si deseas una columna específica para color, podría agregarse, pero no es requerida.

3) Ajustar seeds para copiar la UI actual

Usaremos los scripts existentes, adaptando valores para replicar lo que hoy muestra el frontend (duración 90', horarios `08:00–22:30`, base price 6000, colores y estados).

- Scripts relevantes:
  - `scripts/seed-courts.js` (cancha + horarios + slot_duration)
  - `scripts/seed-test-data.js` (usuarios + reservas + estados + pagos)
  - `scripts/migrate-to-postgresql.ps1` (pipeline completo)

Recomendaciones de valores:
- Canchas (ejemplo): 
  - Cancha 1: morado `#8b5cf6` / `#a78bfa`
  - Cancha 2: rojo `#ef4444` / `#f87171`
  - Cancha 3: verde `#22c55e` / `#4ade80`
- `operatingHours`: start `"08:00"`, end `"22:30"`, `slot_duration`: 90
- `basePrice`: 6000 (unificar valor actual y actualizar frontend para leer de BD)
- Estados de reserva: `PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED` (según casos de prueba actuales)
- `AdminWhitelist`: insertar `ADMIN_EMAILS` (y/o la lista de prueba usada hoy)

4) Ejecutar migraciones y seeds
- Si el esquema y migraciones ya están creados, puedes ir directo a seed.
- Si prefieres usar el script de PowerShell para todo el flujo:

```bash
pwsh ./scripts/migrate-to-postgresql.ps1 -Full
```

- O manualmente (dev local):
```bash
npx prisma migrate dev --name hardcoded-to-db
```

```bash
node scripts/seed-courts.js
```

```bash
node scripts/seed-test-data.js
```

5) Verificación de migración
- Usa el script de verificación para chequear dependencias y configuración.

```bash
node scripts/test-migration.js
```

---

## Cómo replicar exactamente la UI actual en los seeds

- Courts:
  - Crear 3 canchas activas con `basePrice: 6000` y `operatingHours` como arriba.
  - Guardar colores en `features` (JSON string) por cancha:
    - Cancha 1 → morado
    - Cancha 2 → rojo
    - Cancha 3 → verde
- Slots:
  - Generar reservas con duración `90` minutos y horarios entre `08:00` y `22:30`.
- Estados y disponibilidad:
  - Crear reservas con estados variados: `PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`.
  - Simular algunos solapamientos y distintos `paymentStatus`: `PENDING`, `DEPOSIT_PAID`, `FULLY_PAID`.
- Usuarios:
  - Generar usuarios de prueba (coincide con el script actual).
- Admin:
  - Poblar `AdminWhitelist` con `ADMIN_EMAILS` o la lista de admin de prueba.

Nota: El script `seed-test-data.js` actualmente usa `basePrice: 4000` y horarios `08:00–23:30`. Ajusta esos valores a `6000` y `22:30` para copiar la UI actual. También asegúrate de que el cálculo de `totalPrice` derive del `Court.basePrice` y, si aplica, `priceMultiplier`.

---

## Cambios en el Frontend (Checklist)

Sustituir referencias hardcodeadas para que lean de BD/API:

- `app/api/slots/route.ts`
  - Leer `Court.operatingHours` y `slot_duration` por cancha.
  - Evitar defaults constantes; usar `SystemSetting` como fallback global.

- `lib/utils/booking-utils.ts`
  - Generar time slots desde `operatingHours` y `slot_duration`.
  - Eliminar arrays fijos (08:00–22:30) y valores `90`.

- `components/providers/AppStateProvider.tsx`
  - Usar datos de BD para `duration`, `timeSlots`, `unifiedTimeSlots`.
  - Derivar precios desde `court.basePrice`/`priceMultiplier` (no usar `12000` local).

- `components/HomeSection.tsx`
  - Reemplazar `defaultCourt` y reglas por id/nombre.
  - Parsear `court.features` (JSON) para aplicar `color/bgColor/textColor`.
  - Etiquetas "Disponible"/"Reservado": si se desean configurables, leer de `SystemSetting.AVAILABILITY_BADGES`.

- `components/TurneroApp.tsx`
  - Eliminar paletas por nombre (a/b) y usar `features` o `COURT_COLOR_MAP`.
  - Textos de panel rápido: opcionalmente centralizables en `SystemSetting` si se quiere configurable.

- `app/(protected)/bookings/components/BookingFilters.tsx` y `BookingForm.tsx`
  - Eliminar `statusOptions` estáticos o moverlos a `SystemSetting.STATUS_BADGES` si desean configurables.
  - TimeSlots: tomar del API/BD, no generar localmente con arrays fijos.

- `app/admin-panel/admin/turnos/page.tsx`
  - Quitar arrays simulados y ocupar datos reales desde BD.

---

## Ejemplos Prácticos

### 1) Guardar colores de cancha en `features`
- Court.features (string): `{"color":"#8b5cf6","bgColor":"#a78bfa","textColor":"#ffffff"}`
- En el frontend, al renderizar:
  - `const features = JSON.parse(court.features || "{}")`
  - `style={{ backgroundColor: features.bgColor, color: features.textColor }}`

### 2) Generar slots desde BD
- Consultar `court.operatingHours`: `start`, `end`, `slot_duration`.
- Generar intervalos de 30' si así se requiere o derivar del `slot_duration`. Si tu regla es:
  - `start` → `08:00`
  - `end` → `22:30`
  - `slot_duration` → `90` (el bloque de reserva); los intervalos de grilla siguen siendo 30' para elegir.

### 3) Precios
- Fórmula sugerida: `totalPrice = court.basePrice * court.priceMultiplier`
- Si el frontend necesita promoción u oferta, almacenar ese valor también en `SystemSetting` o `Court.features`.

---

## Seeds y Configuraciones Sugeridas

- Courts:
  - `Court(name="Cancha 1", basePrice=6000, features=JSON morado, operatingHours=JSON arriba)`
  - `Court(name="Cancha 2", basePrice=6000, features=JSON rojo, operatingHours=JSON arriba)`
  - `Court(name="Cancha 3", basePrice=6000, features=JSON verde, operatingHours=JSON arriba)`

- SystemSetting:
  - `DEFAULT_OPERATING_HOURS = {"start":"08:00","end":"22:30"}`
  - `DEFAULT_SLOT_DURATION_MINUTES = "90"`
  - `DEFAULT_BASE_PRICE = "6000"`
  - `COURT_COLOR_MAP = {"Cancha 1": {...}, "Cancha 2": {...}, "Cancha 3": {...}}`
  - `STATUS_BADGES = {"PENDING":{"label":"Pendiente","class":"..."}, ...}`
  - `AVAILABILITY_BADGES = {"AVAILABLE":{"label":"Disponible"...},"RESERVED":{"label":"Reservado"...}}`

- AdminWhitelist:
  - Insertar emails desde `.env.ADMIN_EMAILS` y/o lista de prueba.

---

## Cómo Ejecutar (Windows)

- Generar cliente Prisma:
```bash
npx prisma generate
```

- Aplicar migraciones en dev:
```bash
npx prisma migrate dev --name hardcoded-to-db
```

- Sembrar canchas:
```bash
node scripts/seed-courts.js
```

- Sembrar datos de prueba (usuarios/reservas/pagos):
```bash
node scripts/seed-test-data.js
```

- Pipeline completo con PowerShell:
```bash
pwsh ./scripts/migrate-to-postgresql.ps1 -Full
```

- Prueba de migración:
```bash
node scripts/test-migration.js
```

---

## Verificación

- Revisa en DB:
  - `Court` tiene `operatingHours` y `features` con colores y duración 90.
  - `basePrice` de cada `Court` = 6000.
  - Reservas tienen estados variados y `paymentStatus`.
  - `SystemSetting` contiene las llaves configuradas.
  - `AdminWhitelist` poblado.

- UI:
  - Los colores y labels ahora reflejan BD.
  - Slots coinciden con `08:00–22:30` y duración de 90'.
  - Precios calculados desde BD (no hardcoded).

---

Registro de ejecución y verificación (2025-10-16)

- Paso 1: Generación de Prisma Client
  - Comando: `npx prisma generate`
  - Resultado: OK (v6.16.2 generado)

- Paso 2: Estado de migraciones
  - Comando: `npx prisma migrate status`
  - Resultado: Base de datos al día (2 migraciones encontradas, sin pendientes)

- Paso 3: Seed de canchas (controlado y validado con Zod)
  - Comando: `node scripts/seed-courts.js`
  - Resultado: Creación/actualización exitosa
  - Detalle: `Cancha 1`, `Cancha 2`, `Cancha 3` validadas y almacenadas con `operatingHours = { start: "08:00", end: "22:30", slot_duration: 90 }` y `features` con colores por cancha.

- Paso 4: Verificación de canchas
  - Comando: `node debug-courts.js`
  - Resultado: Total 6 canchas encontradas (existen canchas previas como `Cancha 1 - Premium`, `Cancha 2 - Estándar`, `Cancha 3 - Económica` y las nuevas `Cancha 1`, `Cancha 2`, `Cancha 3`).
  - Observación: Se detectan duplicados lógicos por nombre; en pasos siguientes se recomienda unificar o limpiar las entradas antiguas si no serán usadas.

- Confirmación del paso: APROBADO
  - Se valida que `operatingHours` y `features` se almacenan correctamente y son consistentes con la UI objetivo.
  - Se puede proceder al siguiente cambio (seed de datos de prueba o ajustes de limpieza) manteniendo este registro.


---

## Notas y Buenas Prácticas

- Caching: puedes cachéar `SystemSetting` y `Courts` en memoria con TTL breve para reducir llamadas.
- Fallbacks: si por alguna razón no hay valor en BD, usar `SystemSetting` global; evitar defaults hardcodeados en componentes.
- Enums: `BookingStatus` y `PaymentStatus` quedan en Prisma; los labels/estilos se definen en `SystemSetting` si quieres que sean configurables.
- Auditoría: Mantén consistentes las funciones e índices que ya existen en migraciones para rendimiento y vistas de reportes.

---

## Validación con Zod (JSON en Court.operatingHours y Court.features)

Para asegurar la integridad de los datos JSON almacenados en las columnas `Court.operatingHours` y `Court.features`, se propone validar con Zod tanto al momento de escribir (scripts de seed) como al momento de leer (API/backend). Esto evita estructuras inválidas y provee fallbacks seguros.

### Instalación

```bash
npm i zod
```

### Contexto de los Modelos de Prisma y Estructuras JSON

1. Modelo `Court`:
   - `operatingHours: String` → Debe contener un JSON con la siguiente estructura:
     ```json
     {
       "start": "HH:mm",
       "end": "HH:mm",
       "slot_duration": 90
     }
     ```
   - `features: String` → Debe contener un JSON con la siguiente estructura:
     ```json
     {
       "color": "#xxxxxx",
       "bgColor": "#xxxxxx",
       "textColor": "#xxxxxx"
     }
     ```

---

### Tarea 1: Validar en el Script de Seed (`scripts/seed-courts.js`)

Objetivo: crear esquemas Zod, validar objetos antes de `JSON.stringify()` y abortar el seed ante errores.

Fragmento de código (CommonJS):

```js
// scripts/seed-courts.js
const { PrismaClient } = require('@prisma/client')
const { z } = require('zod')

const prisma = new PrismaClient()

// Utilidades de validación
const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const OperatingHoursSchema = z
  .object({
    start: z.string().regex(HHMM_REGEX, 'start debe ser "HH:mm"'),
    end: z.string().regex(HHMM_REGEX, 'end debe ser "HH:mm"'),
    slot_duration: z
      .number()
      .int('slot_duration debe ser entero')
      .positive('slot_duration debe ser > 0')
      .min(15)
      .max(360)
      .multipleOf(15)
  })
  .superRefine((data, ctx) => {
    const toMin = (hhmm) => {
      const [h, m] = hhmm.split(':').map(Number)
      return h * 60 + m
    }
    if (toMin(data.end) <= toMin(data.start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'end debe ser posterior a start'
      })
    }
  })

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
const CourtFeaturesSchema = z
  .object({
    color: z.string().regex(HEX_COLOR, 'color debe ser #RRGGBB'),
    bgColor: z.string().regex(HEX_COLOR, 'bgColor debe ser #RRGGBB'),
    textColor: z.string().regex(HEX_COLOR, 'textColor debe ser #RRGGBB')
  })
  .passthrough() // permite claves extra si en el futuro agregamos más propiedades

function validateOrThrow(schema, data, ctxName) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`[${ctxName}] Datos inválidos: ${details}`)
  }
  return result.data
}

async function seedCourts() {
  try {
    console.log('🌱 Validando y creando canchas de prueba...')

    const courtsConfig = [
      {
        id: 'court-a',
        name: 'Cancha 1',
        basePrice: 6000,
        priceMultiplier: 1.0,
        featuresObj: { color: '#8b5cf6', bgColor: '#a78bfa', textColor: '#ffffff' },
        operatingHoursObj: { start: '08:00', end: '22:30', slot_duration: 90 },
        isActive: true
      },
      {
        id: 'court-b',
        name: 'Cancha 2',
        basePrice: 6000,
        priceMultiplier: 0.9,
        featuresObj: { color: '#ef4444', bgColor: '#f87171', textColor: '#ffffff' },
        operatingHoursObj: { start: '08:00', end: '22:30', slot_duration: 90 },
        isActive: true
      },
      {
        id: 'court-c',
        name: 'Cancha 3',
        basePrice: 6000,
        priceMultiplier: 1.2,
        featuresObj: { color: '#22c55e', bgColor: '#4ade80', textColor: '#ffffff' },
        operatingHoursObj: { start: '08:00', end: '22:30', slot_duration: 90 },
        isActive: true
      }
    ]

    for (const cfg of courtsConfig) {
      // Validar antes de serializar
      const validFeatures = validateOrThrow(CourtFeaturesSchema, cfg.featuresObj, 'Court.features')
      const validHours = validateOrThrow(OperatingHoursSchema, cfg.operatingHoursObj, 'Court.operatingHours')

      await prisma.court.create({
        data: {
          id: cfg.id,
          name: cfg.name,
          basePrice: cfg.basePrice,
          priceMultiplier: cfg.priceMultiplier,
          features: JSON.stringify(validFeatures),
          operatingHours: JSON.stringify(validHours),
          isActive: cfg.isActive
        }
      })
      console.log(`✅ Cancha creada: ${cfg.name}`)
    }

    console.log('🎉 Creación de canchas completada')
  } catch (err) {
    console.error('❌ Error en seed-courts:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedCourts()
```

Notas:
- Si prefieres evitar duplicación y reutilizar esquemas, puedes migrar este script a TypeScript (`scripts/seed-courts.ts`) y importar desde `lib/schemas.ts` ejecutando el seed con `npx tsx scripts/seed-courts.ts`.

---

### Tarea 2: Validar en el Lado del Servidor (Backend/API)

Objetivo: centralizar esquemas en un helper compartido y validar con `safeParse` tras `JSON.parse()` usando fallbacks seguros.

1) Helper compartido de esquemas y utilidades (`lib/schemas.ts`):

```ts
// lib/schemas.ts
import { z } from 'zod'

export const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export const OperatingHoursSchema = z
  .object({
    start: z.string().regex(HHMM_REGEX, 'start debe ser "HH:mm"'),
    end: z.string().regex(HHMM_REGEX, 'end debe ser "HH:mm"'),
    slot_duration: z
      .number()
      .int('slot_duration debe ser entero')
      .positive('slot_duration debe ser > 0')
      .min(15)
      .max(360)
      .multipleOf(15)
  })
  .superRefine((data, ctx) => {
    const toMin = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number)
      return h * 60 + m
    }
    if (toMin(data.end) <= toMin(data.start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'end debe ser posterior a start'
      })
    }
  })

export type OperatingHours = z.infer<typeof OperatingHoursSchema>

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/
export const CourtFeaturesSchema = z
  .object({
    color: z.string().regex(HEX_COLOR, 'color debe ser #RRGGBB'),
    bgColor: z.string().regex(HEX_COLOR, 'bgColor debe ser #RRGGBB'),
    textColor: z.string().regex(HEX_COLOR, 'textColor debe ser #RRGGBB')
  })
  .passthrough()

export type CourtFeatures = z.infer<typeof CourtFeaturesSchema>

export function formatZodError(result: { success: boolean; error?: z.ZodError }) {
  if (!result || result.success) return ''
  return result.error!.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
}

export function parseJsonSafely<T>(json: string | null | undefined, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = typeof json === 'string' ? JSON.parse(json) : {}
    const res = schema.safeParse(raw)
    if (res.success) return res.data
    console.error('Validación Zod fallida:', formatZodError(res))
    return fallback
  } catch (e) {
    console.error('Error parseando JSON:', e)
    return fallback
  }
}
```

2) Uso en una ruta de API (`app/api/slots/route.ts`) o función de servidor:

```ts
// app/api/slots/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  OperatingHoursSchema,
  CourtFeaturesSchema,
  parseJsonSafely,
  type OperatingHours,
  type CourtFeatures
} from '@/lib/schemas'

const DEFAULT_OPERATING_HOURS: OperatingHours = { start: '08:00', end: '22:30', slot_duration: 90 }
const DEFAULT_FEATURES: CourtFeatures = { color: '#8b5cf6', bgColor: '#a78bfa', textColor: '#ffffff' }

export async function GET(req: Request) {
  const url = new URL(req.url)
  const courtId = url.searchParams.get('courtId')
  if (!courtId) {
    return NextResponse.json({ error: 'courtId requerido' }, { status: 400 })
  }

  try {
    const court = await prisma.court.findUnique({
      where: { id: Number(courtId) },
      select: { id: true, name: true, operatingHours: true, features: true, basePrice: true, priceMultiplier: true }
    })

    if (!court) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 })
    }

    // Validar JSON tras parseo, con fallbacks seguros
    const operatingHours = parseJsonSafely(court.operatingHours, OperatingHoursSchema, DEFAULT_OPERATING_HOURS)
    const features = parseJsonSafely(court.features, CourtFeaturesSchema, DEFAULT_FEATURES)

    const basePrice = court.basePrice ?? 6000
    const priceMultiplier = court.priceMultiplier ?? 1
    const finalPrice = Math.round(basePrice * priceMultiplier)

    return NextResponse.json({
      courtId: court.id,
      name: court.name,
      operatingHours,
      features,
      price: finalPrice
    })
  } catch (e) {
    console.error('❌ Error en /api/slots:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
```

Notas de manejo de errores:
- `safeParse` nunca lanza excepciones: registra los detalles con `formatZodError` (si lo usas) y aplica fallback.
- Si dispones de `SystemSetting` (e.g. `DEFAULT_OPERATING_HOURS`), puedes leerlo y validarlo también con Zod para que el fallback provenga de BD y no de constantes.

Buenas prácticas:
- Centraliza los esquemas en `lib/schemas.ts` para reuso (API, servicios y, si usas TS en scripts, también seeds).
- Define fallbacks seguros y consistentes con los valores de seeds y documentación (08:00–22:30, 90 minutos, paleta por defecto).
- Permite `passthrough()` en `CourtFeaturesSchema` si planeas ampliar propiedades sin romper la validación.