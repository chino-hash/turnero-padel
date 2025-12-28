import { test, expect } from '@playwright/test'

test.describe('Asignado a – selección múltiple de jugadores', () => {
  test('permite seleccionar J3 y J4 y muestra estado compartido', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)

    const addExtraBtn = page.locator('[data-testid^="admin-add-extra-btn-"]').first()
    const hasBtn = (await addExtraBtn.count()) > 0
    if (!hasBtn) return

    await addExtraBtn.click()

    const trigger = page.locator('button', { hasText: 'Todos los jugadores' }).first()
    await trigger.click()

    const optionJ3 = page.locator('button', { hasText: 'Solo jugador 3' }).first()
    const optionJ4 = page.locator('button', { hasText: 'Solo jugador 4' }).first()
    await optionJ3.click()
    await optionJ4.click()

    await page.keyboard.press('Escape')

    const summary = page.locator('button', { hasText: 'Compartido: J3, J4' })
    await expect(summary.first()).toBeVisible()
  })
})