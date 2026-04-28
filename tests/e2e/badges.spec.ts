import { test, expect } from '@playwright/test'

test.describe('Badge Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/test')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
  })

  test('debe mostrar el badge "No disponible" en slots no clickeables', async ({ page }) => {
    await page.waitForSelector('[data-testid="time-slot"]', { timeout: 15000 })
    const reservado = page.locator('[data-testid="time-slot"] .badge-reservado').first()
    if ((await reservado.count()) === 0) {
      test.skip()
      return
    }
    await expect(reservado).toBeVisible()
    await expect(reservado).toHaveText('No disponible')
  })

  test('debe mostrar el badge "Disponible" en slots clickeables', async ({ page }) => {
    await page.waitForSelector('[data-testid="time-slot"]', { timeout: 15000 })
    const disponible = page.locator('[data-testid="time-slot"] .badge-disponible').first()
    await expect(disponible).toBeVisible()
    await expect(disponible).toHaveText('Disponible')
    await expect(disponible).toHaveCSS('border-radius', '9999px')
    await expect(disponible).toHaveCSS('font-weight', '600')
  })

  test('debe haber al menos un badge en la grilla de horarios', async ({ page }) => {
    await page.waitForSelector('[data-testid="time-slot"]', { timeout: 15000 })
    const badges = page.locator('[data-testid="time-slot"] .badge-disponible, [data-testid="time-slot"] .badge-reservado')
    expect(await badges.count()).toBeGreaterThan(0)
    await expect(badges.first()).toBeVisible()
  })

})
