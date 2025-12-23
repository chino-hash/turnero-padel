# Documentación - Panel de Gestión de Canchas

## Información General

**URL de Acceso:** `http://localhost:3000/admin/canchas`  
**Tipo de Página:** Panel de Administración  
**Autenticación Requerida:** Sí (Solo administradores)  
**Framework:** Next.js 14 con TypeScript  
**Fecha de Documentación:** Enero 2025

---

## Descripción General

El Panel de Gestión de Canchas es una interfaz administrativa que permite a los administradores del sistema gestionar completamente las canchas de pádel disponibles en la plataforma. Esta página proporciona funcionalidades CRUD (Crear, Leer, Actualizar, Desactivar) para la administración de canchas.

## Propósito y Objetivos

### Propósito Principal
- Centralizar la gestión de canchas de pádel en una interfaz intuitiva
- Permitir la configuración de precios y características de cada cancha
- Facilitar la activación/desactivación de canchas según disponibilidad
- Proporcionar una vista consolidada de todas las canchas del sistema

### Objetivos Específicos
- Gestión eficiente del inventario de canchas
- Control de precios dinámico por cancha
- Administración del estado operativo de las instalaciones
- Interfaz responsive para diferentes dispositivos

---

## Arquitectura y Tecnologías

### Stack Tecnológico
- **Frontend:** React 18 + Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **Base de Datos:** PostgreSQL con Prisma ORM
- **Autenticación:** NextAuth.js
- **Notificaciones:** Sonner (Toast notifications)
- **Iconografía:** Lucide React

### Estructura de Archivos
```
app/(admin)/admin/canchas/
├── page.tsx                 # Componente principal
app/api/courts/
├── route.ts                 # API endpoints (GET, POST, PUT)
lib/services/
├── courts.ts                # Servicios de lógica de negocio
components/ui/
├── card.tsx                 # Componente de tarjeta
├── button.tsx               # Componente de botón
├── input.tsx                # Componente de entrada
├── label.tsx                # Componente de etiqueta
└── switch.tsx               # Componente de interruptor
```

---

## Interfaz de Usuario

### Layout Principal

#### Header de Navegación
- **Botón "Volver":** Navegación hacia atrás con icono de flecha
- **Título de Página:** "Gestión de Canchas" (h1, texto grande y bold)
- **Botón "Agregar Cancha":** Acción primaria con icono "+"

#### Estructura Visual
- **Contenedor Principal:** Máximo ancho con padding responsivo
- **Espaciado:** Sistema de espaciado consistente (space-y-6)
- **Grid Responsivo:** 1 columna (móvil) → 2 columnas (tablet) → 3 columnas (desktop)

### Componentes de la Interfaz

#### 1. Formulario de Creación/Edición

**Ubicación:** Se muestra condicionalmente cuando `showAddForm = true`

**Campos del Formulario:**

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| **Nombre de la Cancha** | Input texto | Identificador único de la cancha | Requerido |
| **Precio Base ($)** | Input numérico | Precio base por turno completo | Requerido, > 0 |
| **Divisor** | Input numérico | Valor fijo "4" (solo lectura) | Fijo en 4 |
| **Estado** | Switch | Activa/Inactiva | Boolean |
| **Descripción** | Input texto | Información adicional opcional | Opcional |

**Características Especiales:**
- **Cálculo Automático:** Muestra "Precio por persona: $X.XX" (basePrice / 4)
- **Modo Edición:** Pre-llena campos con datos existentes
- **Validación en Tiempo Real:** Actualización inmediata del precio por persona

**Botones de Acción:**
- **Cancelar:** Resetea formulario y cierra modal
- **Crear/Actualizar:** Guarda datos y actualiza lista

#### 2. Lista de Canchas

**Visualización:** Grid de tarjetas responsivo

**Información por Tarjeta:**
- **Header:**
  - Nombre de la cancha (título)
  - Botón de edición (icono lápiz)
  - Switch de activación/desactivación

