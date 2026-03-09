# Índice de Documentación - Proyecto Turnero de Pádel

## Estructura de carpetas

| Carpeta | Contenido |
|---------|-----------|
| [project/](./project/) | Visión general, resúmenes ejecutivos, estructura del proyecto |
| [standards/](./standards/) | Estándares de documentación y políticas del frontend |
| [specs/](./specs/) | Especificaciones de features (Mis Turnos, Panel de Inicio, interfaces) |
| [admin/](./admin/) | Documentación de funcionalidades del panel admin (turnos, canchas) |
| [actualizaciones/](./actualizaciones/) | Changelog detallado por fecha de cambios |
| [changelog/](./changelog/) | Changelogs y resúmenes de cambios técnicos |
| [multitenant/](./multitenant/) | Arquitectura multitenant, rollback, APIs, super admin |
| [analisis/](./analisis/) | Análisis y diseño (frontend, migraciones, pruebas, refactors) |
| [testing/](./testing/) | Pruebas automatizadas, Playwright, funcionamiento |
| [deployment/](./deployment/) | Vercel, Docker, variables de entorno |
| [troubleshooting/](./troubleshooting/) | Soluciones a errores conocidos (OAuth, Vercel, scroll, etc.) |
| [architecture/](./architecture/) | Arquitectura del sistema, base de datos, flujos |
| [apis/](./apis/) | Referencia de endpoints de la API |
| [api/](./api/) | Referencia general de la API |
| [components/](./components/) | Documentación de componentes React |
| [guides/](./guides/) | Guías de desarrollo, instalación, despliegue, contribución |
| [hooks/](./hooks/) | Documentación de hooks personalizados |
| [migraciones/](./migraciones/) | Migraciones de base de datos y cuenta |
| [pasos/](./pasos/) | Pendientes por pestaña del panel admin |
| [plans/](./plans/) | Planes completados (ej. admin canchas) |
| [plan de mejoras admin/](./plan%20de%20mejoras%20admin/) | Plan de mejoras del área de turnos |
| [seguridad/](./seguridad/) | Auditoría y mejores prácticas de seguridad |
| [services/](./services/) | Documentación de servicios |
| [templates/](./templates/) | Plantillas para documentar componentes, APIs, hooks, servicios |
| [maintenance/](./maintenance/) | Mantenimiento, checklist, automatizaciones |

---

## Análisis y diseño

- [Análisis del Frontend Actual](./analisis/01-analisis-frontend-actual.md)
- [Migración SQLite → PostgreSQL](./analisis/06-migracion-sqlite-postgresql.md)
- [Mejora de la Documentación Interna](./analisis/07-mejora-documentacion-interna.md)
- [Implementación de Pruebas Automatizadas](./analisis/08-implementacion-pruebas-automatizadas.md)
- [Análisis de Mejoras UI Frontend](./analisis/09-analisis-frontend-mejoras-ui.md)
- [Cambios Frontend - Parte 1](./analisis/10-frontend-cambios-1.markdown)
- [Refactorización de Componentes - Resumen](./analisis/11-refactorizacion-componentes-resumen.md)
- [Análisis Carpeta Turnero-Padel](./analisis/ANALISIS_CARPETA_TURNERO-PADEL.md)

## Multitenant y super admin

- **[Arquitectura Multitenant](./multitenant/MULTITENANT_COMPLETE.md)** - ⭐ Documentación completa del sistema multitenant
- [Rollback Multitenant](./multitenant/ROLLBACK_MULTITENANT.md)
- [Revisión APIs Multitenant](./multitenant/REVISION_APIS_MULTITENANT.md)
- [Revisión Panel Super Admin](./multitenant/REVISION_SUPER_ADMIN_PANEL.md)
- [Bootstrap Tenant y Pagos](./multitenant/BOOTSTRAP_TENANT_Y_PAGOS.md)
- [MercadoPago Multitenant Rollback](./multitenant/MERCADOPAGO_MULTITENANT_ROLLBACK.md)

## Especificaciones e implementaciones

- [Implementación de Horarios Reservados](./specs/documentacion-implementacion-horarios-reservados.md)
- [Corrección de Posicionamiento - Sección Turnos](./specs/documentacion-implementacion-posicionamiento-turnos.md)
- **[Documentación Refactorización 2026](./changelog/DOCUMENTACION-REFACTORIZACION-CAMBIOS-2026.md)** - ⭐ Auth middleware, Auth.js v5, hooks, TurneroAppServer
- [Especificación Mis Turnos](./specs/mis-turnos-especificacion.md)
- [Especificación Panel de Inicio](./specs/panel-inicio-especificacion.md)
- [Resumen de Cambios Técnicos](./changelog/resumen-cambios-tecnicos.md)
- [Interfaces del frontend](./specs/frontend-interfaces-index.md) / [Reporte](./specs/frontend-interfaces-report.md) / [Especificación técnica](./specs/technical-interfaces-specification.md)

## Panel admin

- [Funcionalidad Completa Admin Turnos](./admin/admin-turnos-funcionalidad-completa.md)
- [Turnos pendientes: bloqueo temporal y expiración](./admin/turnos-pendientes-bloqueo-temporal-y-expiracion.md)
- [Documentación Admin Canchas](./admin/admin-canchas-documentacion.md)
- [Admin Turnos 13-11-2025](./admin/admin-turnos-13-11-2025.md)
- Detalle por fecha: [actualizaciones/](./actualizaciones/) (ej. admin-turnos-cerrados-colapsable-limpieza-2026-03, admin-turnos-una-pagina-sin-paginacion-2026-03, etc.)

## Despliegue y configuración

- [Guía Completa Configuración Vercel](./deployment/GUIA_CONFIGURACION_VERCEL_COMPLETA.md)
- [Variables de entorno](./deployment/VARIABLES_ENTORNO.md)
- [Diferencias local vs Vercel](./deployment/DIFERENCIAS_LOCAL_VS_VERCEL.md)
- [Troubleshooting: Error 400 OAuth](./troubleshooting/analisis-error-400-oauth.md)

## Proyecto y visión general

- [Resumen Ejecutivo](./project/RESUMEN_EJECUTIVO_PROYECTO.md)
- [Resumen Proyecto Turnero Padel](./project/RESUMEN_PROYECTO_TURNERO_PADEL.md)
- [Estructura del Proyecto](./project/ESTRUCTURA_PROYECTO.md)
- [Documentación Completa](./project/DOCUMENTACION_COMPLETA.md)
- [Lo siguiente que hacer](./project/lo-siguiente-que-hacer.md)
- [Proyecto turnero](./project/proyecto%20turnero.md)

## Cómo usar esta documentación

1. Revisar este índice para tener una visión general.
2. Entrar en la carpeta que corresponda (project, admin, deployment, etc.).
3. Para onboarding: [project/](./project/), [architecture/](./architecture/), [guides/](./guides/).
4. Para tareas pendientes del admin: [pasos/](./pasos/README.md).

## Contribución a la documentación

1. Actualizar los documentos existentes cuando haya cambios significativos.
2. Añadir nuevos documentos en la carpeta que corresponda.
3. Mantener este índice actualizado.
4. Seguir los [Estándares de Documentación](./standards/DOCUMENTATION-STANDARDS.md).
