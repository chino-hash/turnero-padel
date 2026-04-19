# Usuarios sin descuentos (abril 2026)

## Objetivo

Re-alinear la pestaña `Usuarios` a un alcance de analítica de clientes, dejando fuera toda lógica de descuentos para una fase posterior.

## Qué se removió

- Bloque `Programa de Descuentos` en la UI de Usuarios.
- Modal de configuración/edición de consumibles desde Usuarios.
- Llamadas desde la pantalla a:
  - `/api/consumibles`
  - `/api/admin/config/categorias-usuario`
- Campos de descuento en los contratos del módulo:
  - `descuento` en `clientesMasFrecuentes` de `/api/usuarios/analisis`
  - `discountPercent` en el listado de `/api/usuarios`

## Qué se mantiene

- KPIs (Total, Activos, Nuevos del mes, Retención).
- Nuevos vs Recurrentes.
- Valor Promedio por Cliente.
- Listado paginado con búsqueda y actividad.
- Ranking de clientes frecuentes.
- Soporte multitenant en contexto admin/super admin.

## Qué se difiere a fase posterior

- Configuración y aplicación de descuentos.
- Gestión de consumibles desde la pestaña Usuarios.
- Criterios y umbrales comerciales de categorías para beneficios.

## Archivos principales afectados

- `app/admin-panel/admin/usuarios/page.tsx`
- `hooks/useAnalisisUsuarios.ts`
- `hooks/useUsuariosList.ts`
- `app/api/usuarios/analisis/route.ts`
- `app/api/usuarios/route.ts`
- `docs/pasos/admin-usuarios-pendientes.md`
