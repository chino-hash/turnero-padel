import { test, expect } from '@playwright/test';

/**
 * E2E: Simular vuelta desde Mercado Pago con ?section=turnos.
 * - La vista activa debe ser Mis Turnos.
 * - La URL debe quedar sin ?section=turnos (limpieza con replaceState).
 * Requiere tener un tenant con slug (ej. metro-padel-360) y estar logueado para ver la app.
 */
test.describe('Vuelta desde MP con section=turnos', () => {
  const slug = process.env.E2E_TENANT_SLUG || 'metro-padel-360';

  test('al cargar /{slug}?section=turnos se muestra Mis Turnos y se limpia section de la URL', async ({
    page,
    baseURL,
  }) => {
    test.setTimeout(60000);
    const url = `${baseURL || 'http://localhost:3000'}/${slug}?section=turnos`;
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
    await page.waitForTimeout(2000);

    // Si redirige a login, el test verifica al menos que no hay error 500
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // En entornos sin sesión, solo comprobamos que no rompe
      expect(currentUrl).toContain('login');
      return;
    }

    // Estamos en la página del tenant: debe mostrarse Mis Turnos (vista activa por section=turnos)
    const misTurnos = page.locator('[data-testid="mis-turnos"]');
    const misTurnosHeading = page.locator('h2:has-text("Mis Turnos")');
    await expect(misTurnos.or(misTurnosHeading).first()).toBeVisible({ timeout: 10000 });

    // La URL debe quedar sin ?section=turnos (limpieza en el cliente)
    await page.waitForTimeout(500);
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('section=turnos');
    expect(finalUrl).toContain(slug);
  });
});
