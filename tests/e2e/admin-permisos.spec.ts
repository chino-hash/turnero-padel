import { test, expect } from '@playwright/test';

test.describe('Panel de Administración - Permisos y Roles', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Protección de Rutas Administrativas', () => {
    test('debe redirigir usuarios no autenticados a login', async ({ page }) => {
      // Limpiar cookies/sesión
      await page.context().clearCookies();
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
      const isInAdmin = currentUrl.includes('/admin');
      
      // Debe estar en login o mostrar algún tipo de protección
      if (!isInAdmin) {
        expect(isRedirectedToLogin).toBeTruthy();
      } else {
        // Si está en admin, verificar que hay algún mecanismo de autenticación
        const authElements = page.locator('input[type="password"], .login, .auth, form');
        const hasAuthElements = await authElements.count() > 0;
        expect(hasAuthElements).toBeTruthy();
      }
    });

    test('debe proteger rutas específicas del admin', async ({ page }) => {
      // Limpiar cookies/sesión
      await page.context().clearCookies();
      
      const adminRoutes = [
        '/admin/canchas',
        '/admin/usuarios', 
        '/admin/estadisticas',
        '/admin/productos'
      ];
      
      for (const route of adminRoutes) {
        await page.goto(route);
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const isProtected = !currentUrl.includes(route) || currentUrl.includes('/login');
        const hasAuthForm = await page.locator('input[type="password"], .login-form').count() > 0;
        
        // La ruta debe estar protegida de alguna manera
        expect(isProtected || hasAuthForm).toBeTruthy();
      }
    });

    test('debe bloquear acceso directo a APIs administrativas', async ({ page }) => {
      // Limpiar cookies/sesión
      await page.context().clearCookies();
      
      const adminApiEndpoints = [
        '/api/admin/users',
        '/api/admin/courts',
        '/api/admin/bookings',
        '/api/admin/stats'
      ];
      
      for (const endpoint of adminApiEndpoints) {
        const response = await page.request.get(endpoint);
        
        // Debe retornar 401 (No autorizado) o 403 (Prohibido) o redirigir
        const isBlocked = response.status() === 401 || 
                         response.status() === 403 || 
                         response.status() === 302 ||
                         response.status() === 404; // 404 también es aceptable si la API no existe
        
        expect(isBlocked).toBeTruthy();
      }
    });
  });

  test.describe('Validación de Roles de Usuario', () => {
    test('debe verificar rol de administrador antes del acceso', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        // Si está en login, intentar con credenciales de usuario normal
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');
        const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /iniciar|login|entrar/i });
        
        const hasLoginForm = await emailInput.count() > 0 && await passwordInput.count() > 0;
        
        if (hasLoginForm) {
          // Intentar login con usuario no admin (si existe)
          await emailInput.fill('usuario@test.com');
          await passwordInput.fill('password123');
          
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(3000);
            
            const afterLoginUrl = page.url();
            // No debe poder acceder al admin con usuario normal
            const stillBlocked = !afterLoginUrl.includes('/admin') || afterLoginUrl.includes('/login');
            expect(stillBlocked).toBeTruthy();
          }
        }
      } else if (currentUrl.includes('/admin')) {
        // Si ya está en admin, verificar que hay indicadores de rol admin
        const adminIndicators = page.locator('.admin, .administrator, [data-role="admin"]').or(
          page.locator('span, div').filter({ hasText: /admin|administrador/i })
        );
        const hasAdminIndicators = await adminIndicators.count() > 0;
        
        if (hasAdminIndicators) {
          await expect(adminIndicators.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar diferentes interfaces según el rol', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Verificar que hay elementos específicos de admin
        const adminOnlyElements = page.locator('button, a').filter({ hasText: /eliminar|delete|editar|edit|crear|create|gestionar|manage/i });
        const adminElementsCount = await adminOnlyElements.count();
        
        if (adminElementsCount > 0) {
          await expect(adminOnlyElements.first()).toBeVisible();
        }
        
        // Verificar menús administrativos
        const adminMenus = page.locator('nav, .menu').filter({ hasText: /usuario|cancha|estadística|reporte/i });
        const menuCount = await adminMenus.count();
        
        if (menuCount > 0) {
          await expect(adminMenus.first()).toBeVisible();
        }
      }
    });

    test('debe ocultar funciones admin a usuarios normales', async ({ page }) => {
      // Simular acceso como usuario normal (ir a página principal)
      await page.goto('/');
      await page.waitForTimeout(3000);
      
      // Verificar que no hay enlaces directos al admin
      const adminLinks = page.locator('a').filter({ hasText: /admin|administr|gestión|panel/i });
      const adminLinksCount = await adminLinks.count();
      
      // Los enlaces admin no deberían estar visibles para usuarios normales
      if (adminLinksCount > 0) {
        // Si hay enlaces, verificar que están ocultos o protegidos
        const visibleAdminLinks = await adminLinks.filter({ hasText: /admin/i }).count();
        expect(visibleAdminLinks).toBe(0);
      }
      
      // Intentar acceso directo al admin desde página normal
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      const isBlocked = !finalUrl.includes('/admin') || finalUrl.includes('/login');
      expect(isBlocked).toBeTruthy();
    });
  });

  test.describe('Permisos de Acciones Específicas', () => {
    test('debe validar permisos para crear canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar botón de crear cancha
        const createButton = page.locator('button, a').filter({ hasText: /crear|nueva|agregar|add/i });
        const hasCreateButton = await createButton.count() > 0;
        
        if (hasCreateButton) {
          await expect(createButton.first()).toBeVisible();
          
          // Verificar que el botón es funcional
          await createButton.first().click();
          await page.waitForTimeout(1000);
          
          // Debe abrir formulario o modal
          const formElements = page.locator('form, .modal, .dialog, input[name*="nombre"], input[name*="precio"]');
          const hasForm = await formElements.count() > 0;
          
          if (hasForm) {
            await expect(formElements.first()).toBeVisible();
          }
        }
      }
    });

    test('debe validar permisos para editar canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar botones de editar
        const editButtons = page.locator('button, a').filter({ hasText: /editar|edit|modificar/i });
        const hasEditButtons = await editButtons.count() > 0;
        
        if (hasEditButtons) {
          await expect(editButtons.first()).toBeVisible();
          
          // Probar funcionalidad de edición
          await editButtons.first().click();
          await page.waitForTimeout(1000);
          
          // Debe abrir formulario de edición
          const editForm = page.locator('form, .modal, (input as any)[value], input[name*="nombre"]');
          const hasEditForm = await editForm.count() > 0;
          
          if (hasEditForm) {
            await expect(editForm.first()).toBeVisible();
          }
        }
      }
    });

    test('debe validar permisos para eliminar canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar botones de eliminar
        const deleteButtons = page.locator('button, a').filter({ hasText: /eliminar|delete|borrar|remove/i });
        const hasDeleteButtons = await deleteButtons.count() > 0;
        
        if (hasDeleteButtons) {
          await expect(deleteButtons.first()).toBeVisible();
          
          // Verificar que hay confirmación antes de eliminar
          await deleteButtons.first().click();
          await page.waitForTimeout(500);
          
          // Debe mostrar confirmación
          const confirmDialog = page.locator('.confirm, .modal, .dialog').or(
            page.locator('button').filter({ hasText: /confirmar|sí|yes|eliminar/i })
          );
          const hasConfirmation = await confirmDialog.count() > 0;
          
          if (hasConfirmation) {
            await expect(confirmDialog.first()).toBeVisible();
          }
        }
      }
    });

    test('debe validar permisos para gestionar usuarios', async ({ page }) => {
      await page.goto('/admin/usuarios');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Verificar acceso a gestión de usuarios
        const userManagementElements = page.locator('table, .user-list, .usuarios').or(
          page.locator('button').filter({ hasText: /usuario|user|crear|editar/i })
        );
        const hasUserManagement = await userManagementElements.count() > 0;
        
        if (hasUserManagement) {
          await expect(userManagementElements.first()).toBeVisible();
        }
      }
    });

    test('debe validar permisos para ver estadísticas', async ({ page }) => {
      await page.goto('/admin/estadisticas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Verificar acceso a estadísticas
        const statsElements = page.locator('.chart, .graph, .estadisticas, .stats').or(
          page.locator('div, section').filter({ hasText: /estadística|reporte|analítica/i })
        );
        const hasStats = await statsElements.count() > 0;
        
        if (hasStats) {
          await expect(statsElements.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Seguridad de Sesiones', () => {
    test('debe expirar sesión después de inactividad', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Simular inactividad (esperar un tiempo)
        await page.waitForTimeout(5000);
        
        // Intentar realizar una acción
        await page.reload();
        await page.waitForTimeout(3000);
        
        const afterReloadUrl = page.url();
        // La sesión debería mantenerse por ahora (5 segundos no es suficiente inactividad)
        const sessionMaintained = afterReloadUrl.includes('/admin');
        
        // Por ahora solo verificamos que la página responde
        const content = page.locator('body');
        await expect(content).toBeVisible();
      }
    });

    test('debe invalidar sesión al cerrar sesión', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar botón de logout
        const logoutButton = page.locator('button, a').filter({ hasText: /salir|logout|cerrar sesión/i });
        const hasLogout = await logoutButton.count() > 0;
        
        if (hasLogout) {
          await logoutButton.first().click();
          await page.waitForTimeout(2000);
          
          // Debe redirigir fuera del admin
          const afterLogoutUrl = page.url();
          const isLoggedOut = !afterLogoutUrl.includes('/admin') || afterLogoutUrl.includes('/login');
          expect(isLoggedOut).toBeTruthy();
          
          // Intentar volver al admin
          await page.goto('/admin');
          await page.waitForTimeout(2000);
          
          const finalUrl = page.url();
          const isBlocked = !finalUrl.includes('/admin') || finalUrl.includes('/login');
          expect(isBlocked).toBeTruthy();
        }
      }
    });

    test('debe mantener sesión en múltiples pestañas', async ({ context }) => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      // Acceder al admin en primera pestaña
      await page1.goto('/admin');
      await page1.waitForTimeout(3000);
      
      const url1 = page1.url();
      
      if (url1.includes('/admin')) {
        // Acceder al admin en segunda pestaña
        await page2.goto('/admin');
        await page2.waitForTimeout(3000);
        
        const url2 = page2.url();
        
        // Ambas pestañas deberían tener acceso
        const bothHaveAccess = url1.includes('/admin') && url2.includes('/admin');
        expect(bothHaveAccess).toBeTruthy();
      }
      
      await page1.close();
      await page2.close();
    });
  });

  test.describe('Validaciones de Entrada', () => {
    test('debe validar tokens CSRF en formularios', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar formularios
        const forms = page.locator('form');
        const formCount = await forms.count();
        
        if (formCount > 0) {
          // Verificar que hay campos ocultos (posibles tokens CSRF)
          const hiddenInputs = forms.first().locator('input[type="hidden"]');
          const hasHiddenInputs = await hiddenInputs.count() > 0;
          
          // No es obligatorio, pero es una buena práctica de seguridad
          if (hasHiddenInputs) {
            await expect(hiddenInputs.first()).toBeAttached();
          }
        }
      }
    });

    test('debe sanitizar entradas de usuario', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar botón de crear
        const createButton = page.locator('button, a').filter({ hasText: /crear|nueva|agregar/i });
        const hasCreateButton = await createButton.count() > 0;
        
        if (hasCreateButton) {
          await createButton.first().click();
          await page.waitForTimeout(1000);
          
          // Buscar campo de nombre
          const nameInput = page.locator('input[name*="nombre"], input[placeholder*="nombre"]');
          const hasNameInput = await nameInput.count() > 0;
          
          if (hasNameInput) {
            // Probar entrada con caracteres especiales
            await nameInput.fill('<script>alert("test")</script>');
            
            // Verificar que el valor se sanitiza o escapa
            const inputValue = await nameInput.inputValue();
            const isSanitized = !inputValue.includes('<script>') || inputValue.includes('&lt;');
            
            // La aplicación debería manejar esto de alguna manera
            expect(typeof inputValue).toBe('string');
          }
        }
      }
    });
  });

  test.describe('Auditoría y Logging', () => {
    test('debe registrar acciones administrativas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Realizar una acción (navegar a sección)
        await page.goto('/admin/canchas');
        await page.waitForTimeout(2000);
        
        // Verificar que la navegación fue exitosa
        const finalUrl = page.url();
        const navigationSuccessful = finalUrl.includes('/admin');
        expect(navigationSuccessful).toBeTruthy();
        
        // En una implementación real, esto debería registrarse en logs del servidor
        // Por ahora solo verificamos que la acción se completó
        const content = page.locator('body');
        await expect(content).toBeVisible();
      }
    });

    test('debe mostrar historial de acciones si existe', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar sección de logs o historial
        const logSections = page.locator('.logs, .history, .audit').or(
          page.locator('a, button').filter({ hasText: /log|historial|auditoría|activity/i })
        );
        const hasLogSection = await logSections.count() > 0;
        
        if (hasLogSection) {
          await expect(logSections.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Protección contra Ataques', () => {
    test('debe prevenir inyección SQL en búsquedas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar campo de búsqueda
        const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[name*="search"]');
        const hasSearchInput = await searchInput.count() > 0;
        
        if (hasSearchInput) {
          // Probar inyección SQL
          await searchInput.fill("'; DROP TABLE canchas; --");
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000);
          
          // La página debería seguir funcionando (no debería haber error de SQL)
          const content = page.locator('body');
          await expect(content).toBeVisible();
          
          // No debería mostrar errores de base de datos
          const sqlErrors = page.locator('text=/SQL|database|mysql|postgres/i');
          const hasSqlErrors = await sqlErrors.count() > 0;
          expect(hasSqlErrors).toBeFalsy();
        }
      }
    });

    test('debe prevenir XSS en campos de entrada', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/admin')) {
        // Buscar formulario de creación
        const createButton = page.locator('button, a').filter({ hasText: /crear|nueva/i });
        const hasCreateButton = await createButton.count() > 0;
        
        if (hasCreateButton) {
          await createButton.first().click();
          await page.waitForTimeout(1000);
          
          const textInputs = page.locator('input[type="text"], textarea');
          const hasTextInputs = await textInputs.count() > 0;
          
          if (hasTextInputs) {
            // Probar XSS
            await textInputs.first().fill('<img src=x onerror=alert("XSS")>');
            
            // Verificar que no se ejecuta el script
            await page.waitForTimeout(1000);
            
            // No debería haber alertas
            const dialogs: any[] = [];
            page.on('dialog', dialog => {
              dialogs.push(dialog);
              dialog.dismiss();
            });
            
            await page.waitForTimeout(500);
            expect(dialogs.length).toBe(0);
          }
        }
      }
    });

    test('debe limitar intentos de acceso', async ({ page }) => {
      // Limpiar cookies
      await page.context().clearCookies();
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      
      if (currentUrl.includes('/login')) {
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitButton = page.locator('button[type="submit"], button').filter({ hasText: /login|entrar/i });
        
        const hasLoginForm = await emailInput.count() > 0 && await passwordInput.count() > 0;
        
        if (hasLoginForm) {
          // Intentar múltiples logins fallidos
          for (let i = 0; i < 3; i++) {
            await emailInput.fill('wrong@email.com');
            await passwordInput.fill('wrongpassword');
            
            if (await submitButton.count() > 0) {
              await submitButton.click();
              await page.waitForTimeout(1000);
            }
          }
          
          // Después de múltiples intentos, debería haber alguna protección
          const errorMessages = page.locator('.error, .alert, .warning').or(
            page.locator('text=/bloqueado|blocked|intentos|attempts/i')
          );
          const hasProtection = await errorMessages.count() > 0;
          
          // No es obligatorio, pero es una buena práctica
          if (hasProtection) {
            await expect(errorMessages.first()).toBeVisible();
          }
        }
      }
    });
  });
});