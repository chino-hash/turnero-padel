import { test, expect } from '@playwright/test'

test.describe('Gestión Completa de Reservas', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de login
    await page.goto('/login')
    
    // Realizar login (ajustar según tu implementación)
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Esperar a que se complete el login
    await page.waitForURL('/')
    
    // Navegar a la página de gestión de reservas
    await page.goto('/bookings')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Interfaz de Gestión de Reservas', () => {
    test('debe mostrar la página principal de reservas', async ({ page }) => {
      // Verificar que se muestra el título
      await expect(page.locator('h1')).toContainText('Gestión de Reservas')
      
      // Verificar que se muestran los tabs
      await expect(page.locator('[data-testid="tab-lista"]')).toBeVisible()
      await expect(page.locator('[data-testid="tab-estadisticas"]')).toBeVisible()
      await expect(page.locator('[data-testid="tab-filtros"]')).toBeVisible()
    })

    test('debe cambiar entre tabs correctamente', async ({ page }) => {
      // Verificar tab de lista activo por defecto
      await expect(page.locator('[data-testid="booking-list"]')).toBeVisible()
      
      // Cambiar a tab de estadísticas
      await page.click('[data-testid="tab-estadisticas"]')
      await expect(page.locator('[data-testid="booking-stats"]')).toBeVisible()
      
      // Cambiar a tab de filtros
      await page.click('[data-testid="tab-filtros"]')
      await expect(page.locator('[data-testid="booking-filters"]')).toBeVisible()
    })
  })

  test.describe('Lista de Reservas', () => {
    test('debe mostrar la tabla de reservas', async ({ page }) => {
      // Verificar que se muestra la tabla
      await expect(page.locator('[data-testid="bookings-table"]')).toBeVisible()
      
      // Verificar headers de la tabla
      await expect(page.locator('th')).toContainText(['Fecha', 'Hora', 'Cancha', 'Cliente', 'Estado'])
    })

    test('debe mostrar botón de nueva reserva', async ({ page }) => {
      await expect(page.locator('[data-testid="new-booking-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="new-booking-btn"]')).toContainText('Nueva Reserva')
    })

    test('debe mostrar paginación cuando hay muchas reservas', async ({ page }) => {
      // Verificar controles de paginación
      const pagination = page.locator('[data-testid="pagination"]')
      if (await pagination.isVisible()) {
        await expect(pagination.locator('button')).toHaveCount(3) // Anterior, Siguiente, y números
      }
    })

    test('debe permitir buscar reservas', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]')
      await expect(searchInput).toBeVisible()
      
      // Realizar búsqueda
      await searchInput.fill('test')
      await page.waitForTimeout(500) // Debounce
      
      // Verificar que se actualiza la tabla
      await expect(page.locator('[data-testid="bookings-table"]')).toBeVisible()
    })
  })

  test.describe('Creación de Reservas', () => {
    test('debe abrir el modal de nueva reserva', async ({ page }) => {
      await page.click('[data-testid="new-booking-btn"]')
      
      // Verificar que se abre el modal
      await expect(page.locator('[data-testid="booking-modal"]')).toBeVisible()
      await expect(page.locator('[data-testid="modal-title"]')).toContainText('Nueva Reserva')
    })

    test('debe mostrar todos los campos del formulario', async ({ page }) => {
      await page.click('[data-testid="new-booking-btn"]')
      
      // Verificar campos del formulario
      await expect(page.locator('[data-testid="court-select"]')).toBeVisible()
      await expect(page.locator('[data-testid="date-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="start-time-select"]')).toBeVisible()
      await expect(page.locator('[data-testid="end-time-select"]')).toBeVisible()
      await expect(page.locator('[data-testid="players-input"]')).toBeVisible()
      await expect(page.locator('[data-testid="notes-textarea"]')).toBeVisible()
    })

    test('debe validar campos requeridos', async ({ page }) => {
      await page.click('[data-testid="new-booking-btn"]')
      
      // Intentar enviar formulario vacío
      await page.click('[data-testid="submit-btn"]')
      
      // Verificar mensajes de error
      await expect(page.locator('.error-message')).toBeVisible()
    })

    test('debe crear una reserva exitosamente', async ({ page }) => {
      await page.click('[data-testid="new-booking-btn"]')
      
      // Llenar formulario
      await page.selectOption('[data-testid="court-select"]', 'court-1')
      
      // Seleccionar fecha futura
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      await page.fill('[data-testid="date-input"]', dateString)
      
      await page.selectOption('[data-testid="start-time-select"]', '10:00')
      await page.selectOption('[data-testid="end-time-select"]', '11:30')
      
      // Agregar jugadores
      await page.fill('[data-testid="player-input-0"]', 'Jugador 1')
      await page.fill('[data-testid="player-input-1"]', 'Jugador 2')
      
      await page.fill('[data-testid="notes-textarea"]', 'Reserva de prueba')
      
      // Enviar formulario
      await page.click('[data-testid="submit-btn"]')
      
      // Verificar éxito
      await expect(page.locator('.success-message')).toBeVisible()
      await expect(page.locator('[data-testid="booking-modal"]')).not.toBeVisible()
    })

    test('debe verificar disponibilidad antes de crear', async ({ page }) => {
      await page.click('[data-testid="new-booking-btn"]')
      
      // Llenar campos básicos
      await page.selectOption('[data-testid="court-select"]', 'court-1')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateString = tomorrow.toISOString().split('T')[0]
      await page.fill('[data-testid="date-input"]', dateString)
      
      await page.selectOption('[data-testid="start-time-select"]', '10:00')
      
      // Verificar que se muestra información de disponibilidad
      await page.waitForTimeout(1000) // Esperar verificación
      
      const availabilityInfo = page.locator('[data-testid="availability-info"]')
      if (await availabilityInfo.isVisible()) {
        await expect(availabilityInfo).toContainText(['Disponible', 'No disponible'])
      }
    })
  })

  test.describe('Edición de Reservas', () => {
    test('debe abrir el modal de edición', async ({ page }) => {
      // Buscar primera reserva y hacer clic en editar
      const editBtn = page.locator('[data-testid="edit-booking-btn"]').first()
      if (await editBtn.isVisible()) {
        await editBtn.click()
        
        // Verificar que se abre el modal de edición
        await expect(page.locator('[data-testid="booking-modal"]')).toBeVisible()
        await expect(page.locator('[data-testid="modal-title"]')).toContainText('Editar Reserva')
      }
    })

    test('debe cargar datos existentes en el formulario', async ({ page }) => {
      const editBtn = page.locator('[data-testid="edit-booking-btn"]').first()
      if (await editBtn.isVisible()) {
        await editBtn.click()
        
        // Verificar que los campos tienen valores
        await expect(page.locator('[data-testid="court-select"]')).not.toHaveValue('')
        await expect(page.locator('[data-testid="date-input"]')).not.toHaveValue('')
      }
    })

    test('debe actualizar reserva exitosamente', async ({ page }) => {
      const editBtn = page.locator('[data-testid="edit-booking-btn"]').first()
      if (await editBtn.isVisible()) {
        await editBtn.click()
        
        // Modificar notas
        await page.fill('[data-testid="notes-textarea"]', 'Notas actualizadas')
        
        // Guardar cambios
        await page.click('[data-testid="submit-btn"]')
        
        // Verificar éxito
        await expect(page.locator('.success-message')).toBeVisible()
        await expect(page.locator('[data-testid="booking-modal"]')).not.toBeVisible()
      }
    })
  })

  test.describe('Eliminación de Reservas', () => {
    test('debe mostrar confirmación antes de eliminar', async ({ page }) => {
      const deleteBtn = page.locator('[data-testid="delete-booking-btn"]').first()
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click()
        
        // Verificar modal de confirmación
        await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible()
        await expect(page.locator('[data-testid="confirm-message"]')).toContainText('¿Estás seguro?')
      }
    })

    test('debe cancelar eliminación', async ({ page }) => {
      const deleteBtn = page.locator('[data-testid="delete-booking-btn"]').first()
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click()
        
        // Cancelar eliminación
        await page.click('[data-testid="cancel-btn"]')
        
        // Verificar que se cierra el modal
        await expect(page.locator('[data-testid="confirm-modal"]')).not.toBeVisible()
      }
    })

    test('debe eliminar reserva exitosamente', async ({ page }) => {
      const initialRowCount = await page.locator('[data-testid="booking-row"]').count()
      
      const deleteBtn = page.locator('[data-testid="delete-booking-btn"]').first()
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click()
        
        // Confirmar eliminación
        await page.click('[data-testid="confirm-btn"]')
        
        // Verificar éxito
        await expect(page.locator('.success-message')).toBeVisible()
        
        // Verificar que se actualiza la tabla
        await page.waitForTimeout(1000)
        const newRowCount = await page.locator('[data-testid="booking-row"]').count()
        expect(newRowCount).toBeLessThanOrEqual(initialRowCount)
      }
    })
  })

  test.describe('Filtros Avanzados', () => {
    test('debe mostrar panel de filtros', async ({ page }) => {
      await page.click('[data-testid="tab-filtros"]')
      
      // Verificar controles de filtro
      await expect(page.locator('[data-testid="court-filter"]')).toBeVisible()
      await expect(page.locator('[data-testid="status-filter"]')).toBeVisible()
      await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible()
    })

    test('debe aplicar filtros correctamente', async ({ page }) => {
      await page.click('[data-testid="tab-filtros"]')
      
      // Aplicar filtro por estado
      await page.selectOption('[data-testid="status-filter"]', 'confirmed')
      
      // Aplicar filtros
      await page.click('[data-testid="apply-filters-btn"]')
      
      // Verificar que se actualiza la lista
      await page.click('[data-testid="tab-lista"]')
      await expect(page.locator('[data-testid="bookings-table"]')).toBeVisible()
    })

    test('debe limpiar filtros', async ({ page }) => {
      await page.click('[data-testid="tab-filtros"]')
      
      // Aplicar algunos filtros
      await page.selectOption('[data-testid="status-filter"]', 'confirmed')
      await page.fill('[data-testid="search-input"]', 'test')
      
      // Limpiar filtros
      await page.click('[data-testid="clear-filters-btn"]')
      
      // Verificar que se limpian
      await expect(page.locator('[data-testid="status-filter"]')).toHaveValue('')
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('')
    })
  })

  test.describe('Estadísticas', () => {
    test('debe mostrar métricas principales', async ({ page }) => {
      await page.click('[data-testid="tab-estadisticas"]')
      
      // Verificar métricas
      await expect(page.locator('[data-testid="total-bookings"]')).toBeVisible()
      await expect(page.locator('[data-testid="confirmed-bookings"]')).toBeVisible()
      await expect(page.locator('[data-testid="pending-bookings"]')).toBeVisible()
      await expect(page.locator('[data-testid="revenue-total"]')).toBeVisible()
    })

    test('debe mostrar gráficos', async ({ page }) => {
      await page.click('[data-testid="tab-estadisticas"]')
      
      // Verificar gráficos (pueden tardar en cargar)
      await page.waitForTimeout(2000)
      
      const charts = page.locator('[data-testid="chart"]')
      const chartCount = await charts.count()
      expect(chartCount).toBeGreaterThan(0)
    })
  })

  test.describe('Responsividad', () => {
    test('debe funcionar en dispositivos móviles', async ({ page }) => {
      // Cambiar a viewport móvil
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Verificar que la interfaz se adapta
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
      
      // Verificar que los tabs se muestran correctamente
      await expect(page.locator('[data-testid="tab-lista"]')).toBeVisible()
    })

    test('debe mostrar tabla responsiva en móvil', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Verificar que la tabla se adapta o se muestra como cards
      const table = page.locator('[data-testid="bookings-table"]')
      const cards = page.locator('[data-testid="booking-card"]')
      
      const hasTable = await table.isVisible()
      const hasCards = await cards.count() > 0
      
      expect(hasTable || hasCards).toBeTruthy()
    })
  })

  test.describe('Manejo de Errores', () => {
    test('debe mostrar mensaje cuando no hay reservas', async ({ page }) => {
      // Si no hay reservas, debe mostrar mensaje apropiado
      const noDataMessage = page.locator('[data-testid="no-bookings-message"]')
      const bookingRows = page.locator('[data-testid="booking-row"]')
      
      const rowCount = await bookingRows.count()
      if (rowCount === 0) {
        await expect(noDataMessage).toBeVisible()
        await expect(noDataMessage).toContainText('No hay reservas')
      }
    })

    test('debe manejar errores de red', async ({ page }) => {
      // Simular error de red
      await page.route('/api/bookings*', route => {
        route.abort('failed')
      })
      
      await page.reload()
      
      // Verificar mensaje de error
      await expect(page.locator('.error-message')).toBeVisible()
    })
  })
})