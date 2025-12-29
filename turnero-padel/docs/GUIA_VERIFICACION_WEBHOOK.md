# Guía de Verificación de Webhook MercadoPago

## ✅ Checklist Post-Configuración

### Variables en Vercel
- [x] `MERCADOPAGO_ACCESS_TOKEN` configurado (Access Token de producción)
- [x] `MERCADOPAGO_WEBHOOK_SECRET` configurado (Secret generado por MercadoPago)
- [ ] `NEXT_PUBLIC_APP_URL` configurado con tu dominio
- [ ] `NEXTAUTH_URL` configurado con tu dominio

### Configuración en MercadoPago
- [x] URL del webhook configurada: `https://www.padelbook.com.ar/api/webhooks/payments`
- [x] Evento "Pagos" seleccionado
- [x] Modo productivo activo

---

## 🔍 Paso 1: Verificar el Endpoint

### 1.1 Verificar que el endpoint responde

Abre en tu navegador o usa curl:

```bash
# En el navegador:
https://www.padelbook.com.ar/api/webhooks/payments

# Con curl:
curl https://www.padelbook.com.ar/api/webhooks/payments
```

**Respuesta esperada:**
```json
{
  "message": "Webhook endpoint activo",
  "provider": "mercadopago"
}
```

Si ves `"provider": "generic"`, significa que `MERCADOPAGO_ACCESS_TOKEN` no está configurado correctamente.

---

## 🚀 Paso 2: Redeploy en Vercel (si es necesario)

Si agregaste variables nuevas, Vercel debería hacer un redeploy automático. Verifica:

1. Ve a Vercel Dashboard → Tu proyecto → Deployments
2. Busca el deployment más reciente
3. Verifica que el estado sea "Ready" ✅

**Si necesitas forzar un redeploy:**
- Haz un commit pequeño y push, o
- Ve a Deployments → ... → Redeploy

---

## 📊 Paso 3: Verificar Logs de Inicio

Después del deploy, revisa los logs de inicio:

1. Ve a Vercel → Tu proyecto → Logs
2. Busca mensajes como:
   ```
   [PaymentProviderFactory] Usando MercadoPagoProvider
   ```
   O si hay error:
   ```
   [PaymentProviderFactory] Usando MockPaymentProvider (MERCADOPAGO_ACCESS_TOKEN no configurado)
   ```

---

## 🧪 Paso 4: Probar el Flujo Completo

### 4.1 Crear una Reserva de Prueba

1. Ve a tu aplicación: `https://www.padelbook.com.ar`
2. Selecciona una cancha y horario
3. Crea una reserva
4. Intenta crear la preferencia de pago

### 4.2 Completar el Pago

1. Deberías ser redirigido a MercadoPago
2. Completa el pago con una tarjeta de prueba
3. MercadoPago te redirigirá de vuelta a tu sitio

### 4.3 Verificar que el Webhook se Procesó

Revisa los logs en Vercel (Functions → `/api/webhooks/payments` → Logs):

**Logs exitosos esperados:**
```
[Webhook] Webhook procesado exitosamente
[BookingWebhookHandler] Reserva actualizada: CONFIRMED
```

**Si hay errores:**
```
[Webhook] Validación fallida de Mercado Pago
[Webhook] Webhook con request_id X ya fue procesado recientemente
```

---

## 🔧 Paso 5: Probar desde MercadoPago Dashboard (Opcional)

MercadoPago permite probar el webhook manualmente:

1. Ve a MercadoPago → Tus integraciones → Tu aplicación → Webhooks
2. Busca la opción "Probar notificación" o "Test notification"
3. Selecciona un evento de prueba
4. Verifica que llegue a tu endpoint

---

## 🐛 Troubleshooting

### Problema: El endpoint retorna `"provider": "generic"`

**Causa:** `MERCADOPAGO_ACCESS_TOKEN` no está configurado o es incorrecto.

**Solución:**
1. Verifica en Vercel que la variable existe
2. Verifica que el valor sea el Access Token completo (empieza con `APP_USR-`)
3. Haz un redeploy después de agregar la variable

---

### Problema: Webhook retorna 401 "Firma inválida"

**Causa:** `MERCADOPAGO_WEBHOOK_SECRET` es incorrecto o no coincide.

**Solución:**
1. Verifica que el secret en Vercel sea exactamente el mismo que generó MercadoPago
2. No debe tener espacios extra al inicio/final
3. Verifica que esté configurado para el ambiente correcto (Production)

---

### Problema: Webhook no llega desde MercadoPago

**Causas posibles:**
1. URL incorrecta en MercadoPago
2. Endpoint no responde correctamente
3. Firewall bloqueando requests

**Solución:**
1. Verifica que la URL en MercadoPago sea exactamente: `https://www.padelbook.com.ar/api/webhooks/payments`
2. Verifica que el endpoint responda a GET requests
3. Revisa logs en Vercel para ver si llegan requests

---

### Problema: "Webhook ya procesado recientemente"

**Causa:** El sistema de cache está funcionando correctamente (no es un problema, es la protección anti-replay).

**Solución:** Esto es normal. El sistema previene que se procese el mismo webhook múltiples veces.

---

## 📝 Variables de Entorno Completas para Producción

Asegúrate de tener todas estas variables en Vercel:

```bash
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret
PAYMENT_PROVIDER=mercadopago  # Opcional

# Aplicación
NEXT_PUBLIC_APP_URL=https://www.padelbook.com.ar
NEXTAUTH_URL=https://www.padelbook.com.ar
NODE_ENV=production

# Base de datos
DATABASE_URL=postgresql://...

# Autenticación
NEXTAUTH_SECRET=tu_secret_seguro
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret

# Administración
ADMIN_EMAILS=admin@tudominio.com

# Opcionales pero recomendados
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SENTRY_DSN=https://...@sentry.io/...
```

---

## ✅ Checklist Final

- [ ] Endpoint responde a GET con mensaje correcto
- [ ] Provider muestra "mercadopago" (no "generic")
- [ ] Logs muestran uso de MercadoPagoProvider
- [ ] Crear preferencia de pago funciona
- [ ] Redirección a MercadoPago funciona
- [ ] Webhook se procesa correctamente (ver logs)
- [ ] Reserva se actualiza a CONFIRMED después del pago

---

**Última actualización:** 2024



