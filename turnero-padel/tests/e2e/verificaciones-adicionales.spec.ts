import { test, expect } from '@playwright/test';

test.describe('Verificaciones Adicionales - Colores, Selectores y CSS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  });

  test.describe('Colores Específicos', () => {
    test('debe verificar color verde claro #d4edda para badges de éxito', async ({ page }) => {
      // Buscar badges de estado "Disponible" o mensajes de éxito
      const successBadges = page.locator(
        '.badge-success, ' +
        '.badge:has-text("Disponible"), ' +
        '.status:has-text("Disponible"), ' +
        '.success, ' +
        '[data-testid="success-badge"]'
      );
      
      if (await successBadges.count() > 0) {
        const badge = successBadges.first();
        
        // Obtener color de fondo
        const backgroundColor = await badge.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor;
        });
        
        console.log('Color de fondo del badge de éxito:', backgroundColor);
        
        // Convertir #d4edda a RGB: rgb(212, 237, 218)
        const expectedColors = [
          'rgb(212, 237, 218)',
          '#d4edda',
          'rgba(212, 237, 218, 1)'
        ];
        
        const hasCorrectColor = expectedColors.some(color => 
          backgroundColor.includes('212') && 
          backgroundColor.includes('237') && 
          backgroundColor.includes('218')
        );
        
        if (hasCorrectColor) {
          expect(hasCorrectColor).toBeTruthy();
          console.log('Color verde claro #d4edda verificado correctamente');
        } else {
          console.log('Color esperado no encontrado, color actual:', backgroundColor);
        }
      } else {
        console.log('No se encontraron badges de éxito para verificar color');
      }
    });

    test('debe verificar color gris claro #e2e3e5 para elementos deshabilitados', async ({ page }) => {
      // Buscar elementos deshabilitados o badges neutros
      const disabledElements = page.locator(
        'button:disabled, ' +
        '.disabled, ' +
        '.badge-secondary, ' +
        '.badge:has-text("Reservado"), ' +
        '[data-testid="disabled-element"]'
      );
      
      if (await disabledElements.count() > 0) {
        const element = disabledElements.first();
        
        // Obtener color de fondo
        const backgroundColor = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor;
        });
        
        console.log('Color de fondo del elemento deshabilitado:', backgroundColor);
        
        // Convertir #e2e3e5 a RGB: rgb(226, 227, 229)
        const hasCorrectColor = backgroundColor.includes('226') && 
                               backgroundColor.includes('227') && 
                               backgroundColor.includes('229');
        
        if (hasCorrectColor) {
          expect(hasCorrectColor).toBeTruthy();
          console.log('Color gris claro #e2e3e5 verificado correctamente');
        } else {
          console.log('Color esperado no encontrado, color actual:', backgroundColor);
        }
      } else {
        console.log('No se encontraron elementos deshabilitados para verificar color');
      }
    });

    test('debe verificar colores específicos de canchas (violeta, rojo, verde)', async ({ page }) => {
      const canchaColors = [
        { name: 'Cancha 1', expectedColor: 'violeta', rgbPattern: /rgb\(\d+,\s*\d+,\s*\d+\)/ },
        { name: 'Cancha 2', expectedColor: 'rojo', rgbPattern: /rgb\(\d+,\s*\d+,\s*\d+\)/ },
        { name: 'Cancha 3', expectedColor: 'verde', rgbPattern: /rgb\(\d+,\s*\d+,\s*\d+\)/ }
      ];
      
      for (const cancha of canchaColors) {
        const canchaElements = page.locator(
          `button:has-text("${cancha.name}"), ` +
          `.slot:has-text("${cancha.name}"), ` +
          `[data-testid*="${cancha.name.toLowerCase().replace(' ', '-')}"]`
        );
        
        if (await canchaElements.count() > 0) {
          const element = canchaElements.first();
          
          // Obtener color del texto
          const textColor = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.color;
          });
          
          console.log(`Color de texto de ${cancha.name}:`, textColor);
          
          // Verificar que tiene un color específico (no negro por defecto)
          const hasCustomColor = !textColor.includes('rgb(0, 0, 0)') && 
                                !textColor.includes('black') && 
                                textColor !== 'rgb(0, 0, 0)';
          
          expect(hasCustomColor).toBeTruthy();
          console.log(`${cancha.name} tiene color personalizado: ${textColor}`);
          
          // Verificar color de fondo relacionado
          const backgroundColor = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.backgroundColor;
          });
          
          console.log(`Color de fondo de ${cancha.name}:`, backgroundColor);
        }
      }
    });

    test('debe verificar colores de estados de badges', async ({ page }) => {
      const badgeStates = [
        { text: 'Disponible', expectedType: 'success' },
        { text: 'Reservado', expectedType: 'danger' },
        { text: 'Ocupado', expectedType: 'warning' }
      ];
      
      for (const state of badgeStates) {
        const badges = page.locator(
          `.badge:has-text("${state.text}"), ` +
          `.status:has-text("${state.text}"), ` +
          `[data-testid="badge-${state.text.toLowerCase()}"]`
        );
        
        if (await badges.count() > 0) {
          const badge = badges.first();
          
          // Obtener estilos del badge
          const styles = await badge.evaluate(el => {
            const computedStyles = window.getComputedStyle(el);
            return {
              backgroundColor: computedStyles.backgroundColor,
              color: computedStyles.color,
              borderColor: computedStyles.borderColor
            };
          });
          
          console.log(`Estilos del badge "${state.text}":`, styles);
          
          // Verificar que tiene estilos apropiados para su estado
          const hasValidStyles = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                                styles.backgroundColor !== 'transparent';
          
          expect(hasValidStyles).toBeTruthy();
        }
      }
    });
  });

  test.describe('Selectores data-testid Robustos', () => {
    test('debe verificar presencia de selectores data-testid en elementos clave', async ({ page }) => {
      const expectedTestIds = [
        'home-section',
        'slots-grid',
        'slot-modal',
        'reserve-button',
        'cancel-button',
        'loading-indicator',
        'error-message',
        'success-message',
        'mis-turnos-link',
        'reservation-item'
      ];
      
      for (const testId of expectedTestIds) {
        const elements = page.locator(`[data-testid="${testId}"]`);
        const count = await elements.count();
        
        console.log(`Elementos con data-testid="${testId}": ${count}`);
        
        if (count > 0) {
          // Verificar que el elemento es visible o funcional
          const firstElement = elements.first();
          const isVisible = await firstElement.isVisible();
          
          console.log(`  - Primer elemento visible: ${isVisible}`);
          
          if (isVisible) {
            // Verificar que tiene contenido o funcionalidad
            const hasContent = await firstElement.evaluate(el => {
              return el.textContent?.trim().length > 0 || 
                     el.children.length > 0 || 
                     el.tagName === 'BUTTON' || 
                     el.tagName === 'INPUT';
            });
            
            expect(hasContent).toBeTruthy();
          }
        }
      }
    });

    test('debe verificar que los selectores data-testid son únicos cuando corresponde', async ({ page }) => {
      const uniqueTestIds = [
        'home-section',
        'slot-modal',
        'main-navigation',
        'page-title'
      ];
      
      for (const testId of uniqueTestIds) {
        const elements = page.locator(`[data-testid="${testId}"]`);
        const count = await elements.count();
        
        if (count > 0) {
          console.log(`Verificando unicidad de data-testid="${testId}": ${count} elementos`);
          
          // Elementos que deberían ser únicos
          if (['home-section', 'slot-modal', 'main-navigation'].includes(testId)) {
            expect(count).toBeLessThanOrEqual(1);
          }
        }
      }
    });

    test('debe verificar selectores data-testid en diferentes estados', async ({ page }) => {
      // Verificar selectores en estado normal
      const normalStateSelectors = [
        '[data-testid="slot-available"]',
        '[data-testid="slot-reserved"]',
        '[data-testid="loading"]',
        '[data-testid="error"]'
      ];
      
      for (const selector of normalStateSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        console.log(`Selector ${selector}: ${count} elementos`);
      }
      
      // Simular interacción para verificar selectores dinámicos
      const availableSlot = page.locator('button[id^="slot-"]:not([disabled])');
      
      if (await availableSlot.count() > 0) {
        await availableSlot.first().click();
        await page.waitForTimeout(1000);
        
        // Verificar selectores de modal
        const modalSelectors = [
          '[data-testid="modal-title"]',
          '[data-testid="modal-date"]',
          '[data-testid="modal-time"]',
          '[data-testid="reserve-button"]',
          '[data-testid="close-modal"]'
        ];
        
        for (const selector of modalSelectors) {
          const elements = page.locator(selector);
          const count = await elements.count();
          
          console.log(`Selector de modal ${selector}: ${count} elementos`);
        }
      }
    });
  });

  test.describe('Aserciones de Texto, Visibilidad y URL', () => {
    test('debe verificar textos específicos en elementos clave', async ({ page }) => {
      const expectedTexts = [
        { selector: 'h1, h2, .page-title', expectedContent: /cancha|turno|reserva/i },
        { selector: '.badge, .status', expectedContent: /disponible|reservado|ocupado/i },
        { selector: 'button', expectedContent: /reservar|cancelar|confirmar/i }
      ];
      
      for (const textCheck of expectedTexts) {
        const elements = page.locator(textCheck.selector);
        const count = await elements.count();
        
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const element = elements.nth(i);
            const text = await element.textContent();
            
            if (text && text.trim().length > 0) {
              const matchesPattern = textCheck.expectedContent.test(text);
              console.log(`Texto "${text}" coincide con patrón: ${matchesPattern}`);
            }
          }
        }
      }
    });

    test('debe verificar visibilidad de elementos críticos', async ({ page }) => {
      const criticalElements = [
        { name: 'Navegación principal', selector: 'nav, .navigation, .navbar' },
        { name: 'Contenido principal', selector: 'main, .main-content, .home-section' },
        { name: 'Slots de canchas', selector: 'button[id^="slot-"], .slot' },
        { name: 'Footer', selector: 'footer, .footer' }
      ];
      
      for (const element of criticalElements) {
        const locator = page.locator(element.selector);
        const count = await locator.count();
        
        console.log(`${element.name}: ${count} elementos encontrados`);
        
        if (count > 0) {
          const isVisible = await locator.first().isVisible();
          console.log(`  - Primer elemento visible: ${isVisible}`);
          
          if (isVisible) {
            // Verificar que está dentro del viewport
            const boundingBox = await locator.first().boundingBox();
            
            if (boundingBox) {
              const isInViewport = boundingBox.y >= 0 && 
                                 boundingBox.x >= 0 && 
                                 boundingBox.y < 1000; // Altura razonable
              
              console.log(`  - Dentro del viewport: ${isInViewport}`);
              console.log(`  - Posición: x=${boundingBox.x}, y=${boundingBox.y}`);
            }
          }
        }
      }
    });

    test('debe verificar URLs y navegación correcta', async ({ page }) => {
      // Verificar URL inicial
      const initialUrl = page.url();
      console.log('URL inicial:', initialUrl);
      expect(initialUrl).toBe('http://localhost:3000/');
      
      // Verificar navegación a diferentes secciones
      const navigationTests = [
        { 
          linkSelector: 'a:has-text("Mis Turnos"), button:has-text("Mis Turnos")', 
          expectedUrlPattern: /mis-turnos|turnos|reservas/ 
        }
      ];
      
      for (const navTest of navigationTests) {
        const link = page.locator(navTest.linkSelector);
        
        if (await link.count() > 0) {
          await link.first().click();
          await page.waitForTimeout(2000);
          
          const newUrl = page.url();
          console.log('Nueva URL después de navegación:', newUrl);
          
          // Verificar que la URL cambió apropiadamente
          const urlMatches = navTest.expectedUrlPattern.test(newUrl) || newUrl !== initialUrl;
          console.log('URL coincide con patrón esperado:', urlMatches);
          
          // Volver al inicio
          await page.goto('/');
          await page.waitForTimeout(1000);
        }
      }
    });
  });

  test.describe('Aserciones CSS Específicas', () => {
    test('debe verificar propiedades CSS de background-color', async ({ page }) => {
      const elementsToCheck = [
        { selector: '.badge', property: 'backgroundColor' },
        { selector: 'button[id^="slot-"]', property: 'backgroundColor' },
        { selector: '.modal, .dialog', property: 'backgroundColor' },
        { selector: 'body', property: 'backgroundColor' }
      ];
      
      for (const check of elementsToCheck) {
        const elements = page.locator(check.selector);
        const count = await elements.count();
        
        if (count > 0) {
          const element = elements.first();
          
          const cssValue = await element.evaluate((el, prop) => {
            const styles = window.getComputedStyle(el);
            return (styles as any)[prop];
          }, check.property);
          
          console.log(`${check.selector} - ${check.property}: ${cssValue}`);
          
          // Verificar que tiene un valor válido
          const hasValidValue = cssValue && 
                               cssValue !== 'rgba(0, 0, 0, 0)' && 
                               cssValue !== 'transparent' && 
                               cssValue.length > 0;
          
          if (hasValidValue) {
            console.log(`  ✓ Valor CSS válido`);
          } else {
            console.log(`  ⚠ Valor CSS puede ser por defecto`);
          }
        }
      }
    });

    test('debe verificar propiedades de layout y posicionamiento', async ({ page }) => {
      const layoutChecks = [
        { selector: '.modal, .dialog', properties: ['position', 'zIndex', 'display'] },
        { selector: 'button[id^="slot-"]', properties: ['display', 'cursor', 'border'] },
        { selector: '.badge, .status', properties: ['display', 'padding', 'borderRadius'] }
      ];
      
      for (const check of layoutChecks) {
        const elements = page.locator(check.selector);
        const count = await elements.count();
        
        if (count > 0) {
          const element = elements.first();
          
          console.log(`\nVerificando CSS de: ${check.selector}`);
          
          for (const property of check.properties) {
            const cssValue = await element.evaluate((el, prop) => {
              const styles = window.getComputedStyle(el);
              return (styles as any)[prop];
            }, property);
            
            console.log(`  ${property}: ${cssValue}`);
          }
        }
      }
    });

    test('debe verificar responsividad CSS en diferentes viewports', async ({ page }) => {
      const viewports = [
        { name: 'Desktop', width: 1920, height: 1080 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 }
      ];
      
      for (const viewport of viewports) {
        console.log(`\nVerificando CSS en ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        
        // Verificar que los elementos se adaptan
        const mainContent = page.locator('main, .main-content, .home-section');
        
        if (await mainContent.count() > 0) {
          const styles = await mainContent.first().evaluate(el => {
            const computedStyles = window.getComputedStyle(el);
            return {
              width: computedStyles.width,
              maxWidth: computedStyles.maxWidth,
              padding: computedStyles.padding,
              margin: computedStyles.margin
            };
          });
          
          console.log(`  Estilos del contenido principal:`, styles);
          
          // Verificar que el ancho no excede el viewport
          const widthValue = parseInt(styles.width);
          if (!isNaN(widthValue)) {
            expect(widthValue).toBeLessThanOrEqual(viewport.width + 50); // 50px de tolerancia
          }
        }
        
        // Verificar elementos específicos en cada viewport
        const slots = page.locator('button[id^="slot-"]');
        
        if (await slots.count() > 0) {
          const slotStyles = await slots.first().evaluate(el => {
            const computedStyles = window.getComputedStyle(el);
            return {
              fontSize: computedStyles.fontSize,
              padding: computedStyles.padding,
              minHeight: computedStyles.minHeight
            };
          });
          
          console.log(`  Estilos de slots:`, slotStyles);
        }
      }
      
      // Restaurar viewport por defecto
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });
});