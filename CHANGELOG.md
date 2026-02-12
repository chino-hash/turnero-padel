# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2026-02-12] - Limpieza: eliminación de subcarpeta turnero-padel

### Removido
- **Subcarpeta `turnero-padel/`** eliminada del repositorio.
  - Contenía la versión antigua single-tenant, incompatible con el modelo multi-tenant y la base de datos actual.
  - Incluía app, components, APIs, tests (Jest/Cypress), documentación y configuraciones obsoletas.

### Agregado
- **Análisis de usuarios con datos reales:** portados a la raíz `app/api/usuarios/analisis/route.ts` y `hooks/useAnalisisUsuarios.ts` (adaptados a multi-tenant); página admin de usuarios puede usar datos dinámicos.

### Cambiado
- **Scripts:** `bootstrap-tenant.js` y referencias solo a variables de entorno de la raíz (`.env`, `.env.local`); sin fallback a `turnero-padel/`.
- **tsconfig.json:** eliminado `turnero-padel` de `exclude`; el proyecto compila únicamente desde la raíz.

### Documentación
- Añadido `docs/LIMPIEZA_TURNERO_PADEL_2026-02.md` con el resumen de la limpieza.
- Mantenido `docs/ANALISIS_CARPETA_TURNERO-PADEL.md` como referencia del análisis previo.

---

## [2026-01-XX] - Cambios No Documentados Consolidados

### Agregado
- **Implementación completa de Mercado Pago**
  - Provider de Mercado Pago con SDK oficial (`mercadopago@^2.11.0`)
  - Servicio de reembolsos con validación de límite de 180 días
  - Validación de webhooks con firma secreta
  - Cache en memoria para prevenir procesamiento duplicado
  - Fallback automático a MockPaymentProvider si no está configurado
- **Panel de Productos Administrativo**
  - Gestión CRUD completa de productos
  - Campo de volumen para bebidas (ml/L)
  - Control de stock con indicadores de color
  - Filtros por categoría y búsqueda
  - Estadísticas rápidas (total, activos, stock bajo, valor inventario)
- **Carrito de Ventas Independiente**
  - Modal de ventas para compras sin turno
  - Historial de ventas con filtros y exportación CSV
  - Sistema separado de extras (para compras sin asociación a turnos)
- **Sistema de Extras para Turnos**
  - Modal de extras con búsqueda por barra de texto
  - Asignación de extras a jugadores específicos o todos
  - Integración con resumen financiero de turnos
- **Script de Limpieza de Canchas**
  - Identificación y desactivación automática de canchas duplicadas
  - Normalización de nombres (Cancha 1, A, a → "cancha 1")
  - Selección inteligente de cancha canónica

### Cambiado
- **Búsqueda de Extras**
  - Reemplazado Select dropdown por barra de búsqueda con Input
  - Filtrado en tiempo real mientras se escribe
- **Estilos y Tamaños de Turnos**
  - Tamaños consistentes: cards `p-6`, iconos `w-4/w-5/w-6`, botones `size="sm"`
  - Colores diferenciados por sección (Fijos: púrpura, Confirmados: verde, etc.)
  - Resumen financiero con colores dinámicos según estado
- **Rutas de Estadísticas**
  - Redirigida `/admin-panel/admin/estadisticas` (datos mock) → `/admin-panel/estadisticas` (datos reales)
  - Unificación en una sola ruta con datos dinámicos desde API

### Mejorado
- **Panel de Productos**
  - Sincronización con modal de extras de turnos
  - Fallback a productos predefinidos si la API falla
  - Indicadores visuales de stock y estado
- **Documentación**
  - Creado documento completo de cambios no documentados (`docs/CAMBIOS_NO_DOCUMENTADOS_2026.md`)
  - Aclaración de diferencia entre carrito de ventas y extras

### Archivos Modificados
- `lib/services/payments/MercadoPagoProvider.ts` - Provider principal
- `lib/services/payments/MercadoPagoRefundService.ts` - Servicio de reembolsos
- `app/admin-panel/admin/productos/page.tsx` - Panel de productos y ventas
- `app/admin-panel/admin/ventas/page.tsx` - Historial de ventas
- `components/AdminTurnos.tsx` - Modal de extras con búsqueda
- `app/admin-panel/admin/estadisticas/page.tsx` - Redirección a ruta con datos reales
- `cleanup-courts.js` - Script de limpieza de canchas duplicadas

### Variables de Entorno Agregadas
- `MERCADOPAGO_ACCESS_TOKEN` - Token de acceso de Mercado Pago
- `MERCADOPAGO_WEBHOOK_SECRET` - Secret para validación de webhooks
- `PAYMENT_PROVIDER=mercadopago` - Opcional, para forzar uso de Mercado Pago

---