- **Contenido:**
  - **Precio Base:** Valor en pesos argentinos
  - **Precio por Persona:** Cálculo automático (basePrice × priceMultiplier / 4)
  - **Estado:** Activa (verde) / Inactiva (rojo)
  - **Descripción:** Si está disponible

**Estados Visuales:**
- **Cancha Activa:** Opacidad normal, colores estándar
- **Cancha Inactiva:** Opacidad reducida (60%), indicador visual claro

#### 3. Estado Vacío

**Condición:** Cuando `courts.length === 0`

**Contenido:**
- Mensaje: "No hay canchas registradas"
- Botón de acción: "Agregar Primera Cancha"
- Diseño centrado y minimalista

---

## Funcionalidades Principales

### 1. Visualización de Canchas

**Descripción:** Muestra todas las canchas registradas en el sistema

**Características:**
- **Carga Asíncrona:** Estado de loading durante la obtención de datos
- **Actualización Automática:** Refresh después de cada operación CRUD
- **Filtrado:** Solo muestra canchas activas en la API (lógica de negocio)
- **Ordenamiento:** Alfabético por nombre de cancha

**Flujo de Datos:**
```
Componente → fetchCourts() → GET /api/courts → getCourts() → Prisma → PostgreSQL
```

### 2. Creación de Canchas

**Trigger:** Click en botón "Agregar Cancha"

**Proceso:**
1. Muestra formulario vacío
2. Usuario completa campos requeridos
3. Validación en frontend
4. Envío a API POST /api/courts
5. Validación de permisos (solo admin)
6. Creación en base de datos
7. Actualización de lista
8. Notificación de éxito/error

**Validaciones:**
- Nombre no vacío
- Precio base > 0
- Sesión de administrador válida

### 3. Edición de Canchas

**Trigger:** Click en botón de edición (icono lápiz)

**Proceso:**
1. Pre-llena formulario con datos existentes
2. Permite modificación de campos
3. Muestra cálculo dinámico de precio por persona
4. Envío a API PUT /api/courts
5. Actualización en base de datos
6. Refresh de lista

**Campos Editables:**
- Nombre de la cancha
- Precio base
- Estado (activa/inactiva)
- Descripción

**Campo No Editable:**
- Divisor (fijo en 4)

### 4. Gestión de Estados

**Activación/Desactivación:**
- **Método:** Toggle switch en cada tarjeta
- **Efecto Inmediato:** Cambio visual instantáneo
- **Persistencia:** Actualización en base de datos
- **Feedback:** Toast notification de confirmación

**Estados Posibles:**
- **Activa:** Disponible para reservas, opacidad normal
- **Inactiva:** No disponible, opacidad reducida, indicador visual

---

## Integración con APIs

### Endpoints Utilizados

#### GET /api/courts
**Propósito:** Obtener lista de canchas  
**Autenticación:** Requerida  
**Respuesta:** Array de objetos Court  
**Manejo de Errores:** Toast de error + log en consola

#### POST /api/courts
**Propósito:** Crear nueva cancha  
**Autenticación:** Admin requerido  
**Payload:** Datos del formulario  
**Respuesta:** Objeto Court creado  
**Validaciones:** Permisos de admin + datos requeridos

#### PUT /api/courts
**Propósito:** Actualizar cancha existente  
**Autenticación:** Admin requerido  
**Payload:** ID + datos a actualizar  
**Respuesta:** Objeto Court actualizado  
**Casos de Uso:** Edición completa + toggle de estado

### Manejo de Errores

**Estrategia de Error Handling:**
- **Network Errors:** Try-catch con fallback
- **HTTP Errors:** Verificación de response.ok
- **User Feedback:** Toast notifications descriptivas
- **Logging:** Console.error para debugging
- **Graceful Degradation:** Estados de loading y error

---

## Lógica de Negocio

### Modelo de Datos - Court

