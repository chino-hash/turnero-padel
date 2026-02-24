# Tenant de prueba B y fix filtro de búsqueda en Landing

**Fecha:** 24 de febrero de 2026

---

## Resumen

1. Creación del tenant "Tenant de prueba B" para pruebas multitenant y verificación de aislamiento.
2. Corrección de bug en el filtro de búsqueda de la landing cuando un club tiene `description` null.

---

## 1. Tenant de prueba B

### Propósito

- Soporte para el plan de verificación multitenant (admin de tenant A no ve canchas de tenant B).
- Demos con múltiples clubs en la landing.
- Pruebas de flujos multitenant.

### Datos

| Campo      | Valor                      |
|-----------|----------------------------|
| Nombre    | Tenant de prueba B         |
| Slug      | `tenant-de-prueba-b`       |
| Admin     | `admin-tenant-b@test.com`  |
| URL club  | `/club/tenant-de-prueba-b` |
| Estado    | Activo                     |

### Contenido creado

- 3 canchas (Cancha 1, 2, 3)
- 4 productos (Pelota de Pádel, Grip, Agua, Gaseosa)
- Horarios por defecto (08:00–23:00, slots de 90 min)

### Script

**Archivo:** `scripts/create-tenant-b.js`

Bootstrap del tenant (idempotente). Uso:

```bash
node scripts/create-tenant-b.js
```

### Nota sobre SystemSetting

La base de datos tiene `UNIQUE` solo en `key` en `SystemSetting`, no en `(key, tenantId)`, por lo que no se crean system settings específicos para este tenant. La app usa valores por defecto (08:00, 23:00, 90 min) cuando no hay settings para el tenant.

---

## 2. Fix filtro de búsqueda en LandingPage

### Problema

En la sección de clubs, el filtro usaba:

```typescript
club.description?.toLowerCase().includes(searchTerm.toLowerCase())
```

Si `description` es `null` o `undefined`, `club.description?.toLowerCase()` devuelve `undefined`, y `.includes()` sobre `undefined` provoca `TypeError: Cannot read properties of undefined (reading 'includes')`.

### Solución

```diff
- club.description?.toLowerCase().includes(searchTerm.toLowerCase())
+ (club.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
```

Así se garantiza un string antes de llamar a `.includes()`.

---

## Archivos modificados

| Archivo                    | Cambio                                  |
|---------------------------|------------------------------------------|
| `components/LandingPage.tsx` | Fix filtro con `(club.description ?? '')` |
| `scripts/create-tenant-b.js` | Nuevo script de bootstrap del tenant B   |

---

## Referencias

- [Plan Completar sección Canchas](../../.cursor/plans/completar_sección_canchas_6d222a7e.plan.md) — Verificación multitenant
- [Arquitectura Multitenant](../MULTITENANT_COMPLETE.md)
- [Bootstrap tenant](../BOOTSTRAP_TENANT_Y_PAGOS.md)
