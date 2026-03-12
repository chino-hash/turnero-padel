# DOCUMENTO DE CAMBIOS NO DOCUMENTADOS - Turnero de Pádel

**Fecha de creación:** Enero 2026  
**Última actualización:** Marzo 2026

---

## 📋 ÍNDICE

1. [Implementación de Mercado Pago](#1-implementación-de-mercado-pago)
2. [Panel de Productos Administrativo](#2-panel-de-productos-administrativo)
3. [Carrito de Ventas Independiente](#3-carrito-de-ventas-independiente)
4. [Sistema de Extras para Turnos](#4-sistema-de-extras-para-turnos)
5. [Cambios en Búsqueda de Extras](#5-cambios-en-búsqueda-de-extras)
6. [Estilos y Tamaños de Turnos](#6-estilos-y-tamaños-de-turnos)
7. [Sección de Estadísticas](#7-sección-de-estadísticas)
8. [Script de Limpieza de Canchas](#8-script-de-limpieza-de-canchas)
9. [Recomendaciones](#9-recomendaciones)
10. [Fix Cerrar sesión en Vercel](#10-fix-cerrar-sesión-en-vercel)
11. [Pestaña Turnos (admin) - Plan completado](#11-pestaña-turnos-admin---plan-completado)
12. [Botones Terminar turno y Cancelar en Admin Turnos](#12-botones-terminar-turno-y-cancelar-en-admin-turnos)
13. [Super Admin: botón "Ir al sitio principal" a landing](#13-super-admin-botón-ir-al-sitio-principal-a-landing)

---

## 1. IMPLEMENTACIÓN DE MERCADO PAGO

### 📁 Archivos Principales

- `lib/services/payments/MercadoPagoProvider.ts` - Provider principal
- `lib/services/payments/MercadoPagoRefundService.ts` - Servicio de reembolsos
- `lib/services/payments/PaymentProviderFactory.ts` - Factory con detección automática
- `lib/services/payments/BookingWebhookHandler.ts` - Manejo de webhooks
- `app/api/webhooks/payments/route.ts` - Endpoint de webhooks

### ✅ Características Implementadas

#### Creación de Preferencias
- Integración con SDK oficial de Mercado Pago (`mercadopago@^2.11.0`)
- Creación de preferencias con expiración automática
- URLs de retorno configurables (success, failure, pending)
- Conversión automática de centavos a pesos (MP espera pesos)

#### Validación de Webhooks
- Validación de firmas con `MERCADOPAGO_WEBHOOK_SECRET`
- Cache en memoria para prevenir procesamiento duplicado
- Manejo de payloads de Mercado Pago (`{ type: 'payment', data: { id } }`)

#### Reembolsos
- Validación de límite de 180 días desde aprobación
- Verificación de saldo disponible
- Generación de claves de idempotencia para prevenir duplicados
- Manejo de errores específicos de Mercado Pago

#### Fallback Automático
- Si `MERCADOPAGO_ACCESS_TOKEN` no está configurado, usa `MockPaymentProvider`
- Logs informativos sobre qué provider se está usando

### 🔧 Variables de Entorno Requeridas

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret
PAYMENT_PROVIDER=mercadopago  # Opcional
```

### 📚 Documentación Relacionada

- `docs/VERIFICACION_MERCADOPAGO.md` - Verificación con documentación oficial
- `docs/GUIA_VERIFICACION_WEBHOOK.md` - Guía de verificación de webhooks

---

## 2. PANEL DE PRODUCTOS ADMINISTRATIVO

### 📍 Ubicación
`app/admin-panel/admin/productos/page.tsx`

### ✅ Funcionalidades Implementadas

#### Gestión CRUD Completa
- ✅ Crear productos nuevos
- ✅ Editar productos existentes
- ✅ Eliminar productos (con confirmación)
- ✅ Activar/desactivar productos

#### Categorías Disponibles
- Alquiler
- Pelotas
- Toallas
- Bebidas
- Snacks
- Otros

#### Características Especiales

**Campo de Volumen para Bebidas:**
- Input numérico para cantidad
- Selector de unidad (ml/L)
- Se agrega automáticamente al nombre: `"Bebida (500 ml)"`

**Control de Stock:**
- Indicadores de color:
  - Rojo: `stock === 0`
  - Amarillo: `stock <= 5`
  - Verde: `stock > 5`

**Filtros:**
- Búsqueda por nombre
- Filtro por categoría
- Productos filtrados en tiempo real

**Estadísticas Rápidas:**
- Total de productos
- Productos activos
- Stock bajo (≤5)
- Valor total del inventario

### 🎨 Estilos Aplicados

- **Header:** `text-3xl font-light` con línea naranja (`w-16 h-0.5 bg-orange-500`)
- **Colores por categoría:**
  - Bebidas: `bg-cyan-100 text-cyan-800`
  - Accesorios: `bg-purple-100 text-purple-800`
  - Equipamiento: `bg-blue-100 text-blue-800`
  - Consumibles: `bg-green-100 text-green-800`

---

## 3. CARRITO DE VENTAS INDEPENDIENTE

### 📍 Ubicación
`app/admin-panel/admin/productos/page.tsx` (Modal de ventas)

### ✅ Estado
**MIGRADO A VERSIÓN PRINCIPAL** - El sistema de ventas está completamente implementado y disponible en la versión principal del proyecto.

### 🎯 Propósito

**El carrito de ventas está diseñado para personas que compran productos pero NO juegan turnos.**

**Ejemplos de uso:**
- Cliente que viene solo a comprar un grip para su paleta
- Persona que compra pelotas sin reservar cancha
- Compra de accesorios sin estar asociada a ningún turno

### ✅ Funcionalidades

#### Modal de Ventas
- Botón "Ventas" en el header del panel de productos
- Búsqueda de productos por nombre (`busquedaVenta`)
- Lista de productos disponibles (activos y con stock)
- Selección de cantidad
- Método de pago: CASH, CARD, BANK_TRANSFER
- Campo de notas opcional

#### Procesamiento de Ventas
- Endpoint: `POST /api/ventas`
- Actualización automática de stock
- Registro de venta en base de datos con soporte multi-tenant
- Toast de confirmación
- Validación con Zod schema

#### Historial de Ventas
- Ruta: `app/admin-panel/admin/ventas/page.tsx`
- Tabla con todas las ventas realizadas
- Filtros por producto, método de pago, fecha
- Estadísticas: total ventas, productos vendidos, ingresos
- Exportación a CSV

### ⚠️ Importante: Diferencia con Extras

**Carrito de Ventas:**
- ✅ Para compras SIN turno
- ✅ Clientes que solo compran productos
- ✅ No se asocia a ningún turno
- ✅ Registro independiente en tabla de ventas

**Extras (ver sección 4):**
- ✅ Para jugadores DENTRO de un turno
- ✅ Productos agregados a turnos específicos
- ✅ Se asocian al turno y se incluyen en el total
- ✅ Pueden pagarse antes o después del turno

---

## 4. SISTEMA DE EXTRAS PARA TURNOS

### 📍 Ubicación
`components/AdminTurnos.tsx` - Modal de Extras

### 🎯 Propósito

**Los extras están diseñados para jugadores que están en un turno y quieren agregar productos adicionales.**

**Ejemplos de uso:**
- Jugador pide una bebida durante el turno
- Agregar pelotas extras al turno
- Alquiler de raqueta para el turno
- Snacks para los jugadores

### ✅ Funcionalidades

#### Modal de Extras
- Botón "Agregar Extra" en cada turno expandido
- Búsqueda de productos por nombre (barra de búsqueda)
- Selección de cantidad
- Asignación a jugadores específicos o todos
- Cálculo automático del costo total

#### Asignación de Extras
- **Todos los jugadores:** El costo se divide entre los 4 jugadores
- **Jugador específico:** Solo ese jugador paga el extra
- **Múltiples jugadores:** El costo se divide entre los seleccionados

#### Integración con Turnos
- Los extras se agregan al total del turno
- Aparecen en el resumen financiero del turno
- Se pueden pagar antes o después del turno
- Se incluyen en el cálculo de saldo pendiente

### 🔄 Sincronización con Productos

- Los productos se sincronizan con el panel de productos
- Fallback a 20 productos predefinidos si la API falla
- Mismos productos disponibles en ambos lugares

---

## 5. CAMBIOS EN BÚSQUEDA DE EXTRAS

### 📍 Ubicación
`components/AdminTurnos.tsx` - Modal de Extras

### ✅ Cambio Implementado

**ANTES:** Select dropdown con lista de productos  
**AHORA:** Barra de búsqueda con Input para escribir y filtrar productos

### 🔍 Funcionalidad

- Input de búsqueda en tiempo real
- Filtrado de productos por nombre mientras se escribe
- Lista de resultados filtrados
- Indicadores de disponibilidad (stock, activo/inactivo)

---

## 6. ESTILOS Y TAMAÑOS DE TURNOS

### 📍 Ubicación
`components/AdminTurnos.tsx`

### 🎨 Cambios en Tamaños

#### Cards de Turnos
- Padding: `p-6` en `CardContent`
- Espaciado entre turnos: `space-y-4`

#### Títulos y Textos
- Título de sección: `text-lg`
- Badges de estado: `text-xs`
- Nombres de cancha: `text-lg` con iconos `w-5 h-5`

#### Iconos
- Pequeños: `w-4 h-4` (botones, badges)
- Medianos: `w-5 h-5` (títulos, map pins)
- Grandes: `w-6 h-6` (estadísticas)

#### Botones
- Tamaño consistente: `size="sm"`
- Iconos en botones: `w-4 h-4 mr-1` o `mr-2`

### 🎨 Cambios en Colores

#### Secciones de Turnos

**TURNOS FIJOS:**
- Badge: `text-purple-700 bg-purple-50 border-purple-300`
- Chip "Fijo": `bg-purple-100 text-purple-800 border-purple-200`

**TURNOS CONFIRMADOS:**
- Badge: `text-green-700 bg-green-50 border-green-300`
- Estados: Colores verdes para confirmados

**EN CURSO:**
- Colores dinámicos según estado
- Temporizador visible

**COMPLETADOS:**
- Colores según estado de cierre
- Badge amarillo si está completado sin cerrar

#### Estados de Pago

**Pagado:**
- Botón: `bg-green-600 hover:bg-green-700 text-white`
- Chip: Colores verdes

**Pendiente:**
- Botón: `border-red-300 text-red-600 hover:bg-red-50`
- Chip: Colores rojos/amarillos

**Parcial:**
- Colores amarillos/amarillos oscuros

#### Resumen Financiero

- **Total original:** `text-blue-600/700`
- **Pagado:** `text-green-600/700`
- **Saldo pendiente:** `text-yellow-600/700` (dinámico según valor)

#### Cards de Estadísticas Rápidas

- Iconos con fondo: `p-2 bg-blue-100 rounded-lg`
- Texto principal: `text-2xl font-bold`
- Fondos de iconos:
  - Azul: `bg-blue-100`
  - Verde: `bg-green-100`
  - Púrpura: `bg-purple-100`

---

## 7. SECCIÓN DE ESTADÍSTICAS

### 📍 Ruta Recomendada: `/admin-panel/estadisticas`

**Archivo:** `app/admin-panel/estadisticas/page.tsx`

**Características:**
- ✅ Conectada a API real (`useEstadisticas` hook)
- ✅ Datos dinámicos desde `/api/estadisticas`
- ✅ Manejo de estados de carga y error
- ✅ Botón de actualización manual
- ✅ Gráficos de barras para canchas y horarios
- ✅ Resumen financiero con datos reales

**Métricas mostradas:**
- Reservas hoy
- Reservas semana
- Ingresos del mes
- Ocupación promedio
- Canchas más utilizadas
- Horarios pico
- Resumen de usuarios
- Resumen financiero

### 🔄 Cambio Realizado

**Ruta deprecada:** `/admin-panel/admin/estadisticas` (con datos mock)  
**Acción:** Redirigida automáticamente a `/admin-panel/estadisticas` (datos reales)

---

## 8. SCRIPT DE LIMPIEZA DE CANCHAS

### 📍 Ubicación
`cleanup-courts.js` (raíz del proyecto)  
`scripts/cleanup-courts.js` (versión en scripts)

### ✅ Funcionalidad

Script para identificar y desactivar canchas duplicadas en la base de datos.

#### Proceso
1. Agrupa canchas por nombre base (normaliza "Cancha 1", "A", "a" → "cancha 1")
2. Selecciona una cancha canónica:
   - Prioridad 1: Cancha activa con nombre exacto
   - Prioridad 2: Cancha con nombre exacto
   - Prioridad 3: Cancha más reciente con horarios válidos
   - Prioridad 4: Cancha más reciente
3. Desactiva automáticamente las demás duplicadas

#### Uso
```bash
node cleanup-courts.js
```

---

## 10. FIX CERRAR SESIÓN EN VERCEL (Marzo 2026)

El botón "Cerrar sesión" no funcionaba en producción (Vercel) aunque sí en local. Se corrigió eliminando la opción `domain` de la cookie de sesión de NextAuth en `lib/auth.ts`, para que la cookie se asocie al host de la petición y se borre correctamente en signOut.

**Documentación detallada:** `docs/actualizaciones/fix-signout-vercel-2026-03.md`

**Archivo modificado:** `lib/auth.ts` (opciones de la cookie `sessionToken`).

---

## 9. RECOMENDACIONES

### ✅ Completadas

1. ✅ **Unificar rutas de estadísticas**
   - Redirigida `/admin-panel/admin/estadisticas` → `/admin-panel/estadisticas`
   - Actualizada navegación del panel admin

### 🟡 Pendientes

2. **Documentar variables de entorno de Mercado Pago**
   - Agregar al README o documentación de despliegue
   - Incluir instrucciones de configuración

3. **Actualizar CHANGELOG.md**
   - Agregar todos estos cambios
   - Organizar por fecha y categoría

4. **Limpiar archivos temporales**
   - Eliminar `cleanup-courts.js` duplicado en raíz (mantener solo en scripts)
   - Eliminar `page.backup.tsx`
   - Eliminar `AdminTurnos.tsx.bak` y `.temp`

### 🟢 Futuras Mejoras

5. **Mejorar documentación de productos**
   - Documentar el flujo completo de ventas
   - Explicar claramente la diferencia entre extras y ventas

6. **Optimizar estilos de turnos**
   - Revisar consistencia de tamaños
   - Asegurar responsividad en móviles

---

## 11. PESTAÑA TURNOS (ADMIN) - PLAN COMPLETADO (Marzo 2026)

El plan "Admin Turnos Pendientes" fue implementado por completo. Incluye: toasts (sonner), botones Terminar turno / Cerrar turno, métricas reales (byDay, activeUsers, variación vs ayer), vinculación de usuario en nueva reserva (typeahead + get-or-create), paginación con filtros al API, exportación CSV, polling con Page Visibility y confirmación automática al pagar depósito (SystemSetting `depositConfirmPercent` por tenant).

**Documentación completa:** [actualizaciones/admin-turnos-pendientes-completado-2026-03.md](actualizaciones/admin-turnos-pendientes-completado-2026-03.md)

---

## 12. BOTONES TERMINAR TURNO Y CANCELAR EN ADMIN TURNOS (Marzo 2026)

Ajustes de visibilidad y habilitación de los botones **Terminar turno** y **Cancelar** en la pestaña Turnos del panel de administración.

### 📁 Archivo modificado

- `components/AdminTurnos.tsx`

### ✅ Cambios realizados

#### 1. Botón "Terminar turno"

- **Antes:** El botón se mostraba cuando la categoría del turno era `in_progress` (en curso) **o** `awaiting_completion` (ya pasó el horario sin cerrar). En ambos casos el estado del booking podía seguir mostrándose como "Confirmada" en la UI.
- **Ahora:** El botón **solo se muestra** cuando la categoría es exactamente `in_progress` (turno en curso: la hora actual está dentro del rango del turno).
- **Motivo:** Evitar que el admin pueda "Terminar turno" cuando el turno aún está solo confirmado y no ha empezado.

#### 2. Botón "Cancelar"

- **Antes:** El botón se habilitaba solo cuando la categoría era `confirmed` o `in_progress`. Si por zona horaria, parsing de fechas o normalización del `status` desde la API la categoría resultaba `other`, el botón quedaba deshabilitado aunque el turno se mostrara como "Confirmada".
- **Ahora:** El botón se habilita cuando la categoría es `confirmed` o `in_progress`, **o** cuando `booking.status === 'confirmado'`. Así, todo turno en estado confirmado permite cancelar aunque la categoría derivada no sea `confirmed`.
- **Motivo:** Garantizar que el admin pueda cancelar turnos confirmados en todos los casos.

### 🔧 Detalle técnico

- **Terminar turno:** `showTerminarTurno = cat === 'in_progress' && booking.status !== 'completado'`
- **Cancelar:** `isConfirmadoOrEnCurso = cat === 'confirmed' || cat === 'in_progress' || booking.status === 'confirmado'`; `disableCancel = !isConfirmadoOrEnCurso`

---

## 13. SUPER ADMIN: BOTÓN "IR AL SITIO PRINCIPAL" A LANDING (Marzo 2026)

El botón "Ir al sitio principal" (ícono Home) en el header del panel **Super Admin** navegaba a `/dashboard`, que no pertenece a ningún tenant. Se corrigió para que navegue a la **landing** (`/`).

- **Archivo:** `app/super-admin/components/SuperAdminLayoutContent.tsx`
- **Cambio:** `router.push('/dashboard')` → `router.push('/')`
- **Documentación detallada:** `docs/actualizaciones/super-admin-boton-landing-2026-03.md`

---

## 📝 NOTAS FINALES

- Todos estos cambios están implementados en el código local
- Verificar que estén aplicados en la versión de Vercel
- Algunos cambios pueden requerir rebuild en producción
- Las variables de entorno de Mercado Pago deben configurarse en Vercel

---

**Mantenido por:** Equipo de Desarrollo  
**Última revisión:** Marzo 2026






