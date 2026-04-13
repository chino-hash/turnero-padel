---
name: Pestaña métodos de pago
overview: Agregar una pestaña `Métodos de pago` en Admin para que el admin del club cargue y actualice credenciales de Mercado Pago y datos de transferencia bancaria, guardados por tenant. En esta etapa no se mostrarán estos datos al cliente final en el flujo de reserva.
todos:
  - id: nav-admin-metodos-pago
    content: Agregar item de navegación `Métodos de pago` en AdminLayoutContent con ruta nueva.
    status: pending
  - id: ui-metodos-pago
    content: Implementar página `admin/metodos-pago` con formulario para MP + transferencia y carga/guardado.
    status: pending
  - id: api-payment-settings
    content: Crear endpoint tenant-scoped GET/PUT para leer/actualizar configuración de pago con permisos admin/superadmin.
    status: pending
  - id: persist-transfer-system-settings
    content: Guardar datos de transferencia en SystemSetting por tenant y credenciales MP en Tenant encriptadas.
    status: pending
  - id: validar-y-probar
    content: Validar reglas de negocio, permisos multitenant y flujo de guardado/recarga en UI.
    status: pending
  - id: resolver-tenant-context
    content: Estandarizar resolución de tenant para super-admin (tenantId/tenantSlug/contexto persistido) y bloquear guardado sin tenant objetivo.
    status: pending
  - id: definir-limpieza-secretos
    content: Definir contrato explícito para conservar vs limpiar credenciales (campos vacíos no pisan; limpiar requiere acción explícita).
    status: pending
  - id: robustecer-respuesta-api
    content: Alinear API nueva al formato ApiResponse con ZodError formateado y códigos HTTP consistentes.
    status: pending
  - id: smoke-tests-payment-settings
    content: Agregar checklist de pruebas manuales de regresión para sandbox/production, permisos y visibilidad de secretos.
    status: pending
isProject: false
---

# Plan: pestaña Métodos de pago en Admin

## Objetivo funcional
Crear una sección nueva en el panel `admin-panel` (al lado de Torneo) donde el admin del tenant pueda:
- Configurar Mercado Pago (`enabled`, `environment`, `accessToken`, `publicKey`, `webhookSecret`).
- Configurar transferencia bancaria (`alias`, `cbu`, `titular`, `banco`, `observaciones`).

En esta iteración, la configuración queda solo para gestión interna del admin (sin exposición en el checkout/reserva).

## Enfoque técnico
- Reutilizar el patrón actual de navegación de admin en [`app/admin-panel/components/AdminLayoutContent.tsx`](app/admin-panel/components/AdminLayoutContent.tsx) para agregar el link `Métodos de pago`.
- Crear página dedicada en `admin-panel` para formulario y guardado de configuración por tenant.
- Mantener credenciales sensibles de Mercado Pago en `Tenant` (como ya existe hoy) y guardar datos de transferencia en `SystemSetting` por `tenantId`.
- Crear endpoint específico para admin de tenant (no super-admin-only), con validación de permisos multitenant y encriptación de credenciales MP.

## Huecos detectados y ajustes
- **Resolución de tenant en super admin (hueco crítico):**
  - Si super admin entra sin `tenantId` en query, la página puede no saber a qué tenant guardar.
  - Ajuste: resolver tenant con prioridad `tenantId` query > `tenantSlug` query > contexto persistido (`admin-context-tenant`) y, si no existe, mostrar estado bloqueado de solo lectura con CTA para seleccionar tenant.

- **Contrato de secretos (hueco funcional):**
  - Falta definir qué significa enviar string vacío en Access Token/Public Key/Webhook.
  - Ajuste: por defecto `vacío = conservar`; agregar acción explícita `Limpiar credenciales MP` (checkbox o botón) que envíe bandera dedicada para setear `null`.

- **Consistencia de API (hueco técnico):**
  - El proyecto combina respuestas `{ success }` y `ApiResponse`.
  - Ajuste: en endpoint nuevo adoptar patrón `createSuccessResponse/createErrorResponse` + `formatZodErrors`, para evitar manejo heterogéneo en frontend.

