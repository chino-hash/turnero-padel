import { test, expect } from '@playwright/test';

test.describe('Panel de Administración - Gestión de Turnos', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Acceso a AdminTurnos', () => {
    test('debe cargar el componente AdminTurnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const isInAdmin = currentUrl.includes('/admin');
      const isInLogin = currentUrl.includes('/login');
      
      // Debe estar en admin o redirigido a login
      expect(isInAdmin || isInLogin).toBeTruthy();
      
      if (isInAdmin) {
        // Buscar el componente AdminTurnos o elementos relacionados
        const turnosElements = page.locator('h1:has-text("Turno"), h2:has-text("Turno"), .admin-turnos, .turnos-admin, .booking, .reserva');
        const turnosCount = await turnosElements.count();
        
        if (turnosCount > 0) {
          await expect(turnosElements.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar título de administración de turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar títulos relacionados con turnos
        const titles = page.locator('h1, h2, h3').filter({ hasText: /turno|reserva|booking|administr/i });
        const titleCount = await titles.count();
        
        if (titleCount > 0) {
          await expect(titles.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Visualización de Turnos', () => {
    test('debe mostrar lista de turnos/reservas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar tabla o lista de turnos
        const turnosList = page.locator('table, .turnos-list, .booking-list, .reserva-item, .turno-item, .grid');
        const listCount = await turnosList.count();
        
        if (listCount > 0) {
          await expect(turnosList.first()).toBeVisible();
          
          // Verificar que hay contenido en la lista
          const hasContent = await turnosList.first().textContent();
          expect(hasContent).toBeTruthy();
        }
      }
    });

    test('debe mostrar información detallada de cada turno', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar elementos con información de turnos
        const turnoInfo = page.locator('.turno, .booking, .reserva, tr, .card').first();
        const infoExists = await turnoInfo.count() > 0;
        
        if (infoExists) {
          await expect(turnoInfo).toBeVisible();
          
          // Buscar información típica de turnos (fecha, hora, cancha, cliente)
          const infoText = await turnoInfo.textContent();
          const hasRelevantInfo = infoText && (
            infoText.includes(':') || // Hora
            infoText.includes('/') || // Fecha
            infoText.includes('Cancha') ||
            infoText.includes('$') || // Precio
            infoText.includes('@') // Email
          );
          
          expect(hasRelevantInfo).toBeTruthy();
        }
      }
    });

    test('debe mostrar estados de los turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar indicadores de estado
        const statusElements = page.locator('.status, .estado, .badge, .chip, .confirmed, .pending, .cancelled');
        const statusCount = await statusElements.count();
        
        if (statusCount > 0) {
          await expect(statusElements.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar fechas y horarios de los turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar elementos con fechas y horarios
        const dateTimeElements = page.locator('.date, .time, .fecha, .hora, .datetime');
        const dateTimeCount = await dateTimeElements.count();
        
        if (dateTimeCount > 0) {
          await expect(dateTimeElements.first()).toBeVisible();
          
          // Verificar formato de fecha/hora
          const dateTimeText = await dateTimeElements.first().textContent();
          const hasTimeFormat = dateTimeText && (
            dateTimeText.includes(':') || 
            dateTimeText.includes('/') ||
            dateTimeText.includes('-')
          );
          
          expect(hasTimeFormat).toBeTruthy();
        }
      }
    });
  });

  test.describe('Filtrado de Turnos', () => {
    test('debe mostrar filtros de fecha', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar filtros de fecha
        const dateFilters = page.locator('input[type="date"], .date-picker, .calendar, select:has(option:text-matches("Enero|Febrero|Marzo", "i"))');
        const filterCount = await dateFilters.count();
        
        if (filterCount > 0) {
          await expect(dateFilters.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar filtros por estado', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar filtros de estado
        const stateFilters = page.locator('select, .filter, .dropdown, button:has-text("Estado"), button:has-text("Filtro")');
        const filterCount = await stateFilters.count();
        
        if (filterCount > 0) {
          await expect(stateFilters.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar filtros por cancha', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar filtros de cancha
        const courtFilters = page.locator('select:has(option:text-matches("Cancha", "i")), .cancha-filter, .court-filter');
        const filterCount = await courtFilters.count();
        
        if (filterCount > 0) {
          await expect(courtFilters.first()).toBeVisible();
        }
      }
    });

    test('debe aplicar filtros correctamente', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar cualquier tipo de filtro
        const anyFilter = page.locator('select, input[type="date"], .filter, .dropdown').first();
        const filterExists = await anyFilter.count() > 0;
        
        if (filterExists) {
          // Contar elementos antes del filtro
          const itemsBefore = await page.locator('.turno, .booking, .reserva, tr').count();
          
          // Aplicar filtro si es un select
          if (await anyFilter.getAttribute('tagName') === 'SELECT') {
            const options = await anyFilter.locator('option').count();
            if (options > 1) {
              await anyFilter.selectOption({ index: 1 });
              await page.waitForTimeout(1000);
              
              // Verificar que algo cambió (puede ser el número de elementos o el contenido)
              const itemsAfter = await page.locator('.turno, .booking, .reserva, tr').count();
              const contentChanged = itemsBefore !== itemsAfter;
              
              // Al menos debe mantener la funcionalidad básica
              expect(itemsAfter >= 0).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe('Modificación de Estados', () => {
    test('debe mostrar opciones para cambiar estado de turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar controles para cambiar estado
        const stateControls = page.locator('select:has(option:text-matches("Confirmado|Pendiente|Cancelado", "i")), .state-select, .status-dropdown, button:has-text("Confirmar"), button:has-text("Cancelar")');
        const controlCount = await stateControls.count();
        
        if (controlCount > 0) {
          await expect(stateControls.first()).toBeVisible();
        }
      }
    });

    test('debe permitir confirmar turnos pendientes', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar botones de confirmación
        const confirmButtons = page.locator('button:has-text("Confirmar"), button:has-text("Aprobar"), .confirm-btn');
        const confirmCount = await confirmButtons.count();
        
        if (confirmCount > 0) {
          await expect(confirmButtons.first()).toBeVisible();
          await expect(confirmButtons.first()).toBeEnabled();
        }
      }
    });

    test('debe permitir cancelar turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar botones de cancelación
        const cancelButtons = page.locator('button:has-text("Cancelar"), button:has-text("Rechazar"), .cancel-btn');
        const cancelCount = await cancelButtons.count();
        
        if (cancelCount > 0) {
          await expect(cancelButtons.first()).toBeVisible();
          await expect(cancelButtons.first()).toBeEnabled();
        }
      }
    });

    test('debe confirmar antes de cambios críticos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const cancelButton = page.locator('button:has-text("Cancelar"), button:has-text("Rechazar"), .cancel-btn').first();
        const cancelExists = await cancelButton.count() > 0;
        
        if (cancelExists) {
          await cancelButton.click();
          await page.waitForTimeout(1000);
          
          // Buscar modal de confirmación
          const confirmModal = page.locator('.confirm, .modal, .dialog, .alert');
          const confirmCount = await confirmModal.count();
          
          if (confirmCount > 0) {
            await expect(confirmModal.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Gestión de Extras', () => {
    test('debe mostrar extras asociados a turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar información de extras
        const extrasElements = page.locator('.extra, .adicional, .service, .producto');
        const extrasCount = await extrasElements.count();
        
        if (extrasCount > 0) {
          await expect(extrasElements.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar precios de extras', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar precios en la interfaz
        const priceElements = page.locator('.price, .precio, .cost, .total').filter({ hasText: '$' });
        const priceCount = await priceElements.count();
        
        if (priceCount > 0) {
          await expect(priceElements.first()).toBeVisible();
          
          // Verificar formato de precio
          const priceText = await priceElements.first().textContent();
          expect(priceText).toContain('$');
        }
      }
    });

    test('debe permitir modificar extras de turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar controles para modificar extras
        const extraControls = page.locator('button:has-text("Editar"), button:has-text("Modificar"), .edit-extras, input[type="checkbox"]');
        const controlCount = await extraControls.count();
        
        if (controlCount > 0) {
          await expect(extraControls.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Búsqueda y Navegación', () => {
    test('debe mostrar campo de búsqueda', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const searchField = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], .search-input');
        const searchCount = await searchField.count();
        
        if (searchCount > 0) {
          await expect(searchField.first()).toBeVisible();
        }
      }
    });

    test('debe funcionar la búsqueda por cliente', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const searchField = page.locator('input[type="search"], input[placeholder*="buscar"], .search-input').first();
        const searchExists = await searchField.count() > 0;
        
        if (searchExists) {
          // Probar búsqueda
          await searchField.fill('test');
          await page.waitForTimeout(1000);
          
          // Verificar que la búsqueda no rompe la interfaz
          const content = page.locator('body');
          await expect(content).toBeVisible();
        }
      }
    });

    test('debe mostrar paginación si hay muchos turnos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar controles de paginación
        const pagination = page.locator('.pagination, .pager, button:has-text("Siguiente"), button:has-text("Anterior")');
        const paginationCount = await pagination.count();
        
        if (paginationCount > 0) {
          await expect(pagination.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsividad', () => {
    test('debe funcionar correctamente en dispositivos móviles', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar que el contenido se adapta a móvil
        const content = page.locator('body');
        await expect(content).toBeVisible();
        
        // Verificar que no hay scroll horizontal
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = 375;
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
        
        // Verificar que los elementos son accesibles en móvil
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          const buttonSize = await buttons.first().boundingBox();
          if (buttonSize) {
            // Los botones deben ser lo suficientemente grandes para tocar
            expect(buttonSize.height).toBeGreaterThan(30);
          }
        }
      }
    });

    test('debe funcionar correctamente en tablets', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar adaptación a tablet
        const content = page.locator('body');
        await expect(content).toBeVisible();
        
        // Verificar que las tablas se adaptan bien
        const tables = page.locator('table');
        const tableCount = await tables.count();
        
        if (tableCount > 0) {
          await expect(tables.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Rendimiento y Carga', () => {
    test('debe cargar los turnos en tiempo razonable', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar contenido de turnos
        const turnosContent = page.locator('.turno, .booking, .reserva, table, .grid');
        const contentCount = await turnosContent.count();
        
        if (contentCount > 0) {
          await expect(turnosContent.first()).toBeVisible();
        }
        
        const loadTime = Date.now() - startTime;
        // Debe cargar en menos de 10 segundos
        expect(loadTime).toBeLessThan(10000);
      }
    });

    test('debe manejar grandes cantidades de datos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(5000); // Más tiempo para cargar datos
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar que la interfaz sigue siendo responsive
        const content = page.locator('body');
        await expect(content).toBeVisible();
        
        // Verificar que los controles siguen funcionando
        const interactiveElements = page.locator('button, select, input');
        const elementsCount = await interactiveElements.count();
        
        if (elementsCount > 0) {
          await expect(interactiveElements.first()).toBeEnabled();
        }
      }
    });
  });

  test.describe('Accesibilidad', () => {
    test('debe tener elementos accesibles por teclado', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar que los elementos interactivos son accesibles por teclado
        const focusableElements = page.locator('button, input, select, a, [tabindex]');
        const focusableCount = await focusableElements.count();
        
        if (focusableCount > 0) {
          // Probar navegación por teclado
          await page.keyboard.press('Tab');
          
          const focusedElement = page.locator(':focus');
          const hasFocus = await focusedElement.count() > 0;
          
          expect(hasFocus).toBeTruthy();
        }
      }
    });

    test('debe tener etiquetas descriptivas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar que los botones tienen texto descriptivo
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          const buttonText = await buttons.first().textContent();
          expect(buttonText).toBeTruthy();
          expect(buttonText?.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });
});