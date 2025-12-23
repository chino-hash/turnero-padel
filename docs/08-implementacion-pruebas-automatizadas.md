# Implementación de Pruebas Automatizadas

## Objetivo
Diseñar e implementar un sistema completo de pruebas automatizadas que incluya pruebas unitarias, de integración y end-to-end para asegurar la calidad del código y prevenir regresiones durante el desarrollo.

## Justificación
Las pruebas automatizadas son fundamentales para mantener la calidad del software, detectar errores tempranamente y facilitar refactorizaciones seguras. Un sistema de pruebas robusto reduce el tiempo de depuración y aumenta la confianza en los despliegues.

## Estrategia de Pruebas

### 1. Pruebas Unitarias

- **Componentes a probar**
  - Funciones de utilidad (`lib/utils.ts`)
  - Hooks personalizados (`hooks/useAuth.ts`)
  - Servicios de API
  - Lógica de negocio

- **Herramientas**
  - Jest como framework principal
  - React Testing Library para componentes
  - MSW (Mock Service Worker) para simular APIs

- **Cobertura objetivo**
  - Mínimo 80% de cobertura en funciones críticas
  - 100% de cobertura en lógica de negocio compleja

### 2. Pruebas de Integración

- **Áreas a probar**
  - Flujos de autenticación
  - Interacción con la base de datos (Prisma)
  - Integración entre componentes y servicios
  - APIs y endpoints

- **Herramientas**
  - Supertest para APIs
  - Base de datos de prueba dedicada
  - Contenedores Docker para entornos aislados

- **Estrategia**
  - Probar flujos completos de datos
  - Verificar integridad de datos entre componentes
  - Simular escenarios de error y recuperación

### 3. Pruebas End-to-End (E2E)

- **Flujos críticos**
  - Registro e inicio de sesión
  - Reserva de canchas
  - Proceso de pago
  - Funcionalidades de administración

- **Herramientas**
  - Cypress como framework principal
  - Playwright como alternativa para escenarios complejos

- **Estrategia**
  - Simular interacciones reales de usuario
  - Probar en múltiples navegadores
  - Incluir validaciones visuales

### 4. Pruebas de Rendimiento

- **Áreas a evaluar**
  - Tiempo de carga de páginas
  - Rendimiento de consultas a la base de datos
  - Capacidad de manejo de carga

- **Herramientas**
  - Lighthouse para métricas web
  - JMeter o k6 para pruebas de carga

- **Métricas objetivo**
  - Tiempo de carga inicial < 2 segundos
  - Tiempo de respuesta de API < 300ms

## Implementación

### 1. Configuración del Entorno de Pruebas

- **Configuración de Jest**
  ```javascript
  // jest.config.js
  module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
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
  ```

- **Configuración de Cypress**
  ```javascript
  // cypress.config.js
  const { defineConfig } = require('cypress');

  module.exports = defineConfig({
    e2e: {
      baseUrl: 'http://localhost:3000',
      specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      supportFile: 'cypress/support/e2e.js',
    },
  });
  ```

- **Base de datos de prueba**
  - Configurar base de datos SQLite separada para pruebas
  - Implementar seeding de datos para pruebas
  - Limpiar datos entre pruebas

### 2. Implementación de Pruebas Unitarias

- **Ejemplo de prueba para utilidades**
  ```typescript
  // utils.test.ts
  import { formatDate, calculatePrice } from '../lib/utils';

  describe('Utilidades', () => {
    test('formatDate formatea correctamente la fecha', () => {
      const date = new Date('2023-05-15T10:00:00');
      expect(formatDate(date)).toBe('15/05/2023');
    });

    test('calculatePrice calcula el precio correctamente', () => {
      expect(calculatePrice(4, 500)).toBe(2000);
    });
  });
  ```

