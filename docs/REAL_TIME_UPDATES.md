# Sistema de Actualizaciones en Tiempo Real

Este documento describe el sistema de actualizaciones en tiempo real implementado en el Turnero de Pádel usando Server-Sent Events (SSE).

## Características

- **Notificaciones automáticas**: Los usuarios reciben actualizaciones instantáneas cuando se realizan cambios en el sistema
- **Sincronización de datos**: Los datos se actualizan automáticamente sin necesidad de recargar la página
- **Notificaciones visuales**: Sistema de notificaciones que informa sobre los cambios
- **Reconexión automática**: El sistema se reconecta automáticamente si se pierde la conexión

## Componentes Principales

### 1. Endpoint SSE (`/api/events`)

El endpoint principal que maneja las conexiones Server-Sent Events:

- **Ubicación**: `app/api/events/route.ts`
- **Funcionalidad**: Mantiene conexiones activas y emite eventos a todos los clientes conectados
- **Tipos de eventos**: `courts_updated`, `bookings_updated`, `slots_updated`, `admin_change`

### 2. Hook de Tiempo Real (`useRealTimeUpdates`)

- **Ubicación**: `hooks/useRealTimeUpdates.ts`
- **Funcionalidad**: Maneja la conexión SSE del lado del cliente
- **Características**:
  - Reconexión automática con backoff exponencial
  - Manejo de errores robusto
  - Callbacks para diferentes tipos de eventos

### 3. Hook del Dashboard (`useDashboardRealTimeUpdates`)

- **Ubicación**: `hooks/useRealTimeUpdates.ts`
- **Funcionalidad**: Hook específico para el dashboard que integra todas las actualizaciones
- **Características**:
  - Refresco automático de datos
  - Notificaciones visuales
  - Control de habilitación/deshabilitación

### 4. Componente de Notificaciones (`RealTimeNotification`)

- **Ubicación**: `components/ui/RealTimeNotification.tsx`
- **Funcionalidad**: Muestra notificaciones visuales de las actualizaciones
- **Características**:
  - Diferentes tipos de notificación (info, success, warning, error)
  - Auto-ocultado después de 5 segundos
  - Indicador de estado de conexión

## Configuración

### Variables de Entorno

```env
# Habilitar actualizaciones en tiempo real en desarrollo
NEXT_PUBLIC_ENABLE_REALTIME=true
```

### Uso en Componentes

```tsx
import { useDashboardRealTimeUpdates } from '@/hooks/useRealTimeUpdates'

function MyComponent() {
  const { isConnected } = useDashboardRealTimeUpdates({
    enabled: true, // opcional, por defecto true
    onDataUpdate: () => {
      // Lógica para refrescar datos
    },
    onNotification: (message, type) => {
      // Lógica para mostrar notificaciones
    }
  })

  return (
    <div>
      {isConnected ? 'Conectado' : 'Desconectado'}
    </div>
  )
}
```

## Emisión de Eventos

### Desde APIs

```tsx
import { eventEmitters } from '@/app/api/events/route'

// En cualquier API route
export async function POST() {
  // ... lógica de la API ...
  
  // Emitir evento después de cambios
  eventEmitters.bookingsUpdated({ 
    message: 'Nueva reserva creada',
    bookingId: newBooking.id 
  })
  
  return Response.json({ success: true })
}
```

### Tipos de Eventos Disponibles

- `eventEmitters.courtsUpdated(data)` - Cambios en canchas
- `eventEmitters.bookingsUpdated(data)` - Cambios en reservas
- `eventEmitters.slotsUpdated(data)` - Cambios en horarios
- `eventEmitters.adminChange(data)` - Cambios administrativos

## APIs que Emiten Eventos

### Reservas
- `POST /api/bookings` - Emite `bookingsUpdated` y `slotsUpdated`
- `PATCH /api/bookings/[id]` - Emite `bookingsUpdated` y `slotsUpdated` (cancelación)

### Administración
- `POST /api/admin/courts` - Emite `courtsUpdated`
- `PUT /api/admin/courts/[id]` - Emite `courtsUpdated`
- `DELETE /api/admin/courts/[id]` - Emite `courtsUpdated`
- `POST /api/admin/slots` - Emite `slotsUpdated`
- `PUT /api/admin/slots/[id]` - Emite `slotsUpdated`
- `DELETE /api/admin/slots/[id]` - Emite `slotsUpdated`

## Desarrollo

### Habilitar en Desarrollo

Por defecto, las actualizaciones en tiempo real están deshabilitadas en desarrollo para evitar problemas con hot-reload. Para habilitarlas:

```env
NEXT_PUBLIC_ENABLE_REALTIME=true
```

### Debugging

El sistema incluye logs detallados en la consola:

- Conexiones SSE
- Eventos recibidos
- Errores de conexión
- Intentos de reconexión

### Consideraciones de Rendimiento

- Las conexiones SSE se mantienen abiertas
- Heartbeat cada 30 segundos para mantener la conexión
- Reconexión automática con backoff exponencial
- Limpieza automática de conexiones cerradas

## Producción

En producción, las actualizaciones en tiempo real están habilitadas por defecto. Asegúrate de que:

- El servidor soporte conexiones persistentes
- Los proxies/load balancers estén configurados para SSE
- Las conexiones WebSocket/SSE no sean bloqueadas por firewalls

## Troubleshooting

### Conexiones que se Cierran Inmediatamente

- Verificar configuración de proxy/servidor
- Revisar logs del servidor
- Comprobar variables de entorno

### Eventos No se Reciben

- Verificar que las APIs emitan eventos correctamente
- Comprobar la conexión SSE en las herramientas de desarrollador
- Revisar logs de la consola

### Múltiples Conexiones

- Asegurar que el hook se use correctamente
- Verificar que no haya múltiples instancias del provider
- Comprobar la lógica de cleanup en useEffect