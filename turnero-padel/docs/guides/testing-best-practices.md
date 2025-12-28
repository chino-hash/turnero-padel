# 🧪 Testing y Mejores Prácticas - Turnero de Pádel

## 📋 Índice

- [Introducción](#introducción)
- [Configuración de Testing](#configuración-de-testing)
- [Tipos de Tests](#tipos-de-tests)
- [Mejores Prácticas](#mejores-prácticas)
- [Estructura de Tests](#estructura-de-tests)
- [Herramientas y Configuración](#herramientas-y-configuración)
- [Comandos de Testing](#comandos-de-testing)
- [Cobertura y Reportes](#cobertura-y-reportes)
- [Estándares de Código](#estándares-de-código)
- [Troubleshooting](#troubleshooting)

## 🎯 Introducción

Este documento establece las mejores prácticas para testing y desarrollo en el proyecto Turnero de Pádel. Incluye guías para escribir tests efectivos, mantener código de calidad y seguir estándares de desarrollo.

## ⚙️ Configuración de Testing

### Jest Configuration

El proyecto utiliza Jest como framework principal de testing con configuración optimizada para Next.js:

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/__tests__/setup.ts'],
  setupFiles: ['<rootDir>/jest-setup-globals.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cypress/',
    '<rootDir>/tests/e2e/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### Playwright Configuration

Para tests end-to-end utilizamos Playwright:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-reports/playwright-report' }],
    ['json', { outputFile: 'test-reports/playwright-results.json' }],
    ['junit', { outputFile: 'test-reports/playwright-junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

## 🧪 Tipos de Tests

### 1. Tests Unitarios

**Propósito**: Probar funciones, hooks y componentes de forma aislada.

**Ubicación**: `__tests__/hooks/`, `__tests__/lib/`, `__tests__/components/`

**Ejemplo**:
```typescript
// __tests__/hooks/useAuth.test.tsx
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth Hook', () => {
  test('debe retornar estado inicial correcto', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });
});
```

### 2. Tests de Integración

**Propósito**: Probar la interacción entre diferentes módulos.

**Ubicación**: `__tests__/integration/`, `__tests__/app/api/`

**Ejemplo**:
```typescript
// __tests__/integration/bookings-api.test.ts
import { POST } from '@/app/api/bookings/route';
import { NextRequest } from 'next/server';

describe('Bookings API Integration', () => {
  test('debe crear una reserva correctamente', async () => {
    const request = new NextRequest('http://localhost:3000/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        courtId: 1,
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '11:00',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.booking).toBeDefined();
  });
});
```

### 3. Tests End-to-End (E2E)

**Propósito**: Probar flujos completos de usuario.

**Ubicación**: `tests/e2e/`

**Ejemplo**:
```typescript
// tests/e2e/booking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sistema de Reservas', () => {
  test('debe permitir realizar una reserva completa', async ({ page }) => {
    await page.goto('/');
    
    // Seleccionar cancha
    await page.click('[data-testid="court-1"]');
    
    // Seleccionar horario
    await page.click('[data-testid="slot-10-00"]');
    
    // Confirmar reserva
    await page.click('[data-testid="confirm-booking"]');
    
    // Verificar confirmación
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
  });
});
```

### 4. Tests de Performance

**Propósito**: Verificar rendimiento bajo carga.

**Ubicación**: `__tests__/performance/`

**Ejemplo**:
```typescript
// __tests__/performance/bookings-performance.test.ts
describe('Performance Tests', () => {
  test('debe cargar horarios en menos de 500ms', async () => {
    const startTime = Date.now();
    
    // Simular carga de horarios
    const response = await fetch('/api/slots');
    const data = await response.json();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(500);
    expect(data.slots).toBeDefined();
  });
});
```

## 🎯 Mejores Prácticas

### Escritura de Tests

#### 1. Nomenclatura Clara
```typescript
// ✅ Bueno
describe('useBookings Hook', () => {
  test('debe retornar lista vacía cuando no hay reservas', () => {
    // ...
  });
});

// ❌ Malo
describe('Hook', () => {
  test('test1', () => {
    // ...
  });
});
```

#### 2. Patrón Arrange-Act-Assert
```typescript
test('debe calcular precio total correctamente', () => {
  // Arrange
  const booking = {
    courtId: 1,
    duration: 60,
    pricePerHour: 50,
  };
  
  // Act
  const total = calculateBookingPrice(booking);
  
  // Assert
  expect(total).toBe(50);
});
```

#### 3. Tests Independientes
```typescript
// ✅ Bueno - cada test es independiente
describe('BookingService', () => {
  beforeEach(() => {
    // Setup limpio para cada test
    jest.clearAllMocks();
  });
  
  test('debe crear reserva', () => {
    // Test aislado
  });
  
  test('debe cancelar reserva', () => {
    // Test aislado
  });
});
```

#### 4. Mocking Apropiado
```typescript
// ✅ Bueno - mock de dependencias externas
jest.mock('@/lib/prisma', () => ({
  booking: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}));

// ❌ Malo - mock de lógica de negocio
jest.mock('@/lib/booking-utils', () => ({
  calculatePrice: jest.fn(() => 100),
}));
```

### Organización de Tests

#### 1. Estructura de Archivos
```
__tests__/
├── setup/
│   ├── globalSetup.js
│   └── testUtils.tsx
├── hooks/
│   └── useAuth.test.tsx
├── components/
│   └── BookingForm.test.tsx
├── lib/
│   ├── services/
│   └── utils/
└── integration/
    └── api-integration.test.ts
```

#### 2. Helpers y Utilities
```typescript
// __tests__/setup/testUtils.tsx
import { render } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <SessionProvider session={null}>
      {ui}
    </SessionProvider>
  );
};

export const mockBooking = {
  id: 1,
  courtId: 1,
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '11:00',
};
```

### Performance en Tests

#### 1. Tests Rápidos
```typescript
// ✅ Bueno - test unitario rápido
test('debe formatear fecha correctamente', () => {
  const result = formatDate('2024-01-15');
  expect(result).toBe('15/01/2024');
});

// ⚠️ Cuidado - test que puede ser lento
test('debe procesar 1000 reservas', async () => {
  // Considerar si es necesario o mover a performance tests
});
```

#### 2. Paralelización
```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%', // Usar 50% de CPUs disponibles
  testTimeout: 10000, // Timeout de 10 segundos
};
```

## 📁 Estructura de Tests

### Convenciones de Archivos

```
proyecto/
├── __tests__/              # Tests unitarios y de integración
│   ├── setup/             # Configuración global
│   ├── hooks/             # Tests de custom hooks
│   ├── components/        # Tests de componentes React
│   ├── lib/              # Tests de utilidades y servicios
│   └── integration/      # Tests de integración
├── tests/                 # Tests E2E
│   ├── e2e/              # Tests end-to-end con Playwright
│   └── integration/      # Tests de integración complejos
└── cypress/              # Tests con Cypress (si se usa)
    ├── e2e/
    ├── component/
    └── support/
```

### Naming Conventions

- **Archivos de test**: `*.test.ts`, `*.test.tsx`, `*.spec.ts`
- **Archivos E2E**: `*.spec.ts` en carpeta `tests/e2e/`
- **Mocks**: `__mocks__/` o `*.mock.ts`
- **Fixtures**: `fixtures/` o `*.fixture.ts`

## 🛠️ Herramientas y Configuración

### Dependencias de Testing

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.0"
  }
}
```

### Setup Files

```javascript
// jest.setup.js
import '@testing-library/jest-dom';

// Mock de fetch global
global.fetch = jest.fn();

// Mock de IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));
```

```typescript
// __tests__/setup.ts
import { beforeAll, afterAll, afterEach } from '@jest/globals';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 🚀 Comandos de Testing

### Scripts Disponibles

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:unit": "jest __tests__/hooks __tests__/lib __tests__/components",
    "test:integration": "jest __tests__/integration",
    "test:performance": "jest __tests__/performance --testTimeout=30000",
    "test:e2e": "playwright test tests/e2e",
    "test:e2e:ui": "playwright test tests/e2e --ui",
    "test:e2e:headed": "playwright test tests/e2e --headed",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

### Uso de Comandos

```bash
# Desarrollo diario
npm run test:watch          # Tests en modo watch
npm run test:unit          # Solo tests unitarios
npm run test:coverage      # Con reporte de cobertura

# CI/CD
npm run test:ci            # Tests para integración continua
npm run test:all           # Suite completa de tests

# E2E
npm run test:e2e           # Tests end-to-end
npm run test:e2e:headed    # E2E con navegador visible
npm run test:e2e:ui        # E2E con interfaz gráfica

# Debugging
npm run test:debug         # Tests con debugger
npx playwright test --debug # E2E con debugger
```

## 📊 Cobertura y Reportes

### Configuración de Cobertura

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### Reportes Generados

- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`
- **Playwright**: `test-reports/playwright-report/index.html`

### Métricas Objetivo

| Métrica | Objetivo | Mínimo |
|---------|----------|--------|
| Statements | 85% | 80% |
| Branches | 80% | 75% |
| Functions | 85% | 80% |
| Lines | 85% | 80% |

## 📝 Estándares de Código

### TypeScript

#### 1. Tipado Estricto
```typescript
// ✅ Bueno
interface BookingData {
  courtId: number;
  date: string;
  startTime: string;
  endTime: string;
}

function createBooking(data: BookingData): Promise<Booking> {
  // ...
}

// ❌ Malo
function createBooking(data: any): any {
  // ...
}
```

#### 2. Interfaces y Types
```typescript
// ✅ Bueno - interfaces para objetos
interface User {
  id: number;
  email: string;
  name: string;
}

// ✅ Bueno - types para uniones
type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

// ✅ Bueno - generics para reutilización
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

### React Components

#### 1. Functional Components con TypeScript
```typescript
// ✅ Bueno
interface BookingFormProps {
  courtId: number;
  onSubmit: (booking: BookingData) => void;
  disabled?: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  courtId,
  onSubmit,
  disabled = false,
}) => {
  // ...
};
```

#### 2. Custom Hooks
```typescript
// ✅ Bueno
interface UseBookingsReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  createBooking: (data: BookingData) => Promise<void>;
  cancelBooking: (id: number) => Promise<void>;
}

export const useBookings = (): UseBookingsReturn => {
  // ...
};
```

### ESLint y Prettier

#### ESLint Configuration
```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Convenciones de Naming

#### 1. Archivos y Carpetas
```
// ✅ Bueno
components/BookingForm.tsx
hooks/useAuth.ts
lib/booking-utils.ts
types/booking.ts

// ❌ Malo
components/bookingform.tsx
hooks/auth.ts
lib/bookingUtils.ts
```

#### 2. Variables y Funciones
```typescript
// ✅ Bueno - camelCase
const bookingData = { ... };
const isAuthenticated = true;
const handleSubmit = () => { ... };

// ✅ Bueno - PascalCase para componentes
const BookingForm = () => { ... };

// ✅ Bueno - UPPER_CASE para constantes
const API_BASE_URL = 'https://api.example.com';
const MAX_BOOKING_DURATION = 120;
```

#### 3. Interfaces y Types
```typescript
// ✅ Bueno - PascalCase con prefijo I para interfaces (opcional)
interface IBookingService {
  create(data: BookingData): Promise<Booking>;
}

// ✅ Bueno - PascalCase sin prefijo (más común)
interface BookingService {
  create(data: BookingData): Promise<Booking>;
}

// ✅ Bueno - Type aliases
type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
```

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Tests Lentos
```bash
# Identificar tests lentos
npm run test -- --verbose

# Ejecutar con menos workers
npm run test -- --maxWorkers=2

# Limpiar cache
npm run test -- --clearCache
```

#### 2. Problemas de Memoria
```bash
# Aumentar memoria para Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run test

# Ejecutar tests en secuencia
npm run test -- --runInBand
```

#### 3. Tests E2E Fallando
```bash
# Ejecutar con navegador visible
npm run test:e2e:headed

# Ejecutar con debug
npm run test:e2e:debug

# Ver traces de Playwright
npx playwright show-trace test-results/trace.zip
```

#### 4. Problemas de Importación
```typescript
// ✅ Solución - usar alias configurados
import { useAuth } from '@/hooks/useAuth';

// ❌ Problema - rutas relativas complejas
import { useAuth } from '../../../hooks/useAuth';
```

### Variables de Entorno para Testing

```bash
# .env.test
NODE_ENV=test
NEXTAUTH_SECRET=test-secret-key
NEXTAUTH_URL=http://localhost:3000
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/turnero_test

# Playwright
PLAYWRIGHT_BASE_URL=http://localhost:3000
CI=true
```

### Debugging

#### VS Code Configuration
```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### Test Debugging
```typescript
// Usar console.log para debugging
test('debug example', () => {
  const result = someFunction();
  console.log('Result:', result); // Aparecerá en output
  expect(result).toBe(expected);
});

// Usar debugger
test('debugger example', () => {
  debugger; // Pausará aquí si se ejecuta con --inspect-brk
  const result = someFunction();
  expect(result).toBe(expected);
});
```

## 📚 Recursos Adicionales

### Documentación Oficial
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Next.js Testing](https://nextjs.org/docs/testing)

### Guías Internas
- [Guía de Contribución](./contributing.md)
- [Arquitectura del Proyecto](../architecture/README.md)
- [Documentación de APIs](../api/README.md)
- [Guía de Desarrollo](./development.md)

### Herramientas Recomendadas
- **VS Code Extensions**: Jest, Playwright Test for VS Code
- **Chrome Extensions**: React Developer Tools
- **CLI Tools**: Jest CLI, Playwright CLI

---

**Versión**: 2.0  
**Última actualización**: 2024-12-28  
**Próxima revisión**: 2025-03-28  

**Mantenido por**: Equipo de Desarrollo  
**Contacto**: Para preguntas sobre testing, crear un issue en GitHub