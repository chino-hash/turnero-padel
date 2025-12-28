# Tests Automatizados - Turnero de Pádel

## Playwright E2E Tests

Este directorio contiene los tests end-to-end (E2E) automatizados para la aplicación Turnero de Pádel, implementados con Playwright.

### Estructura de Tests

```
tests/
├── e2e/
│   ├── home.spec.ts          # Tests de la página principal
│   ├── components.spec.ts    # Tests de componentes refactorizados
│   └── booking.spec.ts       # Tests del sistema de reservas
└── README.md                 # Este archivo
```

### Descripción de Tests

#### 1. `home.spec.ts` - Tests de Página Principal
- ✅ Carga correcta de la página
- ✅ Visualización de secciones principales
- ✅ Mostrar horarios disponibles
- ✅ Navegación entre secciones
- ✅ Responsividad móvil
- ✅ Manejo de errores de carga

#### 2. `components.spec.ts` - Tests de Componentes Refactorizados
- ✅ **HomeSection Component**: Renderizado, días disponibles, selección de horarios, filtrado
- ✅ **MisTurnos Component**: Sección de turnos, estado vacío
- ✅ **Integración**: Navegación fluida, mantenimiento de estado

#### 3. `booking.spec.ts` - Tests del Sistema de Reservas
- ✅ **Flujo de Reserva**: Horarios disponibles, selección, información del slot
- ✅ **Filtros y Navegación**: Filtrado por disponibilidad, navegación entre días, múltiples canchas
- ✅ **Manejo de Errores**: Errores de carga, slots no disponibles
- ✅ **Responsividad**: Funcionalidad móvil, elementos touch-friendly

### Comandos Disponibles

```bash
# Ejecutar todos los tests
npm run test:playwright

# Ejecutar tests con interfaz visual
npm run test:playwright:ui

# Ejecutar tests y generar reporte HTML
npm run test:playwright:report

# Ejecutar tests en modo headed (ver navegador)
npm run test:playwright:headed

# Ejecutar todos los tipos de tests
npm run test:all
```

### Configuración

Los tests están configurados en `playwright.config.ts` con:

- **Navegadores**: Chromium, Firefox, WebKit
- **Dispositivos**: Desktop y Mobile (iPhone, Android)
- **Servidor**: Automáticamente inicia el servidor de desarrollo en `http://localhost:3000`
- **Reportes**: HTML report disponible en `http://localhost:9323`
- **Capturas**: Screenshots y videos en caso de fallos
- **Trazas**: Habilitadas para debugging

### Características de los Tests

#### Robustez
- Tests diseñados para ser resilientes a cambios en la UI
- Múltiples selectores de fallback para elementos
- Timeouts apropiados para carga de contenido dinámico
- Manejo de estados de carga y error

#### Cobertura
- Tests de funcionalidad principal (reservas, navegación)
- Tests de componentes refactorizados (HomeSection, MisTurnos)
- Tests de responsividad y accesibilidad móvil
- Tests de manejo de errores y estados edge case

#### Mejores Prácticas
- Uso de `data-testid` cuando está disponible
- Selectores semánticos y accesibles
- Tests independientes y aislados
- Verificación de estados visuales y funcionales

### Resolución de Problemas

#### Tests Fallando
1. Verificar que el servidor de desarrollo esté corriendo
2. Revisar los logs en la terminal
3. Abrir el reporte HTML para detalles visuales
4. Ejecutar en modo headed para debugging visual

#### Errores Comunes
- **Timeout**: Aumentar timeouts si la aplicación es lenta
- **Elementos no encontrados**: Verificar selectores en la aplicación
- **Servidor no disponible**: Asegurar que `npm run dev` esté corriendo

### Mantenimiento

Los tests están diseñados para ser mantenibles:
- Selectores flexibles que se adaptan a cambios de UI
- Estructura modular por funcionalidad
- Documentación clara de cada test case
- Fácil extensión para nuevas funcionalidades

### Próximos Pasos

1. **Integración CI/CD**: Configurar tests en pipeline de deployment
2. **Tests de Performance**: Añadir métricas de rendimiento
3. **Tests de Accesibilidad**: Verificar compliance WCAG
4. **Tests de API**: Añadir tests de endpoints backend
5. **Visual Regression**: Comparación de screenshots

---

**Nota**: Estos tests verifican la funcionalidad después de la refactorización de componentes realizada para resolver los errores de runtime (`showAvailableOnly`, `filteredTimeSlots`, `getAvailableDays`).