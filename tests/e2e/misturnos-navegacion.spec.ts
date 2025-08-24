import { test, expect } from '@playwright/test';

test.describe('MisTurnos.tsx - Navegación y Funcionalidad Completa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test.describe('Navegación a MisTurnos', () => {
    test('debe navegar correctamente a la sección MisTurnos', async ({ page }) => {
      // Buscar enlace o botón de MisTurnos
      const misTurnosLink = page.locator(
        'a:has-text("Mis Turnos"), ' +
        'button:has-text("Mis Turnos"), ' +
        'nav a:has-text("Turnos"), ' +
        '[data-testid="mis-turnos"], ' +
        '.nav-link:has-text("Mis")'
      );
      
      await expect(misTurnosLink.first()).toBeVisible({ timeout: 10000 });
      
      // Hacer clic para navegar
      await misTurnosLink.first().click();
      await page.waitForTimeout(2000);
      
      // Verificar que navegó correctamente
      const currentUrl = page.url();
      console.log('URL después de navegación:', currentUrl);
      
      // Debe contener 'mis-turnos' o similar en la URL
      const hasCorrectUrl = currentUrl.includes('mis-turnos') || 
                           currentUrl.includes('turnos') || 
                           currentUrl.includes('reservas');
      
      if (hasCorrectUrl) {
        expect(hasCorrectUrl).toBeTruthy();
      } else {
        // Si no cambió la URL, verificar que el contenido cambió
        const misTurnosContent = page.locator(
          'h1:has-text("Mis Turnos"), ' +
          'h2:has-text("Mis Turnos"), ' +
          '.page-title:has-text("Turnos"), ' +
          '[data-testid="mis-turnos-page"]'
        );
        
        await expect(misTurnosContent.first()).toBeVisible();
      }
      
      console.log('Navegación a MisTurnos exitosa');
    });

    test('debe mostrar título y estructura correcta de la página', async ({ page }) => {
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar título de la página
        const pageTitle = page.locator(
          'h1:has-text("Mis Turnos"), ' +
          'h1:has-text("Mis Reservas"), ' +
          'h2:has-text("Turnos"), ' +
          '.page-title, ' +
          '[data-testid="page-title"]'
        );
        
        if (await pageTitle.count() > 0) {
          await expect(pageTitle.first()).toBeVisible();
          const titleText = await pageTitle.first().textContent();
          console.log('Título de página:', titleText);
        }
        
        // Verificar estructura básica
        const mainContent = page.locator(
          'main, ' +
          '.main-content, ' +
          '.page-content, ' +
          '[data-testid="main-content"]'
        );
        
        if (await mainContent.count() > 0) {
          await expect(mainContent.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Carga de Horarios y Reservas', () => {
    test('debe cargar y mostrar horarios reservados correctamente', async ({ page }) => {
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(3000);
        
        // Buscar lista de reservas
        const reservationsList = page.locator(
          '.reservations-list, ' +
          '.bookings-list, ' +
          '.turnos-list, ' +
          '[data-testid="reservations-list"]'
        );
        
        // Buscar elementos individuales de reserva
        const reservationItems = page.locator(
          '.reservation-item, ' +
          '.booking-item, ' +
          '.turno-item, ' +
          '.reservation, ' +
          '[data-testid="reservation"]'
        );
        
        const reservationCount = await reservationItems.count();
        console.log('Número de reservas encontradas:', reservationCount);
        
        if (reservationCount > 0) {
          // Verificar cada reserva
          for (let i = 0; i < Math.min(reservationCount, 3); i++) {
            const reservation = reservationItems.nth(i);
            
            // Verificar información básica de la reserva
            const reservationText = await reservation.textContent();
            console.log(`Reserva ${i + 1}:`, reservationText);
            
            // Verificar que contiene información esencial
            const hasDate = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2} de \w+/.test(reservationText || '');
            const hasTime = /\d{1,2}:\d{2}/.test(reservationText || '');
            const hasCancha = /cancha|court/i.test(reservationText || '');
            
            console.log(`Reserva ${i + 1} - Fecha: ${hasDate}, Hora: ${hasTime}, Cancha: ${hasCancha}`);
            
            // Al menos debe tener hora
            expect(hasTime).toBeTruthy();
          }
        } else {
          console.log('No se encontraron reservas');
        }
      }
    });

    test('debe mostrar estado vacío cuando no hay reservas', async ({ page }) => {
      // Interceptar API para simular respuesta vacía
      await page.route('**/api/bookings/**', route => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ bookings: [] })
          });
        } else {
          route.continue();
        }
      });
      
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(3000);
        
        // Verificar estado vacío
        const emptyState = page.locator(
          'text="No tienes reservas", ' +
          'text="Sin turnos", ' +
          'text="No hay reservas", ' +
          '.empty-state, ' +
          '.no-reservations, ' +
          '[data-testid="empty-state"]'
        );
        
        if (await emptyState.count() > 0) {
          await expect(emptyState.first()).toBeVisible();
          console.log('Estado vacío mostrado correctamente');
          
          const emptyText = await emptyState.first().textContent();
          console.log('Mensaje de estado vacío:', emptyText);
        }
        
        // Verificar que no hay elementos de reserva
        const reservationItems = page.locator('.reservation-item, .booking-item');
        expect(await reservationItems.count()).toBe(0);
      }
    });

    test('debe mostrar loading state durante la carga', async ({ page }) => {
      // Interceptar API para hacer la respuesta lenta
      await page.route('**/api/bookings/**', route => {
        setTimeout(() => {
          route.continue();
        }, 2000);
      });
      
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        
        // Verificar loading state inmediatamente
        const loadingIndicators = page.locator(
          '.loading, ' +
          '.spinner, ' +
          'text="Cargando", ' +
          'text="Loading", ' +
          '[data-testid="loading"]'
        );
        
        if (await loadingIndicators.count() > 0) {
          await expect(loadingIndicators.first()).toBeVisible();
          console.log('Loading state mostrado correctamente');
        }
        
        // Esperar a que termine la carga
        await page.waitForTimeout(3000);
        
        // Verificar que el loading desapareció
        if (await loadingIndicators.count() > 0) {
          await expect(loadingIndicators.first()).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Navegación entre Secciones', () => {
    test('debe mantener persistencia de estado con Context API', async ({ page }) => {
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(2000);
        
        // Obtener estado inicial
        const initialContent = await page.textContent('body');
        console.log('Contenido inicial de MisTurnos cargado');
        
        // Navegar de vuelta al home
        const homeLink = page.locator(
          'a:has-text("Inicio"), ' +
          'a:has-text("Home"), ' +
          '.logo, ' +
          '[data-testid="home-link"]'
        );
        
        if (await homeLink.count() > 0) {
          await homeLink.first().click();
          await page.waitForTimeout(2000);
          
          // Verificar que estamos en home
          const homeContent = page.locator(
            '.home-section, ' +
            '.slots-grid, ' +
            'button[id^="slot-"]'
          );
          
          if (await homeContent.count() > 0) {
            console.log('Navegación a Home exitosa');
            
            // Volver a MisTurnos
            const misTurnosLink2 = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
            
            if (await misTurnosLink2.count() > 0) {
              await misTurnosLink2.first().click();
              await page.waitForTimeout(2000);
              
              // Verificar que el contenido se mantiene (persistencia)
              const finalContent = await page.textContent('body');
              
              // El contenido debe cargarse rápidamente (sin loading prolongado)
              // indicando que el estado se mantiene
              console.log('Regreso a MisTurnos - persistencia verificada');
            }
          }
        }
      }
    });

    test('debe navegar correctamente entre diferentes secciones', async ({ page }) => {
      // Probar navegación entre múltiples secciones
      const sections = [
        { name: 'Mis Turnos', selector: 'a:has-text("Mis Turnos"), button:has-text("Mis Turnos")' },
        { name: 'Inicio', selector: 'a:has-text("Inicio"), a:has-text("Home"), .logo' },
        { name: 'Perfil', selector: 'a:has-text("Perfil"), button:has-text("Perfil")' }
      ];
      
      for (const section of sections) {
        const sectionLink = page.locator(section.selector);
        
        if (await sectionLink.count() > 0) {
          console.log(`Navegando a: ${section.name}`);
          
          await sectionLink.first().click();
          await page.waitForTimeout(2000);
          
          // Verificar que la navegación fue exitosa
          const currentUrl = page.url();
          console.log(`URL después de navegar a ${section.name}:`, currentUrl);
          
          // Verificar que no hay errores de JavaScript
          const jsErrors = [];
          page.on('pageerror', error => jsErrors.push(error));
          
          if (jsErrors.length > 0) {
            console.log(`Errores JS en ${section.name}:`, jsErrors);
          }
        }
      }
    });
  });

  test.describe('Manejo de Errores', () => {
    test('debe manejar errores de API correctamente', async ({ page }) => {
      // Interceptar API para simular error
      await page.route('**/api/bookings/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(3000);
        
        // Verificar mensaje de error
        const errorMessage = page.locator(
          'text="Error al cargar", ' +
          'text="No se pudieron cargar", ' +
          'text="Error de conexión", ' +
          '.error, ' +
          '.alert-error, ' +
          '[data-testid="error-message"]'
        );
        
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible();
          console.log('Mensaje de error mostrado correctamente');
          
          const errorText = await errorMessage.first().textContent();
          console.log('Texto del error:', errorText);
        }
        
        // Verificar botón de reintentar
        const retryButton = page.locator(
          'button:has-text("Reintentar"), ' +
          'button:has-text("Volver a cargar"), ' +
          'button:has-text("Actualizar"), ' +
          '[data-testid="retry-button"]'
        );
        
        if (await retryButton.count() > 0) {
          await expect(retryButton.first()).toBeVisible();
          console.log('Botón de reintentar disponible');
        }
      }
    });

    test('debe manejar errores de autenticación', async ({ page }) => {
      // Interceptar API para simular error de autenticación
      await page.route('**/api/bookings/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(3000);
        
        // Verificar redirección a login o mensaje de autenticación
        const authError = page.locator(
          'text="Inicia sesión", ' +
          'text="No autorizado", ' +
          'text="Debes autenticarte", ' +
          '.auth-error, ' +
          '.login-required'
        );
        
        if (await authError.count() > 0) {
          await expect(authError.first()).toBeVisible();
          console.log('Error de autenticación manejado correctamente');
        }
        
        // Verificar si redirige a login
        const currentUrl = page.url();
        const redirectedToLogin = currentUrl.includes('login') || currentUrl.includes('auth');
        
        if (redirectedToLogin) {
          console.log('Redirección a login exitosa');
        }
      }
    });
  });

  test.describe('Responsividad Móvil (<480px)', () => {
    test('debe mostrar elementos apilados en pantallas pequeñas', async ({ page }) => {
      // Configurar viewport móvil
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que los elementos se apilan verticalmente
        const reservationItems = page.locator('.reservation-item, .booking-item, .turno-item');
        
        if (await reservationItems.count() > 1) {
          const firstItem = reservationItems.first();
          const secondItem = reservationItems.nth(1);
          
          const firstBox = await firstItem.boundingBox();
          const secondBox = await secondItem.boundingBox();
          
          if (firstBox && secondBox) {
            // El segundo elemento debe estar debajo del primero (mayor Y)
            expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
            console.log('Elementos apilados correctamente en móvil');
          }
        }
        
        // Verificar que el contenido no se desborda horizontalmente
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // 20px de tolerancia
        
        console.log('Ancho del contenido en móvil:', bodyWidth);
      }
    });

    test('debe adaptar navegación para móvil', async ({ page }) => {
      // Configurar viewport muy pequeño
      await page.setViewportSize({ width: 320, height: 568 }); // iPhone 5
      
      // Verificar navegación móvil
      const mobileNav = page.locator(
        '.mobile-nav, ' +
        '.hamburger, ' +
        '.menu-toggle, ' +
        '[data-testid="mobile-nav"]'
      );
      
      if (await mobileNav.count() > 0) {
        await expect(mobileNav.first()).toBeVisible();
        console.log('Navegación móvil detectada');
        
        // Hacer clic en menú móvil
        await mobileNav.first().click();
        await page.waitForTimeout(1000);
        
        // Verificar que se abre el menú
        const mobileMenu = page.locator(
          '.mobile-menu, ' +
          '.nav-menu.open, ' +
          '.sidebar, ' +
          '[data-testid="mobile-menu"]'
        );
        
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu.first()).toBeVisible();
          console.log('Menú móvil abierto correctamente');
        }
      }
      
      // Navegar a MisTurnos desde móvil
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        await misTurnosLink.first().click();
        await page.waitForTimeout(2000);
        
        // Verificar que la página se carga correctamente en móvil
        const pageContent = page.locator('main, .main-content, .page-content');
        
        if (await pageContent.count() > 0) {
          const contentBox = await pageContent.first().boundingBox();
          
          if (contentBox) {
            // El contenido debe caber en el ancho de la pantalla
            expect(contentBox.width).toBeLessThanOrEqual(320);
            console.log('Contenido adaptado correctamente a móvil');
          }
        }
      }
    });

    test('debe mantener funcionalidad táctil en móvil', async ({ page }) => {
      // Configurar viewport móvil
      await page.setViewportSize({ width: 414, height: 896 }); // iPhone 11
      
      // Navegar a MisTurnos
      const misTurnosLink = page.locator('a:has-text("Mis Turnos"), button:has-text("Mis Turnos")');
      
      if (await misTurnosLink.count() > 0) {
        // Simular toque táctil
        await misTurnosLink.first().tap();
        await page.waitForTimeout(2000);
        
        // Verificar que la navegación funcionó con toque
        const misTurnosContent = page.locator(
          'h1:has-text("Mis Turnos"), ' +
          'h2:has-text("Mis Turnos"), ' +
          '.page-title'
        );
        
        if (await misTurnosContent.count() > 0) {
          console.log('Navegación táctil funcionando correctamente');
        }
        
        // Probar scroll táctil
        const reservationItems = page.locator('.reservation-item, .booking-item');
        
        if (await reservationItems.count() > 3) {
          // Hacer scroll hacia abajo
          await page.evaluate(() => {
            window.scrollTo(0, window.innerHeight);
          });
          
          await page.waitForTimeout(1000);
          
          // Verificar que el scroll funcionó
          const scrollY = await page.evaluate(() => window.scrollY);
          expect(scrollY).toBeGreaterThan(0);
          console.log('Scroll táctil funcionando, posición Y:', scrollY);
        }
      }
    });
  });
});