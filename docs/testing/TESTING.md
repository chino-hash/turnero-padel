# 🧪 Suite de Testing - Turnero de Pádel

Este documento describe la suite completa de testing implementada para el sistema de gestión de turnos de pádel.

## 📋 Índice

- [Tipos de Tests](#tipos-de-tests)
- [Estructura de Archivos](#estructura-de-archivos)
- [Configuración](#configuración)
- [Comandos de Testing](#comandos-de-testing)
- [Reportes y Cobertura](#reportes-y-cobertura)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

## 🎯 Tipos de Tests

### 1. Tests Unitarios
- **Ubicación**: `__tests__/hooks/`, `__tests__/lib/`, `__tests__/components/`
- **Propósito**: Probar funciones, hooks y componentes de forma aislada
- **Herramientas**: Jest, React Testing Library
- **Comando**: `npm run test:unit`

### 2. Tests de Integración
- **Ubicación**: `__tests__/integration/`, `__tests__/app/api/`
- **Propósito**: Probar la interacción entre diferentes módulos
- **Herramientas**: Jest, Supertest
- **Comando**: `npm run test:integration`

### 3. Tests de Performance
- **Ubicación**: `__tests__/performance/`
- **Propósito**: Verificar rendimiento bajo carga
- **Herramientas**: Jest con métricas personalizadas
- **Comando**: `npm run test:performance`

### 4. Tests End-to-End (E2E)
- **Ubicación**: `tests/e2e/`
- **Propósito**: Probar flujos completos de usuario
- **Herramientas**: Playwright
- **Comando**: `npm run test:e2e`

## 📁 Estructura de Archivos

```
├── __tests__/
│   ├── setup/
│   │   ├── globalSetup.js
│   │   ├── globalTeardown.js
│   │   └── testResultsProcessor.js
│   ├── hooks/
│   │   └── useBookings.test.tsx
│   ├── lib/
│   │   ├── services/
│   │   │   └── bookings.test.ts
│   │   └── utils/
│   │       └── booking-utils.test.ts
│   ├── integration/
│   │   └── bookings-api.integration.test.ts
│   ├── performance/
│   │   └── bookings-performance.test.ts
│   └── app/api/bookings/
│       └── route.test.ts
├── tests/
│   ├── e2e/
│   │   ├── global-setup.ts
│   │   ├── global-teardown.ts
│   │   ├── booking.spec.ts
│   │   └── bookings-management.spec.ts
│   └── integration/
├── scripts/
│   └── run-all-tests.js
├── jest.config.js
├── playwright.config.ts
└── TESTING.md
```

## ⚙️ Configuración

### Jest Configuration
- **Archivo**: `jest.config.js`
- **Proyectos**: Configuración separada para unit, integration y performance
- **Setup**: Archivos de configuración global en `__tests__/setup/`
- **Cobertura**: Reportes en HTML, LCOV y JSON

### Playwright Configuration
- **Archivo**: `playwright.config.ts`
- **Navegadores**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop y móvil
- **Reportes**: HTML, JSON, JUnit

## 🚀 Comandos de Testing

### Comandos Básicos
```bash
# Ejecutar todos los tests
npm run test:all

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests de performance
npm run test:performance

# Tests E2E
npm run test:e2e
```

### Comandos Específicos
```bash
# Tests de API
npm run test:api

# Tests de servicios
npm run test:services

# Tests de utilidades
npm run test:utils

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Comandos de Desarrollo
```bash
# Tests con debug
npm run test:debug

# E2E con interfaz gráfica
npm run test:e2e:ui

# E2E con navegador visible
npm run test:e2e:headed

# E2E con debug
npm run test:e2e:debug
```

### Comandos de CI/CD
```bash
# Suite completa para CI
npm run test:all:ci

# Tests de CI con Jest
npm run test:ci
```

## 📊 Reportes y Cobertura

### Ubicación de Reportes
- **Jest**: `coverage/` y `test-reports/`
- **Playwright**: `test-reports/playwright-report/`
- **Artifacts**: `test-results/`

### Tipos de Reportes
1. **Cobertura de Código**
   - HTML: `coverage/lcov-report/index.html`
   - LCOV: `coverage/lcov.info`
   - JSON: `coverage/coverage-final.json`

2. **Resultados de Tests**
   - Resumen: `test-reports/test-summary.json`
   - Performance: `test-reports/performance-report.json`
   - Tests fallidos: `test-reports/failed-tests.json`

3. **Reportes E2E**
   - HTML: `test-reports/playwright-report/index.html`
   - JSON: `test-reports/playwright-results.json`
   - JUnit: `test-reports/playwright-junit.xml`

### Umbrales de Cobertura
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## 🎯 Mejores Prácticas

### Escritura de Tests
1. **Nomenclatura Clara**: Usa nombres descriptivos para tests y describe blocks
2. **Arrange-Act-Assert**: Estructura clara en cada test
3. **Mocking Apropiado**: Mock dependencias externas pero no lógica de negocio
4. **Tests Independientes**: Cada test debe poder ejecutarse de forma aislada

### Organización
1. **Un archivo de test por módulo**: Mantén la estructura paralela al código
2. **Agrupa tests relacionados**: Usa `describe` blocks para organizar
3. **Setup y teardown**: Usa `beforeEach`/`afterEach` para configuración común

### Performance
1. **Tests rápidos**: Los tests unitarios deben ejecutarse en < 100ms
2. **Paralelización**: Aprovecha la ejecución paralela de Jest y Playwright
3. **Cleanup**: Limpia recursos después de cada test

## 🔧 Troubleshooting

### Problemas Comunes

#### Tests Lentos
```bash
# Ejecutar con verbose para identificar tests lentos
npm run test -- --verbose

# Ver reporte de performance
cat test-reports/performance-report.json
```

#### Problemas de Memoria
```bash
# Ejecutar con menos workers
npm run test -- --maxWorkers=2

# Limpiar cache
npm run test -- --clearCache
```

#### Tests E2E Fallando
```bash
# Ejecutar con navegador visible
npm run test:e2e:headed

# Ejecutar con debug
npm run test:e2e:debug

# Ver traces
npx playwright show-trace test-results/trace.zip
```

#### Problemas de Base de Datos
```bash
# Verificar configuración de test DB
echo $TEST_DATABASE_URL

# Regenerar Prisma client
npx prisma generate
```

### Variables de Entorno
```bash
# Testing
NODE_ENV=test
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/turnero_test
NEXTAUTH_SECRET=test-secret-key
NEXTAUTH_URL=http://localhost:3000

# Playwright
PLAYWRIGHT_BASE_URL=http://localhost:3000
CI=true # Para configuración de CI
```

### Comandos de Diagnóstico
```bash
# Verificar configuración de Jest
npx jest --showConfig

# Verificar configuración de Playwright
npx playwright test --list

# Limpiar todo
npm run clean && npm install
```

## 📈 Métricas y Monitoreo

### Métricas Clave
- **Cobertura de código**: > 80%
- **Tiempo de ejecución**: < 5 minutos para suite completa
- **Tests fallidos**: 0 en main branch
- **Flaky tests**: < 1% de tasa de fallo intermitente

### Integración con CI/CD
- Los tests se ejecutan automáticamente en cada PR
- Bloqueo de merge si tests fallan
- Reportes de cobertura en cada build
- Notificaciones de tests fallidos

## 🤝 Contribución

Para agregar nuevos tests:
1. Sigue la estructura de carpetas existente
2. Usa las convenciones de nomenclatura
3. Incluye tests para casos edge
4. Actualiza la documentación si es necesario
5. Verifica que la cobertura se mantenga > 80%

---

**Nota**: Esta suite de testing está diseñada para crecer con el proyecto. Agrega nuevos tests según sea necesario y mantén la documentación actualizada.