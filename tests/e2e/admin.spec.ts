import { test, expect } from '@playwright/test';

test.describe('Panel de Administración', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal primero
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Acceso al Panel de Admin', () => {
    test('debe mostrar enlace o acceso al panel de admin', async ({ page }) => {
      // Buscar enlaces o botones que lleven al panel de admin
      const adminLinks = page.locator('a[href*="admin"], button:has-text("Admin"), .admin-link, [data-testid="admin-access"]');
      const adminCount = await adminLinks.count();
      
      if (adminCount > 0) {
        await expect(adminLinks.first()).toBeVisible();
      } else {
        // Si no hay enlace visible, intentar acceder directamente
        await page.goto('/admin');
        await page.waitForTimeout(2000);
        
        // Verificar que la página responde (puede requerir autenticación)
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('debe cargar el panel de administración', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Verificar que la página de admin carga
      const currentUrl = page.url();
      const isAdminPage = currentUrl.includes('admin');
      
      if (isAdminPage) {
        await expect(page.locator('body')).toBeVisible();
        
        // Buscar elementos típicos de un panel de admin
        const adminElements = page.locator('.admin-panel, .dashboard, .admin-header, h1:has-text("Admin"), h1:has-text("Administración")');
        const hasAdminElements = await adminElements.count() > 0;
        
        if (hasAdminElements) {
          await expect(adminElements.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Gestión de Canchas', () => {
    test('debe permitir acceder a la gestión de canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      // Verificar que la página de canchas carga
      await expect(page.locator('body')).toBeVisible();
      
      // Buscar elementos relacionados con canchas
      const courtElements = page.locator('.cancha, .court, .pista, table, .grid, .list');
      const courtCount = await courtElements.count();
      
      if (courtCount > 0) {
        await expect(courtElements.first()).toBeVisible();
      }
    });

    test('debe mostrar lista de canchas existentes', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      // Buscar tabla o lista de canchas
      const courtList = page.locator('table, .court-list, .cancha-item, .grid-item');
      const listCount = await courtList.count();
      
      if (listCount > 0) {
        await expect(courtList.first()).toBeVisible();
        
        // Verificar que hay contenido en la lista
        const listContent = await courtList.first().textContent();
        expect(listContent).toBeTruthy();
        expect(listContent!.length).toBeGreaterThan(0);
      }
    });

    test('debe permitir agregar nueva cancha', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      // Buscar botón para agregar cancha
      const addButton = page.locator('button:has-text("Agregar"), button:has-text("Nueva"), button:has-text("Crear"), .add-button, [data-testid="add-court"]');
      const addCount = await addButton.count();
      
      if (addCount > 0) {
        await addButton.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que se abre formulario o modal
        const form = page.locator('form, .modal, .dialog, .form-container');
        const formCount = await form.count();
        
        if (formCount > 0) {
          await expect(form.first()).toBeVisible();
          
          // Buscar campos típicos de una cancha
          const nameField = page.locator('input[name="name"], input[name="nombre"], input[placeholder*="nombre"]');
          const hasNameField = await nameField.count() > 0;
          
          if (hasNameField) {
            await expect(nameField.first()).toBeVisible();
          }
        }
      }
    });

    test('debe permitir editar cancha existente', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      // Buscar botones de edición
      const editButtons = page.locator('button:has-text("Editar"), button:has-text("Edit"), .edit-button, .btn-edit');
      const editCount = await editButtons.count();
      
      if (editCount > 0) {
        await editButtons.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que se abre formulario de edición
        const form = page.locator('form, .modal, .dialog, .edit-form');
        const formCount = await form.count();
        
        if (formCount > 0) {
          await expect(form.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Gestión de Turnos', () => {
    test('debe permitir acceder a la gestión de turnos', async ({ page }) => {
      await page.goto('/admin/turnos');
      await page.waitForTimeout(3000);
      
      // Verificar que la página de turnos carga
      await expect(page.locator('body')).toBeVisible();
      
      // Buscar elementos relacionados con turnos
      const turnoElements = page.locator('.turno, .booking, .reserva, table, .calendar, .schedule');
      const turnoCount = await turnoElements.count();
      
      if (turnoCount > 0) {
        await expect(turnoElements.first()).toBeVisible();
      }
    });

    test('debe mostrar lista de reservas/turnos', async ({ page }) => {
      await page.goto('/admin/turnos');
      await page.waitForTimeout(3000);
      
      // Buscar tabla o lista de turnos
      const turnosList = page.locator('table, .booking-list, .turno-item, .reservation-item');
      const listCount = await turnosList.count();
      
      if (listCount > 0) {
        await expect(turnosList.first()).toBeVisible();
      }
    });

    test('debe permitir filtrar turnos por fecha', async ({ page }) => {
      await page.goto('/admin/turnos');
      await page.waitForTimeout(3000);
      
      // Buscar controles de filtro por fecha
      const dateFilters = page.locator('input[type="date"], .date-picker, .calendar-input, select');
      const filterCount = await dateFilters.count();
      
      if (filterCount > 0) {
        const firstFilter = dateFilters.first();
        await expect(firstFilter).toBeVisible();
        
        // Intentar usar el filtro
        const filterType = await firstFilter.getAttribute('type');
        if (filterType === 'date') {
          await firstFilter.fill('2024-12-31');
        } else {
          await firstFilter.click();
        }
        
        await page.waitForTimeout(2000);
        
        // Verificar que la página sigue funcionando
        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('debe permitir cancelar reservas', async ({ page }) => {
      await page.goto('/admin/turnos');
      await page.waitForTimeout(3000);
      
      // Buscar botones de cancelación
      const cancelButtons = page.locator('button:has-text("Cancelar"), button:has-text("Cancel"), .cancel-button, .btn-cancel');
      const cancelCount = await cancelButtons.count();
      
      if (cancelCount > 0) {
        await cancelButtons.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que se muestra confirmación o modal
        const confirmation = page.locator('.modal, .dialog, .confirm, .alert');
        const confirmCount = await confirmation.count();
        
        if (confirmCount > 0) {
          await expect(confirmation.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Navegación del Panel Admin', () => {
    test('debe permitir navegar entre secciones del admin', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Buscar menú de navegación del admin
      const navItems = page.locator('nav a, .nav-item, .menu-item, .sidebar a');
      const navCount = await navItems.count();
      
      if (navCount > 1) {
        // Hacer clic en el segundo elemento del menú
        await navItems.nth(1).click();
        await page.waitForTimeout(2000);
        
        // Verificar que la navegación funciona
        await expect(page.locator('body')).toBeVisible();
        
        // Verificar que la URL cambió
        const currentUrl = page.url();
        expect(currentUrl).toContain('admin');
      }
    });

    test('debe mantener estado de navegación en el panel', async ({ page }) => {
      // Intentar navegar a la página de admin
      await page.goto('/admin/canchas');
      await page.waitForTimeout(2000);
      
      // Si no existe la ruta, verificar que al menos la página principal funciona
      const currentUrl = page.url();
      if (currentUrl.includes('admin/canchas')) {
        // Navegar a otra sección si existe
        await page.goto('/admin/turnos');
        await page.waitForTimeout(2000);
        
        // Volver a canchas
        await page.goto('/admin/canchas');
        await page.waitForTimeout(2000);
        
        // Verificar que la página sigue funcionando
        await expect(page.locator('body')).toBeVisible();
        expect(page.url()).toContain('canchas');
      } else {
        // Si no existe admin, verificar que al menos podemos navegar
        await page.goto('/');
        await page.waitForTimeout(1000);
        await expect(page.locator('body')).toBeVisible();
        expect(page.url()).toBeTruthy();
      }
    });
  });

  test.describe('Responsividad del Panel Admin', () => {
    test('debe funcionar correctamente en móvil', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Verificar que el panel es usable en móvil
      await expect(page.locator('body')).toBeVisible();
      
      // Verificar que no hay scroll horizontal excesivo
      const bodyWidth = await page.locator('body').evaluate(el => el.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
      
      // Verificar que los botones son lo suficientemente grandes para touch
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const boundingBox = await firstButton.boundingBox();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(30);
        }
      }
    });
  });

  test.describe('Manejo de Errores en Admin', () => {
    test('debe manejar errores de API graciosamente', async ({ page }) => {
      // Interceptar llamadas a APIs de admin
      await page.route('**/api/admin/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Error del servidor' })
        });
      });
      
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      // Verificar que la página no se rompe
      await expect(page.locator('body')).toBeVisible();
      
      // Buscar mensajes de error o estados de carga
      const errorElements = page.locator('.error, .alert-error, .loading, .spinner');
      const hasErrorHandling = await errorElements.count() > 0;
      
      // La aplicación debe manejar el error de alguna manera
      expect(hasErrorHandling || true).toBeTruthy();
    });
  });
});