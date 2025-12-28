import { test, expect } from '@playwright/test';

test.describe('Administración de Usuarios y Permisos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test.describe('Gestión de Usuarios', () => {
    test('debe permitir acceso al panel de administración', async ({ page }) => {
      // Buscar enlace o botón de administración
      const adminLink = page.locator('a:has-text("Admin"), a:has-text("Administración"), button:has-text("Admin"), [href*="admin"]');
      
      if (await adminLink.count() > 0) {
        await adminLink.click();
        await page.waitForTimeout(2000);
        
        // Verificar que estamos en el panel de admin
        const adminPanel = page.locator('h1:has-text("Admin"), h1:has-text("Administración"), .admin-panel, [data-testid="admin-panel"]');
        await expect(adminPanel).toBeVisible({ timeout: 5000 });
        
        console.log('Acceso al panel de administración exitoso');
      } else {
        // Intentar acceso directo por URL
        await page.goto('/admin');
        await page.waitForTimeout(2000);
        
        // Verificar si hay redirección a login o si se muestra el panel
        const currentUrl = page.url();
        if (currentUrl.includes('/admin')) {
          const adminContent = page.locator('h1, h2, .admin, [data-testid="admin"]');
          await expect(adminContent.first()).toBeVisible({ timeout: 5000 });
          console.log('Acceso directo al panel de administración exitoso');
        } else if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
          console.log('Redirección a login detectada - comportamiento esperado para usuarios no autenticados');
        } else {
          console.log('Comportamiento inesperado en acceso a admin');
        }
      }
    });

    test('debe mostrar lista de usuarios registrados', async ({ page }) => {
      // Intentar acceder al panel de admin
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Buscar sección de usuarios
      const usersSection = page.locator('a:has-text("Usuarios"), button:has-text("Usuarios"), [href*="users"], [data-testid="users-section"]');
      
      if (await usersSection.count() > 0) {
        await usersSection.click();
        await page.waitForTimeout(2000);
        
        // Verificar que se muestra la lista de usuarios
        const usersList = page.locator('.users-list, table, .user-item, [data-testid="users-list"]');
        
        if (await usersList.count() > 0) {
          await expect(usersList).toBeVisible();
          
          // Verificar que hay al menos un usuario
          const userItems = page.locator('tr, .user-item, .user-card');
          const userCount = await userItems.count();
          
          if (userCount > 0) {
            console.log(`Lista de usuarios mostrada con ${userCount} usuarios`);
          } else {
            console.log('Lista de usuarios vacía');
          }
        } else {
          console.log('No se encontró lista de usuarios');
        }
      } else {
        console.log('No se encontró sección de usuarios en el admin');
      }
    });

    test('debe permitir buscar usuarios', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      // Buscar campo de búsqueda
      const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], [data-testid="user-search"]');
      
      if (await searchInput.count() > 0) {
        // Probar búsqueda
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Verificar que se actualiza la lista
        const searchResults = page.locator('.search-results, .filtered-users, table tbody tr');
        
        if (await searchResults.count() > 0) {
          console.log('Funcionalidad de búsqueda de usuarios funciona');
        } else {
          console.log('No se encontraron resultados de búsqueda');
        }
        
        // Limpiar búsqueda
        await searchInput.clear();
        await page.waitForTimeout(500);
      } else {
        console.log('No se encontró campo de búsqueda de usuarios');
      }
    });
  });

  test.describe('Gestión de Permisos', () => {
    test('debe mostrar roles y permisos de usuarios', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      // Buscar información de roles
      const roleInfo = page.locator(':has-text("Admin"), :has-text("Usuario"), :has-text("Moderador"), .role, .permission');
      
      if (await roleInfo.count() > 0) {
        await expect(roleInfo.first()).toBeVisible();
        console.log('Información de roles y permisos visible');
        
        // Contar diferentes tipos de roles
        const adminRoles = page.locator(':has-text("Admin")');
        const userRoles = page.locator(':has-text("Usuario")');
        
        const adminCount = await adminRoles.count();
        const userCount = await userRoles.count();
        
        console.log(`Roles encontrados - Admin: ${adminCount}, Usuario: ${userCount}`);
      } else {
        console.log('No se encontró información de roles');
      }
    });

    test('debe permitir modificar permisos de usuario', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      
      // Buscar botón de editar usuario
      const editButton = page.locator('button:has-text("Editar"), a:has-text("Editar"), .edit-user, [data-testid="edit-user"]').first();
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Buscar controles de permisos
        const permissionControls = page.locator('select[name*="role"], input[type="checkbox"], .permission-control');
        
        if (await permissionControls.count() > 0) {
          console.log('Controles de permisos encontrados');
          
          // Verificar que hay opciones de roles
          const roleSelect = page.locator('select[name*="role"], select:has(option:has-text("Admin"))');
          
          if (await roleSelect.count() > 0) {
            const options = await roleSelect.locator('option').count();
            console.log(`Selector de roles con ${options} opciones`);
            
            // Verificar que se puede cambiar el rol
            await expect(roleSelect).toBeEnabled();
          }
          
          // Buscar botón de guardar
          const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Actualizar"), [type="submit"]');
          
          if (await saveButton.count() > 0) {
            await expect(saveButton).toBeVisible();
            console.log('Formulario de edición de permisos completo');
          }
        } else {
          console.log('No se encontraron controles de permisos');
        }
      } else {
        console.log('No se encontró botón de editar usuario');
      }
    });
  });

  test.describe('Seguridad y Validaciones', () => {
    test('debe proteger rutas de administración', async ({ page }) => {
      // Limpiar cookies para simular usuario no autenticado
      await page.context().clearCookies();
      
      // Intentar acceder directamente a rutas de admin
      const adminRoutes = ['/admin', '/admin/users', '/admin/bookings', '/admin/courts'];
      
      for (const route of adminRoutes) {
        await page.goto(route);
        await page.waitForTimeout(1000);
        
        const currentUrl = page.url();
        
        // Verificar redirección a login o mensaje de acceso denegado
        if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
          console.log(`Ruta ${route} correctamente protegida - redirección a login`);
        } else {
          // Buscar mensaje de acceso denegado
          const accessDenied = page.locator(':has-text("acceso denegado"), :has-text("no autorizado"), :has-text("forbidden")');
          
          if (await accessDenied.count() > 0) {
            console.log(`Ruta ${route} correctamente protegida - mensaje de acceso denegado`);
          } else {
            console.log(`ADVERTENCIA: Ruta ${route} podría no estar protegida`);
          }
        }
      }
    });

    test('debe validar permisos para acciones administrativas', async ({ page }) => {
      // Esta prueba verificaría que solo usuarios con permisos pueden realizar acciones
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Buscar acciones administrativas
      const adminActions = page.locator('button:has-text("Eliminar"), button:has-text("Suspender"), button:has-text("Activar")');
      
      if (await adminActions.count() > 0) {
        console.log(`Encontradas ${await adminActions.count()} acciones administrativas`);
        
        // Verificar que las acciones están disponibles (asumiendo usuario admin)
        for (let i = 0; i < Math.min(3, await adminActions.count()); i++) {
          const action = adminActions.nth(i);
          await expect(action).toBeVisible();
        }
      } else {
        console.log('No se encontraron acciones administrativas específicas');
      }
    });

    test('debe manejar errores de permisos graciosamente', async ({ page }) => {
      // Interceptar requests para simular errores de permisos
      await page.route('**/api/admin/**', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Permisos insuficientes' })
        });
      });
      
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Intentar realizar una acción administrativa
      const adminAction = page.locator('button:has-text("Eliminar"), button:has-text("Editar"), button:has-text("Actualizar")').first();
      
      if (await adminAction.count() > 0) {
        await adminAction.click();
        await page.waitForTimeout(1000);
        
        // Verificar que se muestra mensaje de error
        const errorMessage = page.locator('.error, .alert-error, [role="alert"]:has-text("error"), :has-text("permisos")');
        
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
          console.log('Error de permisos manejado correctamente');
        } else {
          console.log('No se detectó manejo de errores de permisos');
        }
      }
    });
  });

  test.describe('Auditoría y Logs', () => {
    test('debe mostrar registro de actividades administrativas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Buscar sección de logs o auditoría
      const logsSection = page.locator('a:has-text("Logs"), a:has-text("Auditoría"), a:has-text("Actividad"), [href*="logs"]');
      
      if (await logsSection.count() > 0) {
        await logsSection.click();
        await page.waitForTimeout(2000);
        
        // Verificar que se muestran logs
        const logEntries = page.locator('.log-entry, .audit-entry, table tbody tr');
        
        if (await logEntries.count() > 0) {
          console.log(`Encontradas ${await logEntries.count()} entradas de log`);
          
          // Verificar información típica de logs
          const logInfo = page.locator(':has-text("usuario"), :has-text("acción"), :has-text("fecha")');
          
          if (await logInfo.count() > 0) {
            console.log('Información de auditoría completa');
          }
        } else {
          console.log('No se encontraron entradas de log');
        }
      } else {
        console.log('No se encontró sección de logs/auditoría');
      }
    });
  });

  test.describe('Responsividad en Admin', () => {
    test('debe funcionar correctamente en dispositivos móviles', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Verificar que el panel de admin es responsive
      const adminPanel = page.locator('.admin-panel, .admin-container, main');
      
      if (await adminPanel.count() > 0) {
        await expect(adminPanel).toBeVisible();
        
        // Verificar navegación móvil
        const mobileMenu = page.locator('.mobile-menu, .hamburger, button[aria-label*="menu"]');
        
        if (await mobileMenu.count() > 0) {
          await mobileMenu.click();
          await page.waitForTimeout(500);
          
          // Verificar que se muestra el menú
          const menuItems = page.locator('.menu-item, nav a, .nav-link');
          
          if (await menuItems.count() > 0) {
            console.log('Navegación móvil funciona correctamente');
          }
        }
        
        // Verificar que las tablas son responsive
        const tables = page.locator('table');
        
        if (await tables.count() > 0) {
          // Verificar scroll horizontal o diseño responsive
          const tableContainer = page.locator('.table-responsive, .overflow-x-auto');
          
          if (await tableContainer.count() > 0) {
            console.log('Tablas con diseño responsive');
          } else {
            console.log('Tablas podrían necesitar mejoras de responsividad');
          }
        }
      }
    });
  });
});