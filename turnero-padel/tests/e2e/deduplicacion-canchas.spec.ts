import { test, expect } from '@playwright/test'

// Verifica que la UI de selección de canchas no muestre tarjetas duplicadas
// basándose en el nombre visible de cada cancha.
// Navega a /test que renderiza HomeSection dentro de PadelBookingPage.

test('Deduplicación de tarjetas de canchas', async ({ page }) => {
  await page.goto('/test')

  // Espera a que el título principal de HomeSection esté visible
  await expect(page.getByRole('heading', { name: /Reserva tu Cancha de Padel/i })).toBeVisible()

  // Espera a que aparezcan canchas o se muestre el estado vacío
  await page.waitForFunction(() => {
    const hasCourts = document.querySelector('[data-testid="court-name"]') !== null
    const emptyState = /No se encontraron canchas activas/i.test(document.body.innerText)
    return hasCourts || emptyState
  }, { timeout: 30000 })

  // Captura los nombres visibles de las canchas usando data-testid
  const courtButtonTexts = await page.locator('[data-testid="court-name"]').allTextContents()

  // Si no hay canchas, validar el mensaje de estado vacío y terminar
  if (courtButtonTexts.length === 0) {
    await expect(page.getByText(/No se encontraron canchas activas/i)).toBeVisible()
    return
  }

  // Debe haber al menos una cancha en la lista
  expect(courtButtonTexts.length).toBeGreaterThan(0)

  // Deduplicación por nombre (normalizado)
  const normalized = courtButtonTexts.map((t) => t.toLowerCase().replace(/\s+/g, ' ').trim())
  const unique = new Set(normalized)
  expect(unique.size).toBe(normalized.length)
})
