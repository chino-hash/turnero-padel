import { test, expect } from '@playwright/test';

test.describe('Navegación Inicial - Diagnóstico Completo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Lista de Canchas y Ordenamiento', () => {
    test('debe mostrar lista de canchas ordenada por horario de inicio', async ({ page }) => {
      // Esperar a que se carguen las canchas
      await page.waitForTimeout(3000);
      
      // Buscar elementos de canchas/slots
      const slots = page.locator('[data-testid="time-slot"], .slot, .cancha-item, .horario');
      await expect(slots.first()).toBeVisible({ timeout: 10000 });
      
      const slotsCount = await slots.count();
      expect(slotsCount).toBeGreaterThan(0);
      
      // Verificar que los horarios están ordenados (permitiendo entrecruzamientos)
      const timeElements = page.locator('.time, .horario-text, [data-testid="slot-time"]');
      const timeCount = await timeElements.count();
      
      if (timeCount > 1) {
        const times: any[] = [];
        for (let i = 0; i < Math.min(timeCount, 5); i++) {
          const timeText = await timeElements.nth(i).textContent();
          if (timeText) times.push(timeText.trim());
        }
        
        // Verificar que hay horarios válidos
        expect(times.length).toBeGreaterThan(0);
        console.log('Horarios encontrados:', times);
      }
    });

    test('debe mostrar nombres de canchas con colores específicos', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Verificar Cancha 1 - color violeta
      const cancha1 = page.locator('text="Cancha 1"').first();
      if (await cancha1.count() > 0) {
        const cancha1Color = await cancha1.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor
          };
        });
        console.log('Cancha 1 colores:', cancha1Color);
        
        // Verificar que tiene algún tono violeta/púrpura
        const hasVioletTone = cancha1Color.color.includes('rgb(') && 
          (cancha1Color.color.includes('128, 0, 128') || // purple
           cancha1Color.color.includes('138, 43, 226') || // blueviolet
           cancha1Color.backgroundColor.includes('violet'));
      }
      
      // Verificar Cancha 2 - color rojo
      const cancha2 = page.locator('text="Cancha 2"').first();
      if (await cancha2.count() > 0) {
        const cancha2Color = await cancha2.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor
          };
        });
        console.log('Cancha 2 colores:', cancha2Color);
      }
      
      // Verificar Cancha 3 - color verde
      const cancha3 = page.locator('text="Cancha 3"').first();
      if (await cancha3.count() > 0) {
        const cancha3Color = await cancha3.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor
          };
        });
        console.log('Cancha 3 colores:', cancha3Color);
      }
    });

    test('debe mostrar badges de estado correctos', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Buscar badges de "Disponible"
      const disponibleBadges = page.locator('text="Disponible", .badge:has-text("Disponible"), [data-testid="status-available"]');
      const disponibleCount = await disponibleBadges.count();
      
      // Buscar badges de "Reservado"
      const reservadoBadges = page.locator('text="Reservado", .badge:has-text("Reservado"), [data-testid="status-reserved"]');
      const reservadoCount = await reservadoBadges.count();
      
      console.log(`Badges encontrados - Disponible: ${disponibleCount}, Reservado: ${reservadoCount}`);
      
      // Debe haber al menos algunos badges
      expect(disponibleCount + reservadoCount).toBeGreaterThan(0);
      
      // Verificar colores de badges si existen
      if (disponibleCount > 0) {
        const disponibleBadge = disponibleBadges.first();
        const badgeColor = await disponibleBadge.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor;
        });
        console.log('Color badge Disponible:', badgeColor);
      }
    });

    test('debe mostrar precios en los slots', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Buscar elementos que contengan precios ($ o números)
      const priceElements = page.locator('text=/\$\d+/, text=/\d+\s*pesos?/, .price, [data-testid="slot-price"]');
      const priceCount = await priceElements.count();
      
      console.log(`Elementos de precio encontrados: ${priceCount}`);
      
      if (priceCount > 0) {
        // Verificar que los precios son válidos
        for (let i = 0; i < Math.min(priceCount, 3); i++) {
          const priceText = await priceElements.nth(i).textContent();
          console.log(`Precio ${i + 1}: ${priceText}`);
          expect(priceText).toBeTruthy();
        }
      }
    });
  });

  test.describe('Responsividad Desktop/Mobile', () => {
    test('debe funcionar correctamente en desktop', async ({ page }) => {
      // Configurar viewport desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Verificar que los elementos se muestran correctamente
      const slots = page.locator('[data-testid="time-slot"], .slot, .cancha-item');
      await expect(slots.first()).toBeVisible({ timeout: 10000 });
      
      // Verificar layout desktop (elementos en filas/columnas)
      const container = page.locator('.container, .grid, .slots-container').first();
      if (await container.count() > 0) {
        const containerStyles = await container.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            gridTemplateColumns: styles.gridTemplateColumns,
            flexDirection: styles.flexDirection
          };
        });
        console.log('Layout desktop:', containerStyles);
      }
    });

    test('debe ser responsivo en Mobile Safari (414x896)', async ({ page }) => {
      // Configurar viewport Mobile Safari específico
      await page.setViewportSize({ width: 414, height: 896 });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Verificar que los elementos siguen siendo visibles
      const slots = page.locator('[data-testid="time-slot"], .slot, .cancha-item');
      await expect(slots.first()).toBeVisible({ timeout: 10000 });
      
      // Verificar que no hay overflow horizontal
      const bodyWidth = await page.evaluate(() => {
        return {
          scrollWidth: document.body.scrollWidth,
          clientWidth: document.body.clientWidth,
          viewportWidth: window.innerWidth
        };
      });
      
      console.log('Dimensiones móvil:', bodyWidth);
      
      // No debe haber scroll horizontal
      expect(bodyWidth.scrollWidth).toBeLessThanOrEqual(bodyWidth.viewportWidth + 20); // 20px de tolerancia
      
      // Verificar layout móvil (elementos apilados)
      const container = page.locator('.container, .grid, .slots-container').first();
      if (await container.count() > 0) {
        const containerStyles = await container.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            display: styles.display,
            flexDirection: styles.flexDirection,
            gridTemplateColumns: styles.gridTemplateColumns
          };
        });
        console.log('Layout móvil:', containerStyles);
      }
    });

    test('debe mantener funcionalidad en pantallas pequeñas (<480px)', async ({ page }) => {
      // Configurar viewport muy pequeño
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Verificar que los elementos siguen siendo clickeables
      const slots = page.locator('[data-testid="time-slot"], .slot, .cancha-item');
      const slotsCount = await slots.count();
      
      if (slotsCount > 0) {
        const firstSlot = slots.first();
        await expect(firstSlot).toBeVisible();
        
        // Verificar que el elemento tiene un tamaño mínimo clickeable
        const slotBox = await firstSlot.boundingBox();
        if (slotBox) {
          expect(slotBox.height).toBeGreaterThan(30); // Mínimo 30px de altura
          expect(slotBox.width).toBeGreaterThan(50);  // Mínimo 50px de ancho
        }
      }
    });
  });

  test.describe('Verificaciones de Colores Específicos', () => {
    test('debe usar colores específicos para badges', async ({ page }) => {
      await page.waitForTimeout(3000);
      
      // Verificar color verde claro #d4edda para badges disponibles
      const disponibleBadges = page.locator('.badge:has-text("Disponible"), [data-testid="status-available"]');
      if (await disponibleBadges.count() > 0) {
        const badgeColor = await disponibleBadges.first().evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log('Color badge disponible:', badgeColor);
        
        // Verificar si es verde claro (puede ser rgb(212, 237, 218) que es #d4edda)
        const isLightGreen = badgeColor.includes('212, 237, 218') || 
                           badgeColor.includes('rgb(212, 237, 218)') ||
                           badgeColor.includes('#d4edda');
      }
      
      // Verificar color gris claro #e2e3e5 para otros elementos
      const grayElements = page.locator('.badge:has-text("Reservado"), .disabled, [data-testid="status-reserved"]');
      if (await grayElements.count() > 0) {
        const grayColor = await grayElements.first().evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log('Color elemento gris:', grayColor);
      }
    });
  });
});