- **Ejemplo de prueba para hooks**
  ```typescript
  // useAuth.test.ts
  import { renderHook, act } from '@testing-library/react-hooks';
  import { useAuth } from '../hooks/useAuth';
  import { SessionProvider } from 'next-auth/react';

  // Mock de next-auth
  jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  }));

  describe('useAuth hook', () => {
    test('devuelve isAuthenticated=true cuando hay sesión', () => {
      // Configurar mock
      require('next-auth/react').useSession.mockReturnValue({
        data: { user: { name: 'Test User' } },
        status: 'authenticated',
      });

      const wrapper = ({ children }) => (
        <SessionProvider>{children}</SessionProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
  ```

### 3. Implementación de Pruebas de Integración

- **Ejemplo de prueba de API**
  ```typescript
  // api.test.ts
  import { createMocks } from 'node-mocks-http';
  import courtsHandler from '../app/api/courts/route';
  import { prisma } from '../lib/prisma';

  // Mock de Prisma
  jest.mock('../lib/prisma', () => ({
    prisma: {
      court: {
        findMany: jest.fn(),
      },
    },
  }));

  describe('API de canchas', () => {
    test('GET /api/courts devuelve lista de canchas', async () => {
      // Configurar mock de Prisma
      prisma.court.findMany.mockResolvedValue([
        { id: 1, name: 'Cancha 1', covered: true, pricePerPerson: 500 },
      ]);

      const { req, res } = createMocks({ method: 'GET' });
      await courtsHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual([
        { id: 1, name: 'Cancha 1', covered: true, pricePerPerson: 500 },
      ]);
    });
  });
  ```

### 4. Implementación de Pruebas E2E

- **Ejemplo de prueba de login**
  ```typescript
  // login.cy.ts
  describe('Login', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('muestra error con credenciales inválidas', () => {
      // Interceptar llamada a API de autenticación
      cy.intercept('POST', '/api/auth/callback/credentials', {
        statusCode: 401,
        body: { error: 'Invalid credentials' },
      }).as('loginRequest');

      cy.get('button').contains('Iniciar sesión con Google').click();
      cy.wait('@loginRequest');
      cy.contains('Credenciales inválidas').should('be.visible');
    });

    it('redirige al dashboard después de login exitoso', () => {
      // Simular login exitoso
      cy.intercept('POST', '/api/auth/callback/credentials', {
        statusCode: 200,
        body: { user: { name: 'Test User' } },
      }).as('loginRequest');

      cy.get('button').contains('Iniciar sesión con Google').click();
      cy.wait('@loginRequest');
      cy.url().should('include', '/dashboard');
    });
  });
  ```

## Integración Continua (CI/CD)

- **Configuración de GitHub Actions**
  ```yaml
  # .github/workflows/test.yml
  name: Test

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '18'
            cache: 'npm'
        - name: Install dependencies
          run: npm ci
        - name: Run linter
          run: npm run lint
        - name: Run unit and integration tests
          run: npm test
        - name: Run E2E tests
          run: npm run test:e2e
        - name: Upload coverage
          uses: codecov/codecov-action@v3
  ```

## Plan de Implementación

| Fase | Actividades | Tiempo Estimado |
|------|------------|------------------|
| 1 | Configuración del entorno de pruebas | 1-2 días |
| 2 | Implementación de pruebas unitarias para componentes críticos | 3-5 días |
| 3 | Implementación de pruebas de integración | 3-4 días |
| 4 | Implementación de pruebas E2E para flujos principales | 3-5 días |
| 5 | Configuración de CI/CD | 1-2 días |
| 6 | Documentación y capacitación | 1 día |

## Métricas y Monitoreo

- **Cobertura de código**
  - Implementar informes de cobertura con Jest
  - Integrar con herramientas como Codecov

- **Tiempo de ejecución**
  - Monitorear tiempo de ejecución de pruebas
  - Optimizar pruebas lentas

- **Estabilidad**
  - Seguimiento de pruebas inestables (flaky tests)
  - Implementar retries para pruebas E2E

## Criterios de Éxito

- Cobertura de código > 80% en módulos críticos
- Todas las pruebas se ejecutan en < 10 minutos en CI
- Cero despliegues con errores detectables por pruebas
- Reducción del 50% en tiempo de depuración
- Todos los flujos críticos de usuario cubiertos por pruebas E2E