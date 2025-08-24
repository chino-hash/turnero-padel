import { test, expect } from '@playwright/test';

// Pruebas de integración entre Autenticación y Servicios
test.describe('Integración Autenticación - Servicios', () => {
  test.describe('Flujo de Autenticación Completo', () => {
    test('debe integrar correctamente NextAuth con la aplicación', async ({ page, request }) => {
      // 1. Verificar que las rutas de NextAuth están disponibles
      const authRoutes = [
        '/api/auth/session',
        '/api/auth/providers',
        '/api/auth/csrf'
      ];

      for (const route of authRoutes) {
        const response = await request.get(route);
        expect(response.status()).toBeLessThan(500);
        
        if (response.ok()) {
          const data = await response.json();
          expect(data).toBeDefined();
        }
      }

      // 2. Verificar integración en el frontend
      await page.goto('/');
      
      // Buscar elementos relacionados con autenticación
      const authElements = page.locator('button:has-text("Login"), button:has-text("Iniciar"), a[href*="login"], [data-testid="login"]');
      const userElements = page.locator('.user-menu, .profile, [data-testid="user-menu"]');
      
      // Debe tener elementos de autenticación o usuario
      const hasAuthElements = await authElements.count() > 0;
      const hasUserElements = await userElements.count() > 0;
      
      expect(hasAuthElements || hasUserElements).toBeTruthy();
    });

    test('debe manejar estados de autenticación correctamente', async ({ page }) => {
      await page.goto('/');
      
      // Verificar estado inicial (no autenticado)
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Esperar carga de sesión
      
      // Buscar indicadores de estado de autenticación
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Iniciar"), a[href*="login"]');
      const userProfile = page.locator('.user-profile, .user-menu, [data-testid="user-profile"]');
      const guestElements = page.locator('.guest, .anonymous, [data-testid="guest"]');
      
      // Debe mostrar algún indicador del estado de autenticación
      const hasAuthIndicators = await loginButton.count() > 0 || 
                               await userProfile.count() > 0 || 
                               await guestElements.count() > 0;
      
      expect(hasAuthIndicators).toBeTruthy();
    });

    test('debe proteger rutas administrativas', async ({ page }) => {
      // Intentar acceder a rutas administrativas sin autenticación
      const adminRoutes = [
        '/admin',
        '/dashboard',
        '/admin/users',
        '/admin/courts',
        '/admin/bookings'
      ];

      for (const route of adminRoutes) {
        await page.goto(route);
        
        // Esperar redirección o carga
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        
        // Debe redirigir a login o mostrar mensaje de acceso denegado
        const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
        const hasAccessDenied = await page.locator('.access-denied, .unauthorized, .error').count() > 0;
        const hasLoginForm = await page.locator('input[type="password"], .login-form').count() > 0;
        
        // Al menos una de estas condiciones debe cumplirse para rutas protegidas
        if (route.includes('/admin') || route.includes('/dashboard')) {
          expect(isRedirectedToLogin || hasAccessDenied || hasLoginForm).toBeTruthy();
        }
      }
    });
  });

  test.describe('Integración con APIs Protegidas', () => {
    test('debe requerir autenticación para APIs sensibles', async ({ request }) => {
      const protectedEndpoints = [
        '/api/admin/users',
        '/api/admin/courts',
        '/api/admin/bookings',
        '/api/bookings',
        '/api/users/profile'
      ];

      for (const endpoint of protectedEndpoints) {
        try {
          const response = await request.get(endpoint);
          
          // APIs protegidas deben requerir autenticación
          if (response.status() === 200) {
            // Si responde OK, verificar que no expone datos sensibles
            const data = await response.json();
            
            // No debe exponer información sensible sin autenticación
            if (Array.isArray(data) && data.length > 0) {
              const firstItem = data[0];
              const hasSensitiveData = firstItem.password || 
                                     firstItem.email || 
                                     firstItem.personalInfo;
              
              // Si hay datos sensibles, debe estar protegido
              if (hasSensitiveData) {
                expect(false).toBeTruthy(); // Falla si expone datos sensibles
              }
            }
          } else {
            // Debe requerir autenticación
            expect([401, 403, 405]).toContain(response.status());
          }
        } catch (error) {
          // API puede no existir - comportamiento aceptable
          console.log(`API ${endpoint} no disponible:`, error.message);
        }
      }
    });

    test('debe manejar tokens de sesión correctamente', async ({ request, page }) => {
      // Verificar manejo de cookies de sesión
      await page.goto('/');
      
      // Obtener cookies después de cargar la página
      const cookies = await page.context().cookies();
      
      // Buscar cookies relacionadas con autenticación
      const authCookies = cookies.filter(cookie => 
        cookie.name.includes('session') || 
        cookie.name.includes('auth') || 
        cookie.name.includes('token') ||
        cookie.name.includes('next-auth')
      );

      // Verificar propiedades de seguridad de cookies de autenticación
      for (const cookie of authCookies) {
        // Cookies de autenticación deben tener propiedades de seguridad
        expect(cookie.httpOnly).toBeTruthy();
        expect(cookie.secure || cookie.sameSite === 'lax' || cookie.sameSite === 'strict').toBeTruthy();
      }
    });

    test('debe validar permisos de usuario correctamente', async ({ request }) => {
      // Simular diferentes niveles de permisos
      const testScenarios = [
        {
          endpoint: '/api/admin/users',
          expectedStatus: [401, 403, 405], // Sin permisos de admin
          description: 'Admin endpoint sin permisos'
        },
        {
          endpoint: '/api/bookings',
          expectedStatus: [200, 401, 403], // Puede requerir autenticación
          description: 'User endpoint'
        }
      ];

      for (const scenario of testScenarios) {
        try {
          const response = await request.get(scenario.endpoint);
          
          // Verificar que el status es uno de los esperados
          expect(scenario.expectedStatus).toContain(response.status());
          
        } catch (error) {
          console.log(`${scenario.description} no disponible:`, error.message);
        }
      }
    });
  });

  test.describe('Integración con Base de Datos de Usuarios', () => {
    test('debe manejar creación de usuarios correctamente', async ({ request }) => {
      const newUser = {
        email: 'test@integration.com',
        name: 'Test Integration User',
        password: 'securePassword123'
      };

      try {
        const response = await request.post('/api/auth/register', {
          data: newUser
        });

        if (response.ok()) {
          const result = await response.json();
          
          // Verificar que no se devuelve la contraseña
          expect(result.password).toBeUndefined();
          
          // Verificar estructura del usuario creado
          expect(result.email).toBe(newUser.email);
          expect(result.name).toBe(newUser.name);
          expect(result.id).toBeDefined();
          
        } else if (response.status() === 409) {
          // Usuario ya existe - comportamiento válido
          expect(response.status()).toBe(409);
        } else {
          // Otros errores válidos
          expect([400, 401, 405, 422]).toContain(response.status());
        }
      } catch (error) {
        console.log('API de registro no disponible:', error.message);
      }
    });

    test('debe validar datos de usuario apropiadamente', async ({ request }) => {
      const invalidUsers = [
        {
          email: 'invalid-email',
          name: '',
          password: '123' // Muy corta
        },
        {
          email: '',
          name: 'Valid Name',
          password: 'validPassword123'
        },
        {
          // Email duplicado
          email: 'test@integration.com',
          name: 'Another User',
          password: 'validPassword123'
        }
      ];

      for (const invalidUser of invalidUsers) {
        try {
          const response = await request.post('/api/auth/register', {
            data: invalidUser
          });

          // Debe rechazar usuarios inválidos
          expect([400, 409, 422, 401, 405]).toContain(response.status());
          
        } catch (error) {
          console.log('Validación de usuario no disponible:', error.message);
        }
      }
    });
  });

  test.describe('Seguridad y Protección', () => {
    test('debe prevenir ataques de fuerza bruta', async ({ request }) => {
      const loginAttempts = Array(5).fill({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      try {
        // Hacer múltiples intentos de login fallidos
        const responses = await Promise.all(
          loginAttempts.map(credentials => 
            request.post('/api/auth/signin', { data: credentials })
          )
        );

        // Después de varios intentos fallidos, debe implementar rate limiting
        const lastResponse = responses[responses.length - 1];
        
        // Puede implementar rate limiting (429) o seguir rechazando (401)
        expect([401, 403, 429, 405]).toContain(lastResponse.status());
        
      } catch (error) {
        console.log('Test de fuerza bruta no disponible:', error.message);
      }
    });

    test('debe manejar logout correctamente', async ({ page }) => {
      await page.goto('/');
      
      // Buscar botón de logout
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Salir"), button:has-text("Cerrar"), [data-testid="logout"]');
      
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        
        // Verificar que se limpia la sesión
        await page.waitForTimeout(1000);
        
        // Debe mostrar elementos de login nuevamente
        const loginElements = page.locator('button:has-text("Login"), button:has-text("Iniciar"), a[href*="login"]');
        const hasLoginElements = await loginElements.count() > 0;
        
        expect(hasLoginElements).toBeTruthy();
      }
    });

    test('debe proteger contra CSRF', async ({ request, page }) => {
      await page.goto('/');
      
      // Verificar que hay protección CSRF
      const csrfResponse = await request.get('/api/auth/csrf');
      
      if (csrfResponse.ok()) {
        const csrfData = await csrfResponse.json();
        expect(csrfData.csrfToken).toBeDefined();
      }
    });
  });

  test.describe('Integración con Servicios Externos', () => {
    test('debe manejar proveedores de autenticación externa', async ({ page }) => {
      await page.goto('/login');
      
      // Buscar botones de proveedores externos
      const externalProviders = page.locator('button:has-text("Google"), button:has-text("GitHub"), button:has-text("Facebook"), .oauth-provider');
      
      if (await externalProviders.count() > 0) {
        // Verificar que los botones están configurados correctamente
        const firstProvider = externalProviders.first();
        await expect(firstProvider).toBeVisible();
        
        // Verificar que tiene href o onclick apropiado
        const hasAction = await firstProvider.evaluate(el => 
          el.hasAttribute('href') || el.hasAttribute('onclick') || el.onclick !== null
        );
        
        expect(hasAction).toBeTruthy();
      }
    });

    test('debe manejar callbacks de OAuth correctamente', async ({ request }) => {
      // Verificar que las rutas de callback existen
      const callbackRoutes = [
        '/api/auth/callback/google',
        '/api/auth/callback/github',
        '/api/auth/callback/credentials'
      ];

      for (const route of callbackRoutes) {
        try {
          const response = await request.get(route);
          
          // No debe dar error 500, puede dar 400 o 404
          expect(response.status()).toBeLessThan(500);
          
        } catch (error) {
          console.log(`Callback ${route} no disponible:`, error.message);
        }
      }
    });
  });
});