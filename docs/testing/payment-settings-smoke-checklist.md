# Smoke Checklist - Métodos de pago

## Alcance
Validación manual de la pestaña `Métodos de pago` en `admin-panel`, API `/api/admin/payment-settings` y persistencia tenant-scoped.

## Navegación
- [ ] Se visualiza `Métodos de pago` en menú desktop de admin.
- [ ] Se visualiza `Métodos de pago` en menú móvil de admin.
- [ ] El link conserva `tenantId`/`tenantSlug` cuando hay contexto de super admin.

## Permisos y contexto tenant
- [ ] Admin de tenant abre la sección sin query params y carga su configuración.
- [ ] Admin de tenant no puede guardar en otro tenant forzando payload con `tenantId` distinto.
- [ ] Super admin con `tenantId` en URL puede cargar/guardar.
- [ ] Super admin con `tenantSlug` en URL puede cargar/guardar.
- [ ] Super admin sin `tenantId`/`tenantSlug` queda bloqueado para guardar y ve mensaje de selección de tenant.

## Mercado Pago
- [ ] `mercadoPagoEnabled` y `mercadoPagoEnvironment` se guardan y persisten al recargar.
- [ ] Dejar secretos vacíos conserva credenciales existentes.
- [ ] Marcar `limpiar` en secreto correspondiente elimina ese secreto.
- [ ] En `production` + `enabled=true`, si faltan access token/public key el API devuelve error 400.
- [ ] Al cambiar cualquier campo MP, no hay uso de credenciales viejas (cache de provider invalidada).

## Transferencia bancaria
- [ ] Guardar alias, CBU, titular, banco y observaciones persiste por tenant.
- [ ] Limpiar un campo de transferencia (enviar vacío) lo elimina para ese tenant.
- [ ] CBU inválido (distinto de 22 dígitos) devuelve error de validación.
- [ ] Si se envía alias/CBU/banco sin titular, devuelve error de validación.

## Seguridad y respuesta API
- [ ] `GET /api/admin/payment-settings` no expone valores de secretos MP.
- [ ] `GET` retorna `hasCredentials` correctamente.
- [ ] `PUT` retorna formato consistente `ApiResponse` (`success`, `message`, `data` o `errors`).
- [ ] Errores Zod se devuelven formateados en `errors[]`.
