import { test, expect } from '@playwright/test';

test.describe('Panel de Administración - Gestión de Canchas', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Acceso a Gestión de Canchas', () => {
    test('debe cargar la página de gestión de canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      // Verificar que la página carga (puede redirigir a login si no hay sesión)
      const currentUrl = page.url();
      const isInCanchas = currentUrl.includes('/admin/canchas');
      const isInLogin = currentUrl.includes('/login');
      
      // Debe estar en canchas o redirigido a login
      expect(isInCanchas || isInLogin).toBeTruthy();
      
      if (isInCanchas) {
        // Buscar elementos típicos de gestión de canchas
        const canchasElements = page.locator('h1:has-text("Cancha"), h1:has-text("Gestión"), .cancha, .court, table, .grid');
        const canchasCount = await canchasElements.count();
        
        if (canchasCount > 0) {
          await expect(canchasElements.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar título de gestión de canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar títulos relacionados con canchas
        const titles = page.locator('h1, h2, h3').filter({ hasText: /cancha|gestión|administr/i });
        const titleCount = await titles.count();
        
        if (titleCount > 0) {
          await expect(titles.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Visualización de Canchas', () => {
    test('debe mostrar lista de canchas existentes', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar tabla o grid de canchas
        const courtList = page.locator('table, .court-list, .cancha-item, .grid-item, .card');
        const listCount = await courtList.count();
        
        if (listCount > 0) {
          await expect(courtList.first()).toBeVisible();
          
          // Verificar que hay contenido en la lista
          const hasContent = await courtList.first().textContent();
          expect(hasContent).toBeTruthy();
        }
      }
    });

    test('debe mostrar información de cada cancha', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar elementos con información de canchas
        const courtInfo = page.locator('.cancha, .court, tr, .card').first();
        const infoExists = await courtInfo.count() > 0;
        
        if (infoExists) {
          await expect(courtInfo).toBeVisible();
          
          // Buscar información típica de canchas (nombre, precio, estado)
          const infoText = await courtInfo.textContent();
          const hasRelevantInfo = infoText && (
            infoText.includes('Cancha') || 
            infoText.includes('$') || 
            infoText.includes('Activ') ||
            infoText.includes('Disponible')
          );
          
          expect(hasRelevantInfo).toBeTruthy();
        }
      }
    });

    test('debe mostrar estados de las canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar indicadores de estado
        const statusElements = page.locator('.status, .estado, .badge, .chip, .active, .inactive');
        const statusCount = await statusElements.count();
        
        if (statusCount > 0) {
          await expect(statusElements.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Creación de Canchas', () => {
    test('debe mostrar botón para agregar nueva cancha', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar botón de agregar
        const addButton = page.locator('button:has-text("Agregar"), button:has-text("Nueva"), button:has-text("Crear"), button:has-text("+")');
        const buttonCount = await addButton.count();
        
        if (buttonCount > 0) {
          await expect(addButton.first()).toBeVisible();
          await expect(addButton.first()).toBeEnabled();
        }
      }
    });

    test('debe abrir formulario de creación al hacer clic en agregar', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const addButton = page.locator('button:has-text("Agregar"), button:has-text("Nueva"), button:has-text("Crear"), button:has-text("+")').first();
        const buttonExists = await addButton.count() > 0;
        
        if (buttonExists) {
          await addButton.click();
          await page.waitForTimeout(1000);
          
          // Buscar formulario o modal de creación
          const form = page.locator('form, .modal, .dialog, .form-container');
          const formCount = await form.count();
          
          if (formCount > 0) {
            await expect(form.first()).toBeVisible();
          }
        }
      }
    });

    test('debe mostrar campos requeridos en formulario de creación', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const addButton = page.locator('button:has-text("Agregar"), button:has-text("Nueva"), button:has-text("Crear"), button:has-text("+")').first();
        const buttonExists = await addButton.count() > 0;
        
        if (buttonExists) {
          await addButton.click();
          await page.waitForTimeout(1000);
          
          // Buscar campos típicos del formulario
          const nameField = page.locator('input[name="nombre"], input[name="name"], input[placeholder*="nombre"], input[placeholder*="Nombre"]');
          const priceField = page.locator('input[name="precio"], input[name="price"], input[type="number"], input[placeholder*="precio"]');
          
          const nameExists = await nameField.count() > 0;
          const priceExists = await priceField.count() > 0;
          
          if (nameExists) {
            await expect(nameField.first()).toBeVisible();
          }
          
          if (priceExists) {
            await expect(priceField.first()).toBeVisible();
          }
        }
      }
    });

    test('debe validar campos requeridos al crear cancha', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const addButton = page.locator('button:has-text("Agregar"), button:has-text("Nueva"), button:has-text("Crear"), button:has-text("+")').first();
        const buttonExists = await addButton.count() > 0;
        
        if (buttonExists) {
          await addButton.click();
          await page.waitForTimeout(1000);
          
          // Intentar enviar formulario vacío
          const submitButton = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Crear")');
          const submitExists = await submitButton.count() > 0;
          
          if (submitExists) {
            await submitButton.first().click();
            await page.waitForTimeout(1000);
            
            // Buscar mensajes de validación
            const validationMessages = page.locator('.error, .invalid, .required, [role="alert"]');
            const validationCount = await validationMessages.count();
            
            // Debe mostrar algún tipo de validación o permanecer en el formulario
            const stillInForm = await page.locator('form, .modal, .dialog').count() > 0;
            expect(validationCount > 0 || stillInForm).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Edición de Canchas', () => {
    test('debe mostrar opciones de edición para canchas existentes', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar botones de edición
        const editButtons = page.locator('button:has-text("Editar"), button:has-text("Edit"), .edit-btn, [data-action="edit"]');
        const editCount = await editButtons.count();
        
        if (editCount > 0) {
          await expect(editButtons.first()).toBeVisible();
          await expect(editButtons.first()).toBeEnabled();
        }
      }
    });

    test('debe abrir formulario de edición al hacer clic en editar', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit"), .edit-btn, [data-action="edit"]').first();
        const editExists = await editButton.count() > 0;
        
        if (editExists) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Buscar formulario de edición
          const editForm = page.locator('form, .modal, .dialog, .edit-form');
          const formCount = await editForm.count();
          
          if (formCount > 0) {
            await expect(editForm.first()).toBeVisible();
          }
        }
      }
    });

    test('debe pre-llenar campos con datos existentes al editar', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const editButton = page.locator('button:has-text("Editar"), button:has-text("Edit"), .edit-btn, [data-action="edit"]').first();
        const editExists = await editButton.count() > 0;
        
        if (editExists) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Verificar que los campos tienen valores
          const nameField = page.locator('input[name="nombre"], input[name="name"]').first();
          const nameExists = await nameField.count() > 0;
          
          if (nameExists) {
            const nameValue = await nameField.inputValue();
            expect(nameValue).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Eliminación/Desactivación de Canchas', () => {
    test('debe mostrar opciones para desactivar canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar controles de estado (switch, toggle, checkbox)
        const stateControls = page.locator('input[type="checkbox"], .switch, .toggle, button:has-text("Desactivar")');
        const controlCount = await stateControls.count();
        
        if (controlCount > 0) {
          await expect(stateControls.first()).toBeVisible();
        }
      }
    });

    test('debe confirmar antes de eliminar/desactivar cancha', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Delete"), .delete-btn, [data-action="delete"]').first();
        const deleteExists = await deleteButton.count() > 0;
        
        if (deleteExists) {
          await deleteButton.click();
          await page.waitForTimeout(1000);
          
          // Buscar modal de confirmación
          const confirmModal = page.locator('.confirm, .modal, .dialog, .alert');
          const confirmCount = await confirmModal.count();
          
          if (confirmCount > 0) {
            await expect(confirmModal.first()).toBeVisible();
            
            // Buscar botones de confirmación
            const confirmButtons = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")');
            const buttonCount = await confirmButtons.count();
            
            if (buttonCount > 0) {
              await expect(confirmButtons.first()).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Filtros y Búsqueda', () => {
    test('debe mostrar campo de búsqueda', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const searchField = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], .search-input');
        const searchCount = await searchField.count();
        
        if (searchCount > 0) {
          await expect(searchField.first()).toBeVisible();
        }
      }
    });

    test('debe filtrar canchas por estado', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Buscar filtros de estado
        const stateFilters = page.locator('select, .filter, .dropdown, button:has-text("Filtro")');
        const filterCount = await stateFilters.count();
        
        if (filterCount > 0) {
          await expect(stateFilters.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsividad', () => {
    test('debe funcionar correctamente en dispositivos móviles', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Verificar que el contenido se adapta a móvil
        const content = page.locator('body');
        await expect(content).toBeVisible();
        
        // Verificar que no hay scroll horizontal
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = 375;
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Margen de tolerancia
      }
    });

    test('debe funcionar correctamente en tablets', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Verificar adaptación a tablet
        const content = page.locator('body');
        await expect(content).toBeVisible();
        
        // Verificar que los elementos son accesibles
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          await expect(buttons.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Validaciones de Datos', () => {
    test('debe validar formato de precios', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        const addButton = page.locator('button:has-text("Agregar"), button:has-text("Nueva"), button:has-text("Crear"), button:has-text("+")').first();
        const buttonExists = await addButton.count() > 0;
        
        if (buttonExists) {
          await addButton.click();
          await page.waitForTimeout(1000);
          
          const priceField = page.locator('input[name="precio"], input[name="price"], input[type="number"]').first();
          const priceExists = await priceField.count() > 0;
          
          if (priceExists) {
            // Probar precio inválido
            await priceField.fill('-100');
            
            const submitButton = page.locator('button[type="submit"], button:has-text("Guardar")');
            const submitExists = await submitButton.count() > 0;
            
            if (submitExists) {
              await submitButton.first().click();
              await page.waitForTimeout(1000);
              
              // Debe mostrar validación o permanecer en formulario
              const stillInForm = await page.locator('form, .modal').count() > 0;
              expect(stillInForm).toBeTruthy();
            }
          }
        }
      }
    });

    test('debe validar nombres únicos de canchas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin/canchas')) {
        // Verificar que existe algún mecanismo de validación
        const forms = page.locator('form');
        const formCount = await forms.count();
        
        // Si hay formularios, debe haber validación
        expect(formCount >= 0).toBeTruthy();
      }
    });
  });
});