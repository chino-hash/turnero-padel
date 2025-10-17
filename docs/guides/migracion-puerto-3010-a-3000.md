# Migración de Puerto: 3010 → 3000

Este documento describe el cambio de la configuración de la aplicación y de la suite E2E de Playwright del puerto `3010` al puerto `3000`. Incluye la razón del cambio, cómo se implementó, cómo verificar que todo funcione correctamente, recomendaciones para futuras modificaciones y consideraciones importantes.

## Razón del Cambio

- Estándar de desarrollo: `3000` es el puerto por defecto que asume Next.js y la documentación del proyecto, lo que reduce fricción y confusiones.
- Unificación del entorno E2E: La configuración de Playwright y el servidor de desarrollo comparten una única URL (`http://localhost:3000`), permitiendo reutilizar el servidor en pruebas y evitando arranques duplicados.
- Consistencia con variables de entorno: `NEXTAUTH_URL` y `NEXT_PUBLIC_APP_URL` apuntan a `http://localhost:3000`, alineando autenticación y frontend.
- Simplificación de scripts y documentación: Scripts de `package.json`, guías y ejemplos quedan coherentes, facilitando CI/CD y onboarding.
- Mitigación de errores intermitentes en Windows/OneDrive: Arranques paralelos y artefactos de builds previos pueden provocar errores `EBUSY`/`EINVAL` en `.next`; centralizar en `3000` ayuda a reducir estas condiciones.

## Implementación (Paso a Paso)

1. Actualizar el script de desarrollo a `3000` en `package.json`:

```json
// package.json (scripts)
{
  "scripts": {
    "dev": "next dev -p 3000"
  }
}
```

2. Unificar la configuración raíz de Playwright para apuntar a `http://localhost:3000`:

```ts
// playwright.config.ts (extracto relevante)
export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  reporter: [
    ['html', { outputFolder: 'test-reports/playwright-report' }],
    ['json', { outputFile: 'test-reports/playwright-results.json' }],
    ['junit', { outputFile: 'test-reports/playwright-junit.xml' }],
    ['list']
  ],
});
```

3. Eliminar perfiles/configuraciones duplicadas de Playwright que hacían referencia a `3010`:

- `c:\Users\Chinoo\OneDrive\Documentos\augment-projects\turnero de padel\tests\e2e\playwright.3010.config.ts`
- `c:\Users\Chinoo\OneDrive\Documentos\augment-projects\turnero de padel\turnero-padel\tests\e2e\playwright.3010.config.ts` (si existiera)

```powershell
# Windows PowerShell
del tests\e2e\playwright.3010.config.ts
```

4. Ajustar variables de entorno para reflejar el puerto `3000`:

```bash
# .env.local
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

5. Limpiar artefactos previos de Next.js (si hubo errores `EBUSY`/`EINVAL`):

```powershell
Remove-Item -Recurse -Force .next
```

6. Reiniciar el servidor de desarrollo y reutilizarlo en pruebas:

```powershell
npm run dev
```

## Verificación

- Visual (manual):
  - Abrir `http://localhost:3000` y verificar que la UI principal carga sin errores.
  - Revisar que navegación básica y rutas protegidas funcionen.
  - Observar el terminal de `next dev` y confirmar ausencia de errores en `.next` (`EBUSY`, `EINVAL`).

- E2E (Playwright):
  - Ejecutar la suite completa reutilizando el servidor en `3000`:

```powershell
npx playwright test --reporter=list
```

  - Opcional: forzar el `baseURL` desde entorno para pruebas específicas:

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npx playwright test --reporter=list
```

  - Ver reportes:

```powershell
npm run test:playwright:report
```

- API smoke test (opcional):

```powershell
Invoke-WebRequest http://localhost:3000/api/health
Invoke-WebRequest http://localhost:3000/api/events
```

## Recomendaciones (Futuras Modificaciones de Puertos)

- Mantener `3000` como puerto por defecto; solo cambiar cuando exista una razón concreta (colisión, ejecución paralela, pruebas aisladas).
- Si se requiere otro puerto temporal (p.ej. `3011`) para E2E aislado, crear un archivo de configuración de Playwright separado y explícito, y documentarlo:

```ts
// Ejemplo (sólo si se necesita aislamiento)
webServer: {
  command: 'next dev -p 3011',
  url: 'http://localhost:3011',
  reuseExistingServer: true
}
```

- Parametrizar pruebas con `PLAYWRIGHT_BASE_URL` cuando se apunte a entornos remotos (staging/preview) sin tocar `package.json`.
- Evitar desarrollar dentro de carpetas sincronizadas (OneDrive) para reducir bloqueos de archivos; preferir rutas como `C:\dev\turnero-padel\`.
- Minimizar lockfiles múltiples en el workspace: mantener un solo `package-lock.json` en el proyecto principal para evitar advertencias de Next sobre la “inferencia del directorio raíz”.

## Consideraciones

- Autenticación (NextAuth): actualizar `NEXTAUTH_URL` al puerto actual; si se usa Google OAuth, revisar los callbacks de desarrollo para que apunten a `http://localhost:3000`.
- SSE y rutas API: confirmar que `NEXT_PUBLIC_APP_URL` y cualquier consumo de API usen rutas relativas o la URL base correcta.
- CI/CD: `vercel.json` y pipelines deben usar `npm run dev`/`npm run build` coherentes con `3000`. En CI, no es necesario arrancar un servidor distinto si se prueba con `webServer` de Playwright.
- Reutilización del servidor: `reuseExistingServer: true` evita arrancar instancias duplicadas de `next dev` que provocan flakiness.
- Errores Windows/OneDrive (`EBUSY`/`EINVAL`): si aparecen, limpiar `.next`, pausar el sync temporalmente o mover el proyecto fuera de OneDrive.
- Puerto ocupado: si `3000` está en uso, liberar el proceso de forma segura:

```powershell
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

## Checklist Rápido

- `package.json` usa `next dev -p 3000`.
- `playwright.config.ts` apunta a `http://localhost:3000`.
- Eliminadas configuraciones duplicadas de `playwright.3010.config.ts`.
- `.env.local` actualizado (`NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`).
- `.next` limpio en caso de artefactos.
- Suite E2E pasando contra `http://localhost:3000`.