```typescript
interface Court {
  id: string                    // UUID único
  name: string                  // Nombre identificatorio
  basePrice: number             // Precio base por turno
  priceMultiplier: number       // Multiplicador (default: 1)
  isActive: boolean             // Estado operativo
  description?: string          // Información adicional
  features?: string[]           // Características (futuro)
  operatingHours?: {            // Horarios de operación
    start: string
    end: string
    slot_duration: number
  }
}
```

### Cálculos de Precios

**Fórmula Principal:**
```
Precio por Persona = (basePrice × priceMultiplier) / 4
```

**Consideraciones:**
- **Divisor Fijo:** Siempre 4 (máximo jugadores por cancha)
- **Multiplicador:** Actualmente fijo en 1, preparado para variaciones futuras
- **Formato:** Dos decimales para visualización
- **Moneda:** Pesos argentinos (implícito)

### Reglas de Negocio

1. **Acceso Restringido:** Solo administradores pueden gestionar canchas
2. **Soft Delete:** Las canchas se desactivan, no se eliminan físicamente
3. **Validación de Precios:** Precio base debe ser mayor a 0
4. **Nombres Únicos:** Recomendado para evitar confusiones
5. **Estado por Defecto:** Nuevas canchas se crean activas

---

## Flujos de Usuario

### Flujo 1: Crear Nueva Cancha

```
1. Admin accede a /admin/canchas
2. Click en "Agregar Cancha"
3. Completa formulario:
   - Nombre: "Cancha 3"
   - Precio Base: 8000
   - Estado: Activa
   - Descripción: "Cancha techada"
4. Click en "Crear"
5. Sistema valida datos
6. Crea registro en BD
7. Actualiza lista
8. Muestra toast de éxito
9. Formulario se cierra
```

### Flujo 2: Editar Cancha Existente

```
1. Admin localiza cancha en lista
2. Click en botón de edición
3. Formulario se pre-llena con datos actuales
4. Modifica precio base: 8000 → 9000
5. Ve actualización automática: "Precio por persona: $2250.00"
6. Click en "Actualizar"
7. Sistema procesa cambios
8. Lista se actualiza con nuevos valores
9. Toast confirma actualización
```

### Flujo 3: Desactivar Cancha

```
1. Admin identifica cancha a desactivar
2. Click en switch de estado
3. Cancha cambia visualmente (opacidad reducida)
4. Sistema actualiza BD
5. Toast confirma: "Cancha deshabilitada"
6. Cancha permanece visible pero marcada como inactiva
```

---

## Consideraciones Técnicas

### Rendimiento

**Optimizaciones Implementadas:**
- **Estado Local:** Minimiza re-renders innecesarios
- **Fetch Condicional:** Solo recarga después de cambios
- **Lazy Loading:** Formulario se monta condicionalmente
- **Debouncing:** En inputs numéricos (implícito en onChange)

**Métricas Objetivo:**
- Tiempo de carga inicial: < 2 segundos
- Respuesta a interacciones: < 500ms
- Actualización de lista: < 1 segundo

### Seguridad

**Medidas Implementadas:**
- **Autenticación:** NextAuth.js con verificación de sesión
- **Autorización:** Verificación de rol admin en cada endpoint
- **Validación:** Frontend + backend para datos de entrada
- **Sanitización:** Prisma ORM previene SQL injection
- **HTTPS:** Requerido en producción

**Vulnerabilidades Mitigadas:**
- Acceso no autorizado
- Manipulación de datos
- Inyección de código
- Cross-site scripting (XSS)

### Escalabilidad

**Preparación para Crecimiento:**
- **Paginación:** Preparado para implementar cuando sea necesario
- **Filtros:** Estructura permite agregar búsqueda y filtrado
- **Caching:** Compatible con estrategias de cache
- **API Versioning:** Estructura permite versionado futuro

---

## Testing y Calidad

### Estrategia de Testing