- **Validación de transferencia (hueco de calidad de datos):**
  - Sin reglas mínimas puede quedar configuración incompleta (`alias` sin `titular`, etc.).
  - Ajuste: validaciones suaves con reglas de formato (CBU 22 dígitos opcional, alias permitido, longitudes máximas) y mensajes claros sin bloquear casos reales.

- **Riesgo de regresión en caché de provider (hueco de operación):**
  - Si no se invalida en todos los cambios MP, puede seguir usando credenciales viejas.
  - Ajuste: invalidar cache ante cualquier cambio en `mercadoPagoEnabled`, `mercadoPagoEnvironment` y credenciales; incluir verificación manual posterior.

## Cambios propuestos por capa
- **Navegación Admin**
  - Actualizar [`app/admin-panel/components/AdminLayoutContent.tsx`](app/admin-panel/components/AdminLayoutContent.tsx) para sumar pestaña `Métodos de pago` con su ruta.

- **Nueva pantalla Admin**
  - Crear [`app/admin-panel/admin/metodos-pago/page.tsx`](app/admin-panel/admin/metodos-pago/page.tsx) con:
    - Carga inicial de datos (MP + transferencia).
    - Formulario con validaciones básicas de UX.
    - Guardado con feedback (`toast`) y estados de carga.

- **API para gestión de métodos de pago (tenant-scoped)**
  - Crear [`app/api/admin/payment-settings/route.ts`](app/api/admin/payment-settings/route.ts):
    - `GET`: devuelve configuración actual del tenant.
    - `PUT`: actualiza configuración MP y transferencia.
    - Autorización: admin/superadmin; no superadmin solo su `tenantId`.
    - Resolución explícita de tenant objetivo para super admin (`tenantId` o `tenantSlug`), con error 400 si falta contexto.
    - Encriptar `mercadoPagoAccessToken`, `mercadoPagoPublicKey`, `mercadoPagoWebhookSecret` con el mismo criterio usado en [`app/api/tenants/[id]/route.ts`](app/api/tenants/[id]/route.ts).
    - Invalidar caché de provider cuando cambian campos MP (reutilizando `invalidateTenantProviderCache`).
    - Usar formato de respuesta compatible con `ApiResponse` y errores de validación Zod estandarizados.

- **Persistencia de datos de transferencia**
  - Guardar en `SystemSetting` con claves por tenant, por ejemplo:
    - `payment_transfer_alias`
    - `payment_transfer_cbu`
    - `payment_transfer_account_holder`
    - `payment_transfer_bank`
    - `payment_transfer_notes`
  - Reutilizar acceso Prisma existente (sin migración de DB en esta fase).

- **Validación/contratos**
  - Agregar schema Zod para payload de actualización (en [`lib/validations/booking.ts`](lib/validations/booking.ts) o archivo nuevo de validaciones de pagos para mantener separación).
  - Mantener reglas actuales de MP (production exige credenciales si no existen previas).
  - Definir flags explícitos para limpiar credenciales (`clearMercadoPagoAccessToken`, etc.) y evitar borrados accidentales.
  - Validar transferencia con reglas mínimas de consistencia (`alias/cbu/titular/banco/observaciones`).

## Compatibilidad y seguridad
- Respetar aislamiento multitenant usando `tenantId` del usuario cuando no sea super admin.
- No exponer secretos ya guardados: la UI mostrará placeholders y permitirá "dejar vacío para conservar".
- No romper endpoint super-admin actual de tenants; esta nueva API será específica para Admin Panel.

## Verificación prevista
- Navegación: se ve `Métodos de pago` junto a `Torneo` en desktop/móvil.
- Admin tenant:
  - puede guardar y volver a cargar datos MP y transferencia.
  - no puede escribir configuración de otro tenant.
- Super admin:
  - puede operar sobre tenant en contexto (query `tenantId/tenantSlug`).
- Confirmar que al actualizar MP se invalida caché de provider.
- Confirmar comportamiento de secretos:
  - campos vacíos no sobreescriben.
  - limpieza explícita sí deja `null` en base.
- Confirmar bloqueo seguro:
  - super admin sin tenant objetivo no puede guardar hasta elegir tenant.

## Fuera de alcance (confirmado)
- No mostrar aún datos de transferencia al cliente en el flujo de reserva/pago (`padel-booking`).
