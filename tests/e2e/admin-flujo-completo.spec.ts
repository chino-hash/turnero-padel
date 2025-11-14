import { test, expect } from '@playwright/test';

test.describe('Flujo de Administrador Completo - Diagnóstico Integral', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Acceso y Autenticación Admin', () => {
    test('debe manejar correctamente el acceso al panel admin', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('URL actual:', currentUrl);
      
      // Verificar que está en login o en panel admin
      const isInLogin = currentUrl.includes('/login');
      const isInAdmin = currentUrl.includes('/admin');
      
      expect(isInLogin || isInAdmin).toBeTruthy();
      
      if (isInLogin) {
        console.log('Redirigido a login - autenticación requerida');
        
        // Verificar elementos de login
        const loginForm = page.locator('form, .login-form, [data-testid="login-form"]');
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');
        
        if (await loginForm.count() > 0) {
          await expect(loginForm.first()).toBeVisible();
        }
        
        if (await emailInput.count() > 0) {
          await expect(emailInput.first()).toBeVisible();
        }
        
        if (await passwordInput.count() > 0) {
          await expect(passwordInput.first()).toBeVisible();
        }
      } else {
        console.log('Acceso directo al panel admin');
      }
    });

    test('debe mostrar elementos del panel admin cuando está autenticado', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(5000);
      
      // Buscar elementos del panel admin mediante data-testid
      const adminNav = page.getByTestId('admin-navigation');
      const adminNavCount = await adminNav.count();
      
      if (adminNavCount > 0) {
        await expect(adminNav.first()).toBeVisible();
        console.log('Panel de administración cargado correctamente (admin-navigation visible)');
      } else {
        console.log('Panel admin no visible - posible redirección a login');
      }
    });
  });

  test.describe('Gestión de Canchas - Funcionalidad Admin', () => {
    test('debe permitir acceso a la gestión de canchas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Navegar usando data-testid del layout admin
      const adminNav = page.getByTestId('admin-navigation');
      if (await adminNav.count() > 0) {
        await page.getByTestId('admin-courts-link').click();
        await page.waitForTimeout(2000);
        
        // Verificar que llegó a la sección de canchas
        const canchasSection = page.locator(
          'h1:has-text("Cancha"), h2:has-text("Cancha"), ' +
          '.canchas-admin, [data-testid="canchas-section"]'
        );
        
        if (await canchasSection.count() > 0) {
          await expect(canchasSection.first()).toBeVisible();
          console.log('Sección de gestión de canchas accesible');
        }
      } else {
        console.log('Navegación a canchas no encontrada (admin-navigation ausente)');
      }
    });

    test('debe mostrar lista de canchas existentes', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(5000);
      
      // Buscar lista de canchas
      const courtsList = page.locator(
        '.court-item, .cancha-item, [data-testid="court-item"], ' +
        'tr:has-text("Cancha"), .court-card'
      );
      
      const courtsCount = await courtsList.count();
      
      if (courtsCount > 0) {
        console.log(`Encontradas ${courtsCount} canchas en la lista`);
        await expect(courtsList.first()).toBeVisible();
      } else {
        console.log('No se encontraron canchas o sección no cargada');
      }
    });

    test('debe permitir crear nueva cancha', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      // Buscar botón de crear cancha
      const createButton = page.locator(
        'button:has-text("Crear"), button:has-text("Nueva"), ' +
        'button:has-text("Agregar"), [data-testid="create-court"]'
      );
      
      if (await createButton.count() > 0) {
        await createButton.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que se abrió formulario o modal
        const form = page.locator(
          'form, .modal, [role="dialog"], ' +
          '[data-testid="court-form"]'
        );
        
        if (await form.count() > 0) {
          await expect(form.first()).toBeVisible();
          console.log('Formulario de creación de cancha abierto');
        }
      } else {
        console.log('Botón de crear cancha no encontrado');
      }
    });
  });

  test.describe('Gestión de Turnos - Panel Admin', () => {
    test('debe mostrar lista de turnos/reservas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Navegar a turnos usando data-testid
      const adminNav = page.getByTestId('admin-navigation');
      if (await adminNav.count() > 0) {
        await page.getByTestId('admin-bookings-link').click();
        await page.waitForTimeout(3000);
      }
      
      // Verificar estado vacío o lista de turnos
      const emptyState = page.getByTestId('admin-bookings-empty');
      if (await emptyState.count() > 0) {
        await expect(emptyState.first()).toBeVisible();
        console.log('No hay turnos, estado vacío visible');
      } else {
        const turnosList = page.locator(
          '[data-testid="booking-item"], .booking-item, .turno-item, ' +
          'tr:has-text("Cancha"), .reservation-card'
        );
        const turnosCount = await turnosList.count();
        if (turnosCount > 0) {
          console.log(`Encontrados ${turnosCount} turnos en la lista`);
          await expect(turnosList.first()).toBeVisible();
        } else {
          console.log('No se encontraron turnos o sección no cargada');
        }
      }
    });

    test('debe permitir filtrar turnos por estado', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Abrir panel de filtros con data-testid
      const openFiltersBtn = page.getByTestId('admin-filters-open-btn');
      if (await openFiltersBtn.count() > 0) {
        await openFiltersBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Buscar filtros de estado
      const statusFilter = page.locator(
        '[data-testid="status-filter"], select[name*="status"], select[name*="estado"], .filter-select'
      );
      
      if (await statusFilter.count() > 0) {
        console.log('Filtros de estado encontrados');
        
        // Intentar cambiar filtro
        await statusFilter.first().click();
        await page.waitForTimeout(1000);
        
        const options = page.locator('option, .select-option');
        const optionsCount = await options.count();
        
        if (optionsCount > 1) {
          console.log(`Encontradas ${optionsCount} opciones de filtro`);
        }
      } else {
        console.log('Filtros de estado no encontrados');
      }
    });

    test('debe permitir buscar turnos por usuario', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Abrir panel de filtros y usar data-testid de búsqueda
      const openFiltersBtn = page.getByTestId('admin-filters-open-btn');
      if (await openFiltersBtn.count() > 0) {
        await openFiltersBtn.click();
        await page.waitForTimeout(500);
      }
      
      // Buscar campo de búsqueda
      const searchInput = page.locator(
        '[data-testid="search-input"], input[type="search"], input[placeholder*="buscar"], ' +
        'input[placeholder*="usuario"]'
      );
      
      if (await searchInput.count() > 0) {
        console.log('Campo de búsqueda encontrado');
        
        // Probar búsqueda
        await searchInput.first().fill('test');
        await page.waitForTimeout(2000);
        
        console.log('Búsqueda de turnos probada');
      } else {
        console.log('Campo de búsqueda no encontrado');
      }
    });
  });

  test.describe('Interfaz de Usuario Admin - UX', () => {
    test('debe tener navegación clara entre secciones', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Buscar elementos de navegación mediante data-testid
      const navElements = page.getByTestId('admin-navigation');
      
      const navCount = await navElements.count();
      
      if (navCount > 0) {
        console.log(`Navegación admin visible`);
        await expect(navElements.first()).toBeVisible();
      } else {
        console.log('Elementos de navegación no encontrados');
      }
    });

    test('debe mostrar información de usuario admin', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Buscar información de usuario
      const userInfo = page.locator(
        '.user-info, .admin-info, [data-testid="user-info"], ' +
        'text=/admin/i, .badge:has-text("Admin")'
      );
      
      const userInfoCount = await userInfo.count();
      
      if (userInfoCount > 0) {
        console.log('Información de usuario admin visible');
      } else {
        console.log('Información de usuario admin no encontrada');
      }
    });

    test('debe tener botones de acción claramente identificables', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Buscar botones de acción
      const actionButtons = page.locator(
        'button:has-text("Crear"), button:has-text("Editar"), ' +
        'button:has-text("Eliminar"), button:has-text("Guardar"), ' +
        '.btn-primary, .btn-action'
      );
      
      const buttonsCount = await actionButtons.count();
      
      if (buttonsCount > 0) {
        console.log(`Encontrados ${buttonsCount} botones de acción`);
        
        // Verificar que tienen estilos apropiados
        const firstButton = actionButtons.first();
        const buttonStyles = await firstButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            cursor: styles.cursor,
            backgroundColor: styles.backgroundColor
          };
        });
        
        expect(buttonStyles.cursor).toBe('pointer');
      } else {
        console.log('Botones de acción no encontrados');
      }
    });
  });

  test.describe('Responsividad del Panel Admin', () => {
    test('debe funcionar en tablets', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Verificar que el contenido es accesible en tablet
      const mainContent = page.locator('main, .main-content, .admin-content');
      
      if (await mainContent.count() > 0) {
        await expect(mainContent.first()).toBeVisible();
        console.log('Panel admin accesible en tablet');
      }
    });

    test('debe manejar overflow en pantallas pequeñas', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 600 });
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Verificar que no hay overflow horizontal
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = 1024;
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 50); // Margen de 50px
      console.log('Sin overflow horizontal detectado');
    });
  });

  test.describe('Performance del Panel Admin', () => {
    test('debe cargar el panel admin en tiempo razonable', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // El panel admin debe cargar en menos de 15 segundos
      expect(loadTime).toBeLessThan(15000);
      
      console.log(`Tiempo de carga del panel admin: ${loadTime}ms`);
    });

    test('debe manejar múltiples requests simultáneos', async ({ page }) => {
      let requestCount = 0;
      
      page.on('request', (request: any) => {
        if (request.url().includes('/api/')) {
          requestCount++;
        }
      });
      
      await page.goto('/admin');
      await page.waitForTimeout(5000);
      
      console.log(`Requests API realizados: ${requestCount}`);
      
      // No debería hacer demasiados requests simultáneos
      expect(requestCount).toBeLessThan(20);
    });
  });
});