**Niveles de Testing:**
1. **Unit Tests:** Funciones de utilidad y cálculos
2. **Integration Tests:** APIs y servicios
3. **E2E Tests:** Flujos completos de usuario
4. **Visual Tests:** Consistencia de UI

**Herramientas:**
- Jest + React Testing Library
- Cypress para E2E
- Playwright para cross-browser

### Casos de Prueba Críticos

**Funcionalidad:**
- ✅ Creación de cancha con datos válidos
- ✅ Validación de campos requeridos
- ✅ Cálculo correcto de precio por persona
- ✅ Activación/desactivación de canchas
- ✅ Manejo de errores de red

**UI/UX:**
- ✅ Responsividad en diferentes dispositivos
- ✅ Estados de loading y error
- ✅ Feedback visual inmediato
- ✅ Navegación intuitiva

---

## Monitoreo y Mantenimiento

### Métricas de Monitoreo

**Técnicas:**
- Tiempo de respuesta de APIs
- Tasa de errores por endpoint
- Uso de memoria del componente
- Frecuencia de operaciones CRUD

**Funcionales:**
- Número de canchas activas/inactivas
- Frecuencia de cambios de precios
- Patrones de uso por administrador

### Mantenimiento Preventivo

**Tareas Regulares:**
- Revisión de logs de error
- Optimización de consultas de BD
- Actualización de dependencias
- Backup de configuraciones

**Indicadores de Alerta:**
- Tiempo de respuesta > 3 segundos
- Tasa de error > 5%
- Memoria utilizada > 100MB
- Fallos de autenticación frecuentes

---

## Roadmap y Mejoras Futuras

### Corto Plazo (1-3 meses)

**Funcionalidades:**
- [ ] Búsqueda y filtrado de canchas
- [ ] Ordenamiento personalizable
- [ ] Exportación de datos a CSV/Excel
- [ ] Historial de cambios de precios

**Mejoras Técnicas:**
- [ ] Implementar paginación
- [ ] Optimizar queries con índices
- [ ] Agregar tests automatizados
- [ ] Mejorar manejo de errores

### Mediano Plazo (3-6 meses)

**Nuevas Características:**
- [ ] Gestión de horarios por cancha
- [ ] Configuración de características especiales
- [ ] Sistema de notificaciones
- [ ] Dashboard de analytics

**Integraciones:**
- [ ] Sistema de reservas avanzado
- [ ] Integración con pagos
- [ ] API pública para terceros
- [ ] Sincronización con sistemas externos

### Largo Plazo (6+ meses)

**Evolución del Sistema:**
- [ ] Multi-tenancy para múltiples clubes
- [ ] IA para optimización de precios
- [ ] App móvil nativa
- [ ] Sistema de reportes avanzados

---

## Conclusiones

El Panel de Gestión de Canchas representa una solución robusta y escalable para la administración de instalaciones deportivas. Su diseño modular, implementación con tecnologías modernas y enfoque en la experiencia del usuario lo posicionan como una herramienta eficiente para administradores.

### Fortalezas Principales
- **Interfaz Intuitiva:** Diseño limpio y fácil de usar
- **Funcionalidad Completa:** CRUD completo con validaciones
- **Arquitectura Sólida:** Separación clara de responsabilidades
- **Seguridad Robusta:** Autenticación y autorización apropiadas
- **Escalabilidad:** Preparado para crecimiento futuro

### Áreas de Oportunidad
- Implementación de búsqueda y filtros
- Optimización de rendimiento para grandes volúmenes
- Expansión de funcionalidades de reporting
- Mejora en la experiencia móvil

Esta documentación sirve como referencia completa para desarrolladores, administradores y stakeholders involucrados en el mantenimiento y evolución del sistema.

---

**Documento generado:** Enero 2025  
**Versión:** 1.0  
**Autor:** Sistema de Documentación Automática  
**Próxima revisión:** Marzo 2025