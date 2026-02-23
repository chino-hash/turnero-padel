# Pendientes - Pestaña Productos

**Ruta:** `/admin-panel/admin/productos`  
**Archivo principal:** `app/admin-panel/admin/productos/page.tsx`  
**APIs:** `app/api/productos/route.ts`, `app/api/ventas/route.ts`

---

## Estado actual

La pestaña Productos permite gestionar el catálogo, stock, precios, activar/desactivar productos y registrar ventas rápidas. Existe fallback a datos mock cuando la API falla.

---

## Implementado

- [x] CRUD de productos (crear, editar, eliminar)
- [x] Categorías, precios, stock
- [x] Activar/desactivar productos
- [x] Modal de venta rápida (producto, cantidad, método de pago)
- [x] Búsqueda y filtro por categoría
- [x] Volumen para bebidas (ml/L)
- [x] Estadísticas rápidas (total, activos, stock bajo, valor total)
- [x] Fallback a datos mock cuando la API falla

---

## Pendiente para dar por terminada

### 1. Integración completa con API

- Eliminar o depurar el fallback a datos mock.
- Asegurar que la API `/api/productos` funcione correctamente.
- Manejar errores mostrando mensajes claros en lugar de cargar mocks.

### 2. Multitenant

- Verificar que `/api/productos` y `/api/ventas` filtren por `tenantId`.
- Que cada tenant gestione solo sus productos y ventas.

### 3. Historial de ventas

- Sección o pestaña para ver historial de ventas.
- Filtros por fecha, producto, método de pago.
- Resumen de ingresos por ventas de productos.

### 4. Alertas de stock bajo

- Indicadores más visibles cuando stock ≤ umbral (ej. 5).
- Badge o aviso persistente en el header si hay productos con stock bajo.
- Opción de configurar umbral por producto o global.

### 5. Consistencia de toasts

- El proyecto usa tanto `react-hot-toast` como `sonner`.
- Unificar en un solo sistema de notificaciones.

### 6. Modal de eliminación

- Sustituir `confirm()` por modal/dialog propio.
- Mensaje claro y botones "Cancelar" y "Eliminar".

---

## Referencias

- Skill multitenant: `.cursor/skills/turnero-padel-multitenant/SKILL.md`
- Skill dominio: `.cursor/skills/turnero-padel-domain/SKILL.md` (Producto, Venta)
- APIs: `/api/productos`, `/api/ventas`