## [2025-01-XX] - Corrección de Posicionamiento UI

### Corregido
- Posicionamiento de títulos y navegación en sección "Mis Turnos"
- Elementos de UI ocultos por navbar fijo con z-index alto
- Centrado de títulos y descripción en componente MisTurnos

### Mejorado
- Visibilidad completa de elementos de navegación
- Experiencia de usuario en sección de gestión de turnos
- Layering y posicionamiento de componentes UI

### Agregado
- Horarios reservados de ejemplo para visualización de slots ocupados
- Documentación detallada del proceso de implementación
- Resumen técnico de cambios para desarrolladores
- Documentación específica de corrección de posicionamiento

### Cambiado
- Optimización del navbar para reducir espacios en blanco excesivos
- Mejora en la compacidad visual del header de la aplicación
- Distribución de horarios reservados por cancha específica
- Padding superior en contenedor principal de MisTurnos
- Estructura de header de navegación con centrado mejorado

## [2025-01-XX] - Corrección de Posicionamiento UI

### Corregido
- **Posicionamiento de títulos**: Elementos de navegación y títulos ocultos por navbar fijo
- **Z-index conflicts**: Conflictos de layering entre navbar y contenido principal
- **Centrado de elementos**: Alineación inconsistente en header de MisTurnos

### Cambiado
- **Contenedor MisTurnos**: Agregado `pt-16 sm:pt-20` para compensar navbar fijo
- **Header de navegación**: Incorporado `justify-center` y `relative z-20`
- **Títulos y descripción**: Aplicado `text-center flex-1` para centrado óptimo

### Archivos Modificados
- `components/MisTurnos.tsx` - Corrección de posicionamiento y centrado

### Técnico
- **Padding superior**: 64px móvil, 80px desktop
- **Z-index management**: Layering correcto con `z-20`
- **Flexbox centering**: Centrado horizontal y distribución de espacio
- **Responsive design**: Breakpoints `sm:` mantenidos

### Testing
- ✅ Elementos visibles en todos los tamaños de pantalla
- ✅ Navegación "Volver" completamente funcional
- ✅ Títulos centrados y legibles
- ✅ Compatibilidad con modo oscuro
- ✅ Sin regresiones en funcionalidad existente

---

## [2025-01-XX] - Implementación de Horarios Reservados

### Agregado
- **Horarios reservados globales**: 6 slots de ejemplo (`09:00`, `10:30`, `14:00`, `16:30`, `18:00`, `19:30`)
- **Horarios por cancha específica**:
  - Cancha 1: `09:00`, `13:30`, `16:30`
  - Cancha 2: `10:00`, `14:00`, `17:00`  
  - Cancha 3: `11:30`, `14:30`, `16:00`
- Documentación completa en `/docs/documentacion-implementacion-horarios-reservados.md`
- Resumen técnico en `/docs/resumen-cambios-tecnicos.md`

### Cambiado
- **Función `generateTimeSlots()`**: Incorpora lógica de slots reservados
- **Función `generateUnifiedSlots()`**: Maneja reservas específicas por cancha
- **Navbar padding**: Reducido de `py-3 sm:py-4` a `py-2 sm:py-3`
- **Secciones del navbar**: Padding vertical reducido a `py-1 sm:py-1.5`

### Archivos Modificados
- `turnero-padel/padel-booking.tsx` - Optimización del navbar
- `turnero-padel/components/providers/AppStateProvider.tsx` - Horarios reservados

### Técnico
- **Reducción de padding**: ~25% en componentes del navbar
- **Slots de ejemplo**: 9 horarios distribuidos estratégicamente
- **Compatibilidad**: Mantiene 100% de funcionalidad existente
- **Performance**: Sin impacto negativo en rendimiento

### Testing
- ✅ Verificación visual en `http://localhost:3000`
- ✅ Funcionalidad de botones de reserva
- ✅ Estados visuales diferenciados (disponible/ocupado)
- ✅ Responsividad en múltiples dispositivos
- ✅ Navegación entre canchas

### Notas de Desarrollo
- Los cambios son retrocompatibles
- No se requieren migraciones de base de datos
- La implementación es compatible con la arquitectura existente
- Preparado para futura integración con datos reales

---

## Formato de Entradas

### Tipos de Cambios
- **Agregado** para nuevas funcionalidades
- **Cambiado** para cambios en funcionalidades existentes  
- **Deprecado** para funcionalidades que serán removidas
- **Removido** para funcionalidades removidas
- **Corregido** para corrección de bugs
- **Seguridad** para vulnerabilidades

### Estructura de Versiones
- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Funcionalidad agregada de manera compatible
- **PATCH**: Correcciones de bugs compatibles

---

**Mantenido por:** Equipo de Desarrollo  
**Última actualización:** Enero 2026