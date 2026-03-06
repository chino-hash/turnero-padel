# DIFERENCIAS ENTRE VERSIÓN LOCAL Y VERCEL

**Fecha de revisión:** Enero 2026  
**Última actualización:** Enero 2026

---

## 🔍 DIFERENCIAS CRÍTICAS ENCONTRADAS

### 1. ⚠️ HEADERS DE SEGURIDAD - Content-Security-Policy

**Ubicación:** `next.config.js` vs `vercel.json`

**Diferencia:**
- **`next.config.js` (local):** Incluye header `Content-Security-Policy` con valor `"frame-ancestors 'self' https://*.trae.ai https://trae.ai"`
- **`vercel.json` (producción):** NO incluye este header

**Impacto:**
- En local, el CSP podría estar bloqueando ciertos iframes o recursos
- En producción (Vercel), este header no se aplica, lo que podría permitir embedding desde otros dominios
- **Riesgo:** Inconsistencia en políticas de seguridad entre entornos

**Recomendación:**
```json
// Agregar a vercel.json
{
  "key": "Content-Security-Policy",
  "value": "frame-ancestors 'self' https://*.trae.ai https://trae.ai"
}
```

---

### 2. 🔍 MODAL DE EXTRAS - Búsqueda de Productos

**Ubicación:** `components/AdminTurnos.tsx` (líneas 1919-1933)

**Estado Actual (Local):**
- Usa componente `Select` (dropdown) para seleccionar productos
- No hay barra de búsqueda implementada

**Estado Esperado (según usuario):**
- Debería usar `Input` con búsqueda por texto
- Filtrado en tiempo real mientras se escribe

**Código Actual:**
```typescript
<Select
  value={selectedProductId !== null ? String(selectedProductId) : ""}
  onValueChange={(value) => setSelectedProductId(value ? Number(value) : null)}
>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Seleccionar producto" />
  </SelectTrigger>
  <SelectContent>
    {productos.map((p) => (
      <SelectItem key={p.id} value={String(p.id)} disabled={!p.activo || p.stock <= 0}>
        {p.nombre} (Stock: {p.stock}){!p.activo ? ' - INACTIVO' : ''}{p.stock <= 0 ? ' - SIN STOCK' : ''}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Impacto:**
- Si en Vercel está implementada la búsqueda por Input, hay una diferencia funcional significativa
- El usuario mencionó que este cambio ya se hizo, pero no está en el código local

**Recomendación:**
- Verificar en producción si realmente está implementado el Input
- Si está en producción, actualizar el código local para sincronizar

---

### 3. 💳 MERCADO PAGO - Variables de Entorno

**Ubicación:** `lib/services/payments/PaymentProviderFactory.ts`

**Estado:**
- El código tiene fallback automático a `MockPaymentProvider` si `MERCADOPAGO_ACCESS_TOKEN` no está configurado
- No hay referencias explícitas a estas variables en el código revisado

**Posibles Diferencias:**
- **Local:** Podría estar usando `MockPaymentProvider` (sin pagos reales)
- **Vercel:** Podría tener `MERCADOPAGO_ACCESS_TOKEN` configurado, usando `MercadoPagoProvider` real

**Impacto:**
- Comportamiento completamente diferente entre entornos
- En local, los pagos serían simulados
- En producción, los pagos serían reales

**Recomendación:**
- Verificar variables de entorno en Vercel:
  ```bash
  vercel env ls production
  ```
- Documentar qué provider se está usando en cada entorno

**Nota importante (multitenant):**
- En local, puede que NO existan variables `MERCADOPAGO_*` en `.env*` (no se versionan).
- En producción, usualmente están en Vercel.
- Si un tenant no tiene credenciales persistidas en DB, el sistema puede caer en fallback a globales (según factory).

---

### 4. 🚦 RATE LIMITING - Vercel KV

**Ubicación:** `lib/rate-limit.ts`

**Estado:**
- El código tiene fallback si `KV_REST_API_URL` y `KV_REST_API_TOKEN` no están configurados
- Si no están configurados, retorna `{ success: true }` (sin límites)

**Posibles Diferencias:**
- **Local:** Podría no tener Vercel KV configurado → sin rate limiting
- **Vercel:** Probablemente tiene KV configurado → rate limiting activo

**Impacto:**
- En local, no hay protección contra abuso
- En producción, hay límites de requests por minuto

**Código Relevante:**
```typescript
const kvReady = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

