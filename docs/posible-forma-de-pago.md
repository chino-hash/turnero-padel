# Posibles Formas de Pago para el Turnero de Pádel

## Resumen Ejecutivo

Este documento analiza las diferentes opciones de pago disponibles para implementar en el sistema de turnero de pádel, con foco en Mercado Pago como procesador principal y la estrategia de autorización y captura para manejar reservas y cancelaciones.

## Métodos de Pago Disponibles

### 🏦 Tarjetas de Crédito y Débito

**Tarjetas de Crédito Aceptadas:**
- Visa, Mastercard, American Express
- Diners Club, Naranja, Cabal
- Tarjeta Shopping, Cencosud, Argencard, CMR

**Tarjetas de Débito Aceptadas:**
- Visa Débito, Mastercard Débito
- Maestro, Cabal Débito

### 🏧 Transferencias Bancarias

- CBU/CVU/Alias
- Transferencias bancarias directas
- Procesamiento inmediato o hasta 2 horas

### 💰 Métodos Alternativos

**Efectivo:**
- Rapipago, Pago Fácil
- Red de cobranza física

**Digitales:**
- Dinero disponible en cuenta Mercado Pago
- Cuotas sin Tarjeta (Mercado Crédito)

## Estrategias de Implementación

### ✅ Opción Recomendada: Autorización y Captura

**Ventajas:**
- ✅ Mejor experiencia de usuario
- ✅ Menor costo operativo
- ✅ Facilidad de implementación
- ✅ Manejo automático de reembolsos
- ✅ Usado por empresas como Uber

**Flujo de Proceso:**
1. **Al crear reserva**: Autorizar el monto total (seña + saldo)
2. **Si cancela con +2h**: Cancelar autorización (sin costo)
3. **Si cancela con -2h**: Capturar solo la seña
4. **Al completar turno**: Capturar el monto total

### 🔄 Alternativa: Reembolso Directo vía API

**Desventajas:**
- ❌ Mayor complejidad técnica
- ❌ Propenso a errores
- ❌ Costos adicionales de transacción
- ❌ Tiempo de procesamiento variable

### 📡 Complemento: Webhooks

**Beneficios:**
- Notificaciones en tiempo real
- Auditoría automática
- Sincronización de estados
- Validación de autenticidad

## Implementación Técnica

### Checkout Transparente

```javascript
// Ejemplo de configuración
const checkoutConfig = {
  method: 'card', // Tarjetas directas
  transparent: true, // Sin redirección
  capture: false, // Solo autorización inicial
  notification_url: '/api/webhooks/mercadopago'
};
```

### API Endpoints Necesarios

```
POST /api/payments/authorize     # Autorizar pago
POST /api/payments/capture       # Capturar pago autorizado
POST /api/payments/cancel        # Cancelar autorización
POST /api/webhooks/mercadopago   # Recibir notificaciones
```

## Política de Reembolsos

### Reglas de Negocio

- **Cancelación +2 horas**: Reembolso completo (cancelar autorización)
- **Cancelación -2 horas**: Sin reembolso (capturar seña)
- **No show**: Capturar seña automáticamente
- **Turno completado**: Capturar monto total

### Estados de Pago

```
AUTHORIZED  -> Fondos retenidos, no cobrados
CAPTURED    -> Fondos cobrados
CANCELLED   -> Autorización cancelada
REFUNDED    -> Pago devuelto (solo si ya fue capturado)
```

## Configuración de Seguridad

### Validación de Webhooks

```javascript
// Verificar firma de Mercado Pago
const isValidSignature = (signature, payload, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
};
```

### Variables de Entorno

```env
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
MERCADOPAGO_ENVIRONMENT=sandbox|production
```

## Costos y Comisiones

### Estructura de Costos

- **Tarjetas de crédito**: ~2.9% + $2 por transacción
- **Tarjetas de débito**: ~1.8% + $2 por transacción
- **Transferencias**: Gratis para el usuario
- **Efectivo**: ~2.9% + $2 por transacción

### Optimización de Costos

- Incentivar transferencias bancarias
- Ofrecer descuentos por débito
- Configurar montos mínimos por método

## Experiencia de Usuario

### Flujo de Pago

1. **Selección de turno**
2. **Elección de método de pago**
3. **Ingreso de datos (si es tarjeta)**
4. **Confirmación de autorización**
5. **Reserva confirmada**

### Información al Usuario

```
"Tu tarjeta será autorizada por $X. 
Solo se cobrará si no cancelas con 2+ horas de anticipación."
```

## Monitoreo y Métricas

### KPIs Importantes

- Tasa de aprobación de pagos
- Tiempo promedio de procesamiento
- Cantidad de reembolsos
- Métodos de pago más utilizados
- Tasa de cancelaciones por tiempo

### Alertas Automáticas

- Fallos en webhooks
- Pagos rechazados
- Autorizaciones expiradas
- Problemas de conectividad con MP

## Roadmap de Implementación

### Fase 1: Básico (2-3 semanas)
- ✅ Integración con Checkout API
- ✅ Autorización y captura básica
- ✅ Manejo de tarjetas principales

### Fase 2: Avanzado (1-2 semanas)
- 🔄 Webhooks y notificaciones
- 🔄 Transferencias bancarias
- 🔄 Dashboard de pagos

### Fase 3: Optimización (1 semana)
- 📊 Métricas y reportes
- 🎯 Optimización de conversión
- 🔒 Auditoría de seguridad

## Conclusiones

### Recomendación Final

**Implementar Autorización y Captura con Mercado Pago** es la mejor opción porque:

1. **Simplicidad técnica**: Menos código, menos errores
2. **Mejor UX**: Sin cobros inmediatos innecesarios
3. **Flexibilidad**: Múltiples métodos de pago
4. **Escalabilidad**: Fácil agregar nuevos métodos
5. **Confiabilidad**: Respaldado por Mercado Pago

### Próximos Pasos

1. Crear cuenta de desarrollador en Mercado Pago
2. Configurar ambiente de pruebas (sandbox)
3. Implementar endpoints básicos de pago
4. Integrar con el frontend existente
5. Configurar webhooks para notificaciones
6. Realizar pruebas exhaustivas
7. Desplegar a producción

---

**Fecha de creación**: Enero 2025  
**Versión**: 1.0  
**Autor**: Sistema de Turnero de Pádel