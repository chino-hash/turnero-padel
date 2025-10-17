# Registro Diario de Actividades

- **Fecha:** 17/10/2025

## Tareas completadas

- Limpieza de artefactos de build de Next.js
  - Acción: eliminación de la carpeta `.next` para resolver errores de lectura de manifiestos.
  - Comando:
    ```powershell
    Remove-Item -Recurse -Force .next
    ```
  - Resultado: la carpeta se eliminó correctamente y se redujeron errores `readlink`/`EBUSY`/`EINVAL` en el siguiente arranque.

- Reinicio del servidor de desarrollo en puerto 3000
  - Acción: arranque de `next dev` reutilizable por Playwright.
  - Comando:
    ```powershell
    npm run dev
    ```
  - Resultado: servidor iniciado en `http://localhost:3000` y accesible también via IP local.

- Ejecución de suite E2E de Playwright
  - Acción: ejecución inicial y reintento en terminal separado para evitar interferencias con el servidor.
  - Comandos:
    ```powershell
    npx playwright test -c tests/e2e/playwright.3010.config.ts --reporter=list
    npx playwright test --reporter=list
    ```
  - Resultado: la primera ejecución retornó código distinto de cero; el reintento con servidor ya iniciado en `3000` mostró múltiples tests pasando (gestión de canchas, filtros, responsividad), aunque la ejecución completa fue interrumpida por el usuario.

- Unificación de puerto de desarrollo y pruebas a `3000`
  - Acción: verificación de que `package.json` fuerza `next dev -p 3000` y que `playwright.config.ts` define `baseURL` y `webServer.url` en `http://localhost:3000`.
  - Observación: el archivo `tests/e2e/playwright.3010.config.ts` también apunta a `3000`; se recomienda eliminarlo para evitar confusiones.

- Revisión de configuración de Next.js
  - Acción: inspección de `next.config.js`, `tsconfig.json` y estructura de workspace.
  - Resultado: configuración coherente con webpack fallbacks y headers; se detecta posible advertencia de Next por múltiples lockfiles.

- Creación de documentación de migración de puerto
  - Acción: generación del documento técnico que detalla razones, implementación, verificación, recomendaciones y consideraciones del cambio 3010 → 3000.
  - Archivo creado:
    ```
    turnero-padel/docs/guides/migracion-puerto-3010-a-3000.md
    ```

- Verificación manual de la UI
  - Acción: apertura de `http://localhost:3000` mientras se limpiaban configuraciones duplicadas.
  - Resultado: página principal accesible; se observaron errores en ciertas rutas de API.

## Problemas encontrados

- Advertencia de Next.js: "inferencia del directorio raíz del workspace" por múltiples lockfiles
  - Causa probable: coexistencia de `package-lock.json` en carpetas superiores y dentro del subproyecto, agravado por entorno en OneDrive.
  - Solución aplicada: documentación y recomendaciones para mantener un solo lockfile y mover el proyecto fuera de OneDrive.

- Errores `EBUSY`/`EINVAL` al leer manifiestos (`.next\server\app-paths-manifest.json`, `interception-route-rewrite-manifest.js`)
  - Causa probable: bloqueo de archivos por sincronización de OneDrive/antivirus y builds previas.
  - Solución aplicada: limpieza de `.next` y reutilización del servidor ya activo; recomendación de desactivar sync durante `next dev` o mover el proyecto a `C:\dev\`.

- Fallos iniciales en Playwright (código de salida ≠ 0)
  - Causa: servidor no listo, artefactos, endpoints con errores.
  - Solución aplicada: reintentos con servidor reutilizado, limpieza de `.next`, unificación de puerto.

- Errores de API durante verificación manual
  - Síntomas: `net::ERR_ABORTED` en `/api/auth/session`, `/api/events` (SSE) y `ClientFetchError` relacionado con `authjs.dev`.
  - Estado: pendiente de estabilizar variables de entorno y revisar configuración de NextAuth/SSE.

## Próximos pasos

- Eliminar configuraciones duplicadas de Playwright
  - Acción recomendada:
    ```powershell
    del tests\e2e\playwright.3010.config.ts
    ```
  - Objetivo: evitar perfiles alternativos y consolidar en `playwright.config.ts`.

- Reducir flakiness por entorno sincronizado
  - Mover el proyecto fuera de OneDrive (p.ej. `C:\dev\turnero-padel\`).
  - Mantener un solo `package-lock.json` en el proyecto principal.

- Estabilizar autenticación y SSE en desarrollo
  - Verificar `.env.local`:
    ```bash
    NEXTAUTH_URL="http://localhost:3000"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```
  - Revisar rutas `/api/auth/session` y `/api/events`.

- Validar la suite E2E con alcance acotado y entorno forzado
  - Comandos sugeridos:
    ```powershell
    $env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npx playwright test --reporter=list --project=chromium
    ```

- Documentación y enlaces
  - Enlazar la guía de migración de puerto desde `README.md` y del índice de documentación.