const ipLimiter = kvReady
  ? new Ratelimit({ redis: kv, prefix: 'rl:ip', limiter: Ratelimit.slidingWindow(30, '1 m') })
  : null

async function limitWith(limiter: Ratelimit | null, identifier: string): Promise<RateLimitResult> {
  if (!limiter) return { success: true, limit: 0, remaining: 0, reset: new Date() }
  // ...
}
```

**Recomendación:**
- Verificar si KV está configurado en Vercel
- Considerar usar un rate limiter alternativo para desarrollo local

---

### 5. 🗄️ CONFIGURACIÓN DE BASE DE DATOS

**Ubicación:** Variables de entorno

**Posibles Diferencias:**
- **Local:** `DATABASE_URL` apunta a base de datos local o de desarrollo
- **Vercel:** `DATABASE_URL` apunta a base de datos de producción (Neon)

**Impacto:**
- Datos completamente diferentes
- Cambios en local no afectan producción y viceversa
- Esto es esperado, pero debe documentarse

---

### 6. 🔧 CONFIGURACIÓN DE BUILD

**Ubicación:** `next.config.js`

**Diferencia Menor:**
- `next.config.js` local tiene `outputFileTracingRoot: path.join(__dirname)`
- Esto podría no estar en la versión de Vercel si fue agregado recientemente

**Impacto:**
- Mínimo, solo afecta el proceso de build

---

### 7. 🪟 Windows - `prisma generate` puede fallar con `EPERM`

**Síntoma:**
- Error `EPERM: operation not permitted, rename ... query_engine-windows.dll.node.tmp -> ...dll.node`

**Causas típicas:**
- Archivo bloqueado por antivirus/Defender o por un proceso Node en ejecución.

**Workarounds:**
- Detener `npm run dev` antes de `npm run build`
- Reintentar `npm run build`
- Si el cliente ya está generado, ejecutar `npx next build`

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Variables de Entorno en Vercel

Verificar las siguientes variables:

```bash
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
PAYMENT_PROVIDER

# Vercel KV (Rate Limiting)
KV_REST_API_URL
KV_REST_API_TOKEN

# Base de Datos
DATABASE_URL
DIRECT_URL (si aplica)

# Autenticación
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

# Administración
ADMIN_EMAILS
```

### Funcionalidades a Verificar

- [ ] Modal de extras: ¿Usa Input o Select para buscar productos?
- [ ] Mercado Pago: ¿Está activo o usa MockProvider?
- [ ] Rate Limiting: ¿Está activo con Vercel KV?
- [ ] Headers de seguridad: ¿Se aplica Content-Security-Policy?
- [x] Estadísticas: se usa la ruta `/admin-panel/estadisticas` (datos reales). La ruta `/admin-panel/admin/estadisticas` redirige a esta.

---

## 🔧 ACCIONES RECOMENDADAS

### Prioridad Alta

1. **Sincronizar Headers de Seguridad**
   - Agregar `Content-Security-Policy` a `vercel.json` o
   - Remover de `next.config.js` si no es necesario

2. **Verificar Modal de Extras**
   - Confirmar en producción si usa Input o Select
   - Sincronizar código local con producción

3. **Documentar Variables de Entorno**
   - Listar todas las variables configuradas en Vercel
   - Documentar qué provider de pagos se está usando

### Prioridad Media

4. **Rate Limiting**
   - Verificar si KV está configurado en Vercel
   - Considerar alternativa para desarrollo local

5. **Variables de Mercado Pago**
   - Confirmar si están configuradas en Vercel
   - Documentar estado actual

---

## 📝 NOTAS ADICIONALES

### Archivos que Podrían Tener Diferencias

- `components/AdminTurnos.tsx` - Modal de extras (búsqueda)
- `app/admin-panel/admin/productos/page.tsx` - Panel de productos
- `lib/services/payments/` - Providers de pago
- `lib/rate-limit.ts` - Rate limiting
- `next.config.js` vs `vercel.json` - Headers

### Comandos Útiles

```bash
# Ver variables de entorno en Vercel
vercel env ls production

# Ver logs de producción
vercel logs

# Comparar builds
vercel inspect [deployment-url]
```

---

**Mantenido por:** Equipo de Desarrollo  
**Última revisión:** Enero 2026







