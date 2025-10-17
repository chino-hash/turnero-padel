# Endpoints de desarrollo para pruebas de SSE y actualización de canchas

Estos endpoints están disponibles únicamente en entorno de desarrollo (`NODE_ENV=development`) y permiten validar el flujo de actualizaciones en tiempo real (SSE) y la modificación de datos de canchas sin autenticación.

## Rutas

- `POST /api/courts/dev/event`
  - Emite un evento SSE de prueba.
  - Body:
    ```json
    { "type": "courts_updated", "message": "Texto opcional", "payload": { "foo": "bar" } }
    ```
  - Tipos admitidos: `courts_updated`, `bookings_updated`, `slots_updated`, `admin_change`.

- `POST /api/courts/dev/update`
  - Actualiza una cancha y emite `courts_updated` automáticamente.
  - Body (ejemplo):
    ```json
    { "id": "<courtId>", "basePrice": 61 }
    ```

## Notas de middleware

Ambas rutas usan el prefijo `/api/courts/...` para quedar incluidas en las rutas públicas permitidas por el middleware, evitando la necesidad de login durante desarrollo.

## Ejemplos rápidos con PowerShell

```powershell
$p = 3000

# Emitir evento de prueba
$body1 = @{ type = "courts_updated"; message = "Ping dev" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:$p/api/courts/dev/event" -Method Post -Body $body1 -ContentType "application/json"

# Obtener canchas y elegir la primera
$courts = Invoke-RestMethod -Uri "http://localhost:$p/api/courts?forcePublic=true" -Method Get
$id = $courts[0].id; $base = [double]$courts[0].base_price; $newBase = $base + 1

# Actualizar basePrice y emitir courts_updated
$body2 = @{ id = $id; basePrice = $newBase } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:$p/api/courts/dev/update" -Method Post -Body $body2 -ContentType "application/json"

# Verificar cambio
$courts2 = Invoke-RestMethod -Uri "http://localhost:$p/api/courts?forcePublic=true" -Method Get
$updated = $courts2 | Where-Object { $_.id -eq $id }
Write-Host "Precio actualizado: $($updated.base_price)"
```

## Resultados esperados

- La UI que escuche `courts_updated` debería refrescar datos de canchas en tiempo real.
- La API `/api/courts` reflejará el nuevo `base_price` tras llamar a `/api/courts/dev/update`.