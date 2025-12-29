import { test, expect, chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

test.describe('SSE /api/events', () => {
  test('Acceso denegado para usuario anónimo (401)', async ({ request }) => {
    const response = await request.get('/api/events')
    expect(response.status()).toBe(401)
    const headers = response.headers()
    expect(headers['content-type'] || '').not.toContain('text/event-stream')
  })

  test('Conexión exitosa para usuario autenticado (200)', async () => {
    const storagePathCandidates = [
      path.join(process.cwd(), 'tests', 'e2e', 'auth-storage.json'),
      path.join(process.cwd(), 'test-results', 'auth-storage.json'),
    ]

    const storagePath = storagePathCandidates.find(p => fs.existsSync(p))

    if (!storagePath) {
      test.skip(true, 'No se encontró storageState autenticado. Provee auth-storage.json para ejecutar esta prueba.')
      return
    }

    const browser = await chromium.launch()
    const context = await browser.newContext({ storageState: storagePath })
    const response = await context.request.get('/api/events')

    expect(response.status()).toBe(200)
    const headers = response.headers()
    expect(headers['content-type'] || '').toContain('text/event-stream')

    await context.close()
    await browser.close()
  })
})