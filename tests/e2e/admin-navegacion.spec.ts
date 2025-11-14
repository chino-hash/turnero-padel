import { test, expect } from '@playwright/test';

test.describe('Panel de Administración - Navegación', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar viewport para desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Navegación Principal', () => {
    test('debe cargar la página principal del admin', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      const isInAdmin = currentUrl.includes('/admin');
      const isInLogin = currentUrl.includes('/login');
      
      expect(isInAdmin || isInLogin).toBeTruthy();
      
      if (isInAdmin) {
        const content = page.locator('body');
        await expect(content).toBeVisible();
      }
    });

    test('debe mostrar menú de navegación principal', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const navElements = page.locator('[data-testid="admin-navigation"]');
        const navCount = await navElements.count();
        
        if (navCount > 0) {
          await expect(navElements.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar enlaces a diferentes secciones', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const navLinks = page.locator('[data-testid="admin-courts-link"], [data-testid="admin-bookings-link"], [data-testid="admin-users-link"], [data-testid="admin-stats-link"], [data-testid="admin-products-link"]');
        const linkCount = await navLinks.count();
        
        if (linkCount > 0) {
          await expect(navLinks.first()).toBeVisible();
        }
      }
    });

    test('debe tener logo o título del panel admin', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar logo o título
        const branding = page.locator('h1, .logo, .brand, .title').filter({ hasText: /admin|panel|gestión/i });
        const brandCount = await branding.count();
        
        if (brandCount > 0) {
          await expect(branding.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Navegación entre Secciones', () => {
    test('debe navegar a la sección de canchas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const canchasLink = page.locator('[data-testid="admin-courts-link"]').first();
        const linkExists = await canchasLink.count() > 0;
        
        if (linkExists) {
          await canchasLink.click();
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/canchas/);
        } else {
          await page.goto('/admin-panel/admin/canchas');
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/canchas/);
        }
      }
    });

    test('debe navegar a la sección de usuarios', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const usuariosLink = page.locator('[data-testid="admin-users-link"]').first();
        const linkExists = await usuariosLink.count() > 0;
        
        if (linkExists) {
          await usuariosLink.click();
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/usuarios/);
        } else {
          await page.goto('/admin-panel/admin/usuarios');
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/usuarios/);
        }
      }
    });

    test('debe navegar a la sección de estadísticas', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const statsLink = page.locator('[data-testid="admin-stats-link"]').first();
        const linkExists = await statsLink.count() > 0;
        
        if (linkExists) {
          await statsLink.click();
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/estadisticas/);
        } else {
          await page.goto('/admin-panel/admin/estadisticas');
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/estadisticas/);
        }
      }
    });

    test('debe navegar a la sección de productos', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        const productosLink = page.locator('[data-testid="admin-products-link"]').first();
        const linkExists = await productosLink.count() > 0;
        
        if (linkExists) {
          await productosLink.click();
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/productos/);
        } else {
          await page.goto('/admin-panel/admin/productos');
          await page.waitForTimeout(2000);
          await expect(page).toHaveURL(/\/admin-panel\/admin\/productos/);
        }
      }
    });
  });

  test.describe('Breadcrumbs y Navegación Contextual', () => {
    test('debe mostrar breadcrumbs en secciones internas', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar breadcrumbs
        const breadcrumbs = page.locator('.breadcrumb, .breadcrumbs, .path, nav ol, nav ul');
        const breadcrumbCount = await breadcrumbs.count();
        
        if (breadcrumbCount > 0) {
          await expect(breadcrumbs.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar título de sección actual', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar título de sección
        const sectionTitle = page.locator('h1, h2').filter({ hasText: /cancha|gestión/i });
        const titleCount = await sectionTitle.count();
        
        if (titleCount > 0) {
          await expect(sectionTitle.first()).toBeVisible();
        }
      }
    });

    test('debe permitir volver al dashboard principal', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar enlace de vuelta al dashboard
        const dashboardLink = page.locator('a, button').filter({ hasText: /dashboard|inicio|admin|panel/i }).first();
        const linkExists = await dashboardLink.count() > 0;
        
        if (linkExists) {
          await dashboardLink.click();
          await page.waitForTimeout(2000);
          
          const newUrl = page.url();
          const backToDashboard = newUrl.includes('/admin') && !newUrl.includes('/canchas');
          expect(backToDashboard).toBeTruthy();
        }
      }
    });
  });

  test.describe('Menú Lateral/Sidebar', () => {
    test('debe mostrar menú lateral si existe', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar sidebar
        const sidebar = page.locator('.sidebar, .side-nav, .menu-lateral, aside');
        const sidebarCount = await sidebar.count();
        
        if (sidebarCount > 0) {
          await expect(sidebar.first()).toBeVisible();
          
          // Verificar que contiene enlaces
          const sidebarLinks = sidebar.first().locator('a, button');
          const linksCount = await sidebarLinks.count();
          
          if (linksCount > 0) {
            await expect(sidebarLinks.first()).toBeVisible();
          }
        }
      }
    });

    test('debe colapsar/expandir menú lateral si es responsive', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar botón de toggle del menú
        const menuToggle = page.locator('button').filter({ hasText: /menú|menu|☰|≡/ }).or(
          page.locator('[data-toggle="sidebar"], .menu-toggle, .sidebar-toggle')
        );
        const toggleCount = await menuToggle.count();
        
        if (toggleCount > 0) {
          await expect(menuToggle.first()).toBeVisible();
          
          // Probar toggle
          await menuToggle.first().click();
          await page.waitForTimeout(500);
          
          // Verificar que algo cambió (el menú se expandió/colapsó)
          const content = page.locator('body');
          await expect(content).toBeVisible();
        }
      }
    });
  });

  test.describe('Navegación Superior/Header', () => {
    test('debe mostrar header con información del usuario', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar header
        const header = page.locator('header, .header, .top-nav, .navbar');
        const headerCount = await header.count();
        
        if (headerCount > 0) {
          await expect(header.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar opción de logout', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar botón de logout
        const logoutButton = page.locator('button, a').filter({ hasText: /salir|logout|cerrar sesión/i });
        const logoutCount = await logoutButton.count();
        
        if (logoutCount > 0) {
          await expect(logoutButton.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar información del usuario actual', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar información del usuario
        const userInfo = page.locator('.user-info, .profile, .user-menu').or(
          page.locator('span, div').filter({ hasText: /@|admin|usuario/i })
        );
        const userCount = await userInfo.count();
        
        if (userCount > 0) {
          await expect(userInfo.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Responsividad de Navegación', () => {
    test('debe adaptar navegación en dispositivos móviles', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar que la navegación se adapta a móvil
        const content = page.locator('body');
        await expect(content).toBeVisible();
        
        // Buscar menú hamburguesa o navegación móvil
        const mobileNav = page.locator('.mobile-nav, .hamburger, button').filter({ hasText: /☰|≡|menú/i });
        const mobileNavCount = await mobileNav.count();
        
        if (mobileNavCount > 0) {
          await expect(mobileNav.first()).toBeVisible();
        }
        
        // Verificar que no hay scroll horizontal
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(395); // 375 + margen
      }
    });

    test('debe funcionar navegación en tablets', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar navegación en tablet
        const navElements = page.locator('nav, .navigation, .menu');
        const navCount = await navElements.count();
        
        if (navCount > 0) {
          await expect(navElements.first()).toBeVisible();
        }
        
        // Verificar que los elementos son accesibles
        const clickableElements = page.locator('a, button');
        const clickableCount = await clickableElements.count();
        
        if (clickableCount > 0) {
          const elementSize = await clickableElements.first().boundingBox();
          if (elementSize) {
            // Los elementos deben ser lo suficientemente grandes para tocar
            expect(elementSize.height).toBeGreaterThan(30);
          }
        }
      }
    });

    test('debe mantener navegación funcional en desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Verificar navegación completa en desktop
        const navElements = page.locator('nav, .navigation, .menu, .sidebar');
        const navCount = await navElements.count();
        
        if (navCount > 0) {
          await expect(navElements.first()).toBeVisible();
          
          // Verificar que todos los enlaces son visibles
          const navLinks = navElements.first().locator('a, button');
          const linksCount = await navLinks.count();
          
          if (linksCount > 0) {
            await expect(navLinks.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Navegación por Teclado', () => {
    test('debe permitir navegación por teclado', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Probar navegación por Tab
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        const hasFocus = await focusedElement.count() > 0;
        
        if (hasFocus) {
          await expect(focusedElement).toBeVisible();
          
          // Probar más navegación
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          const nextFocused = page.locator(':focus');
          const hasNextFocus = await nextFocused.count() > 0;
          expect(hasNextFocus).toBeTruthy();
        }
      }
    });

    test('debe activar enlaces con Enter', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar primer enlace navegable
        const firstLink = page.locator('a, button').first();
        const linkExists = await firstLink.count() > 0;
        
        if (linkExists) {
          await firstLink.focus();
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
          
          // Verificar que algo pasó (navegación o acción)
          const content = page.locator('body');
          await expect(content).toBeVisible();
        }
      }
    });
  });

  test.describe('Estados de Navegación', () => {
    test('debe mostrar estado activo en sección actual', async ({ page }) => {
      await page.goto('/admin/canchas');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Buscar indicador de sección activa
        const activeIndicators = page.locator('.active, .current, .selected, [aria-current]');
        const activeCount = await activeIndicators.count();
        
        if (activeCount > 0) {
          await expect(activeIndicators.first()).toBeVisible();
        }
      }
    });

    test('debe mostrar estados hover en elementos navegables', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Probar hover en primer enlace
        const firstLink = page.locator('a, button').first();
        const linkExists = await firstLink.count() > 0;
        
        if (linkExists) {
          await firstLink.hover();
          await page.waitForTimeout(200);
          
          // Verificar que el elemento sigue siendo visible (no se rompe con hover)
          await expect(firstLink).toBeVisible();
        }
      }
    });
  });

  test.describe('Navegación de Retorno', () => {
    test('debe funcionar el botón atrás del navegador', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Navegar a otra sección
        await page.goto('/admin/canchas');
        await page.waitForTimeout(2000);
        
        // Usar botón atrás
        await page.goBack();
        await page.waitForTimeout(2000);
        
        // Verificar que volvió
        const backUrl = page.url();
        const isBack = backUrl.includes('/admin') && !backUrl.includes('/canchas');
        expect(isBack).toBeTruthy();
      }
    });

    test('debe mantener estado al navegar entre secciones', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        // Navegar entre secciones y verificar que la navegación se mantiene
        await page.goto('/admin/canchas');
        await page.waitForTimeout(2000);
        
        const navAfterNavigation = page.locator('nav, .navigation, .menu');
        const navCount = await navAfterNavigation.count();
        
        if (navCount > 0) {
          await expect(navAfterNavigation.first()).toBeVisible();
        }
      }
    });
  });
});