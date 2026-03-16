# Admin Turnos: filtro por tenant para Super Admin

**Fecha:** Marzo 2026

Documentación de los cambios para que el Super Admin, al estar dentro de un tenant en la sección Admin → Turnos, vea **solo los turnos de ese tenant** (no de todos). La lista de reservas y la exportación CSV quedan alineadas con el contexto de tenant de la URL.

---

## Objetivo

- **Super Admin en un tenant**: en la sección Turnos solo debe ver las reservas (turnos) de ese tenant, no las de todos los tenants.
- **Origen del contexto**: el tenant viene de la URL (`?tenantId=` o `?tenantSlug=`), o se restaura desde cookie y se redirige con ese parámetro.
- **Consistencia**: la lista principal, el polling y la exportación CSV deben usar el mismo filtro de tenant.

---

## Problema que se corregía

La página de turnos (`app/admin-panel/admin/turnos/page.tsx`) ya:

- Leía `tenantId` y `tenantSlug` de la URL.
- Pasaba ese contexto a `useBookings` (métricas, creación de reservas) y a la llamada de stats.
- La API `GET /api/bookings` ya filtraba por tenant cuando recibía `tenantId` o `tenantSlug` en el query (para super admin).

Sin embargo, el **listado visible** (“Lista de Turnos y Reservas”) lo carga el componente **`AdminTurnos`**, que hace su **propio** `GET /api/bookings` **sin** enviar `tenantId` ni `tenantSlug`. Para un super admin sin esos parámetros, la API no aplica filtro y devuelve turnos de todos los tenants. Por eso se veían turnos de ambos clubs (por ejemplo metro-padel-360 y tenant por defecto).

---

## Resumen de cambios

1. **Componente `AdminTurnos`**  
   - Nuevas props opcionales: `tenantId` y `tenantSlug`.  
   - En el `useEffect` que carga la lista de turnos: se añade `tenantId` o `tenantSlug` a los query params del `GET /api/bookings`.  
   - En la exportación a CSV: se añade el mismo `tenantId` o `tenantSlug` al `GET /api/bookings` usado para obtener los datos a exportar.  
   - Las dependencias del `useEffect` incluyen `propTenantId` y `propTenantSlug` para recargar al cambiar de tenant.

2. **Página de turnos**  
   - Se pasa el contexto de tenant al componente:  
     `<AdminTurnos tenantId={tenantIdFromUrl} tenantSlug={tenantSlugFromUrl} />`

Con esto, cuando el super admin entra a Admin → Turnos con un tenant en la URL (por ejemplo `?tenantSlug=metro-padel-360` o `?tenantId=...`), tanto la lista como la exportación CSV quedan filtradas por ese tenant.

---

## Archivos modificados

| Archivo | Cambio |
|--------|--------|
| `components/AdminTurnos.tsx` | Props `tenantId` y `tenantSlug`; inclusión en params del fetch de lista y del fetch de exportación CSV; dependencias del `useEffect` de carga. |
| `app/admin-panel/admin/turnos/page.tsx` | Paso de `tenantId={tenantIdFromUrl}` y `tenantSlug={tenantSlugFromUrl}` a `<AdminTurnos />`. |

---

## Comportamiento esperado

- **Admin de un tenant**: sigue viendo solo los turnos de su tenant (la API usa `userTenantId` de sesión).  
- **Super Admin con tenant en URL**: ve solo los turnos del tenant indicado por `?tenantId=` o `?tenantSlug=`.  
- **Super Admin sin tenant en URL**: la página ya redirige con el tenant guardado en cookie (existente); tras la redirección, la lista y la exportación usan ese tenant.  
- **Exportar CSV**: respeta el mismo tenant que la lista (mismos query params hacia `GET /api/bookings`).

---

## Referencias

- Contexto de tenant en admin (cookie, redirección): [admin-canchas-contexto-tenant-2026-03.md](admin-canchas-contexto-tenant-2026-03.md).  
- API de reservas y filtro por tenant: `app/api/bookings/route.ts` (GET).  
- Pendientes pestaña Turnos: [admin-turnos-pendientes.md](../pasos/admin-turnos-pendientes.md).
