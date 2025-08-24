# API [Nombre del Endpoint]

> **Estado**: 🟢 Estable | 🟡 En desarrollo | 🔴 Experimental
> **Versión**: v1.0
> **Última actualización**: [YYYY-MM-DD]
> **Mantenedor**: [@usuario]

## Descripción

[Descripción breve y clara del propósito del endpoint]

## Endpoint

```http
[MÉTODO] /api/[ruta]/[endpoint]
```

### Información Básica

- **URL Base**: `https://tu-dominio.com/api`
- **Método HTTP**: `GET | POST | PUT | DELETE | PATCH`
- **Autenticación**: ✅ Requerida | ❌ No requerida
- **Rate Limiting**: X requests/minuto
- **Timeout**: 30 segundos

## Autenticación

### Bearer Token

```http
Authorization: Bearer <tu-token-jwt>
```

### API Key (si aplica)

```http
X-API-Key: <tu-api-key>
```

## Parámetros

### Path Parameters

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|----------|
| `id` | `string` | ✅ | ID único del recurso | `123e4567-e89b-12d3` |
| `slug` | `string` | ✅ | Identificador legible | `mi-recurso` |

### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción | Ejemplo |
|-----------|------|-----------|---------|-------------|----------|
| `page` | `number` | ❌ | `1` | Número de página | `?page=2` |
| `limit` | `number` | ❌ | `10` | Elementos por página | `?limit=20` |
| `sort` | `string` | ❌ | `created_at` | Campo para ordenar | `?sort=name` |
| `order` | `string` | ❌ | `desc` | Dirección del orden | `?order=asc` |
| `filter` | `string` | ❌ | - | Filtro de búsqueda | `?filter=activo` |

### Request Body

```typescript
interface RequestBody {
  campo1: string;          // Descripción del campo1
  campo2?: number;         // Descripción del campo2 (opcional)
  campo3: {
    subcampo1: string;
    subcampo2: boolean;
  };
  campo4: string[];        // Array de strings
}
```

#### Ejemplo de Request Body

```json
{
  "campo1": "valor ejemplo",
  "campo2": 42,
  "campo3": {
    "subcampo1": "valor",
    "subcampo2": true
  },
  "campo4": ["item1", "item2"]
}
```

## Respuestas

### Respuesta Exitosa (200/201)

```typescript
interface SuccessResponse {
  success: true;
  data: {
    id: string;
    campo1: string;
    campo2: number;
    created_at: string;     // ISO 8601
    updated_at: string;     // ISO 8601
  };
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
```

#### Ejemplo de Respuesta Exitosa

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "campo1": "valor ejemplo",
    "campo2": 42,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Respuestas de Error

#### 400 - Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": [
      {
        "field": "campo1",
        "message": "Este campo es requerido"
      }
    ]
  }
}
```

#### 401 - Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token de autenticación inválido o expirado"
  }
}
```

#### 403 - Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "No tienes permisos para acceder a este recurso"
  }
}
```

#### 404 - Not Found

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "El recurso solicitado no existe"
  }
}
```

#### 429 - Rate Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Has excedido el límite de requests",
    "retry_after": 60
  }
}
```

#### 500 - Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Error interno del servidor",
    "request_id": "req_123456789"
  }
}
```

## Códigos de Estado

| Código | Descripción | Cuándo ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa (GET, PUT, PATCH) |
| `201` | Created | Recurso creado exitosamente (POST) |
| `204` | No Content | Operación exitosa sin contenido (DELETE) |
| `400` | Bad Request | Datos de entrada inválidos |
| `401` | Unauthorized | Autenticación requerida o inválida |
| `403` | Forbidden | Sin permisos para el recurso |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto con el estado actual |
| `422` | Unprocessable Entity | Datos válidos pero no procesables |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Error interno del servidor |

## Ejemplos de Uso

### cURL

```bash
# GET request
curl -X GET \
  "https://tu-dominio.com/api/endpoint?page=1&limit=10" \
  -H "Authorization: Bearer <tu-token>" \
  -H "Content-Type: application/json"

# POST request
curl -X POST \
  "https://tu-dominio.com/api/endpoint" \
  -H "Authorization: Bearer <tu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "campo1": "valor",
    "campo2": 42
  }'
```

### JavaScript/TypeScript

```typescript
// Usando fetch
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    campo1: 'valor',
    campo2: 42
  })
});

const data = await response.json();

if (data.success) {
  console.log('Éxito:', data.data);
} else {
  console.error('Error:', data.error);
}
```

### Axios

```typescript
import axios from 'axios';

try {
  const response = await axios.post('/api/endpoint', {
    campo1: 'valor',
    campo2: 42
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Éxito:', response.data);
} catch (error) {
  if (error.response) {
    console.error('Error:', error.response.data.error);
  }
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

function useEndpoint(id?: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/endpoint/${id}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
}
```

## Validaciones

### Esquema de Validación (Zod)

```typescript
import { z } from 'zod';

const requestSchema = z.object({
  campo1: z.string().min(1, 'Campo1 es requerido'),
  campo2: z.number().optional(),
  campo3: z.object({
    subcampo1: z.string(),
    subcampo2: z.boolean()
  }),
  campo4: z.array(z.string()).max(10, 'Máximo 10 elementos')
});

type RequestBody = z.infer<typeof requestSchema>;
```

### Reglas de Validación

- `campo1`: Requerido, string no vacío, máximo 255 caracteres
- `campo2`: Opcional, número entero positivo
- `campo3.subcampo1`: Requerido, string válido
- `campo3.subcampo2`: Requerido, booleano
- `campo4`: Opcional, array de strings, máximo 10 elementos

## Rate Limiting

### Límites por Endpoint

- **Usuarios autenticados**: 100 requests/minuto
- **Usuarios anónimos**: 20 requests/minuto
- **API Keys**: 1000 requests/minuto

### Headers de Rate Limiting

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Caching

### Estrategia de Cache

- **GET requests**: Cache por 5 minutos
- **Headers de cache**:
  ```http
  Cache-Control: public, max-age=300
  ETag: "abc123"
  ```

### Invalidación de Cache

- Se invalida automáticamente en operaciones POST/PUT/DELETE
- Se puede forzar con header `Cache-Control: no-cache`

## Seguridad

### Medidas de Seguridad

- ✅ **HTTPS obligatorio** en producción
- ✅ **Validación de entrada** con Zod
- ✅ **Sanitización** de datos
- ✅ **Rate limiting** implementado
- ✅ **CORS** configurado correctamente
- ✅ **Headers de seguridad** incluidos

### Headers de Seguridad

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## Testing

### Tests Unitarios

```typescript
import { createMocks } from 'node-mocks-http';
import handler from './api/endpoint';

describe('/api/endpoint', () => {
  it('devuelve datos correctamente', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '123' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });

  it('valida datos de entrada', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { campo1: '' } // Inválido
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
```

### Tests de Integración

```typescript
import request from 'supertest';
import app from '../app';

describe('API Integration Tests', () => {
  it('flujo completo CRUD', async () => {
    // Crear
    const createResponse = await request(app)
      .post('/api/endpoint')
      .send({ campo1: 'test' })
      .expect(201);

    const id = createResponse.body.data.id;

    // Leer
    await request(app)
      .get(`/api/endpoint/${id}`)
      .expect(200);

    // Actualizar
    await request(app)
      .put(`/api/endpoint/${id}`)
      .send({ campo1: 'updated' })
      .expect(200);

    // Eliminar
    await request(app)
      .delete(`/api/endpoint/${id}`)
      .expect(204);
  });
});
```

## Monitoreo

### Métricas

- **Latencia promedio**: ~X ms
- **Throughput**: X requests/segundo
- **Error rate**: <1%
- **Uptime**: 99.9%

### Logs

```typescript
// Estructura de logs
{
  timestamp: '2024-01-15T10:30:00Z',
  level: 'info',
  method: 'POST',
  url: '/api/endpoint',
  status: 200,
  duration: 150,
  user_id: 'user_123',
  request_id: 'req_456'
}
```

## Troubleshooting

### Problemas Comunes

#### Error 400: "Validation Error"

**Causa**: Datos de entrada inválidos.

**Solución**: Verificar que todos los campos requeridos estén presentes y tengan el formato correcto.

#### Error 401: "Unauthorized"

**Causa**: Token de autenticación inválido o expirado.

**Solución**: 
1. Verificar que el token esté presente en el header
2. Verificar que el token no haya expirado
3. Renovar el token si es necesario

#### Error 429: "Rate Limit Exceeded"

**Causa**: Se ha excedido el límite de requests.

**Solución**: 
1. Esperar el tiempo indicado en `retry_after`
2. Implementar backoff exponencial
3. Considerar usar API Key para límites más altos

### Debug

```bash
# Habilitar logs de debug
DEBUG=api:endpoint npm run dev

# Ver logs en tiempo real
tail -f logs/api.log | grep "endpoint"
```

## Changelog

### v1.2.0 (2024-01-15)
- ✨ Agregado soporte para filtros avanzados
- 🐛 Corregido problema con paginación
- 📈 Mejorado rendimiento en 20%

### v1.1.0 (2024-01-01)
- ✨ Agregado campo `campo2` opcional
- 🔒 Implementado rate limiting
- 📚 Mejorada documentación

### v1.0.0 (2023-12-01)
- 🎉 Versión inicial del endpoint

## Referencias

- [Guía de APIs](../../guides/api-development.md)
- [Estándares de Código](../../guides/contributing.md)
- [Testing Guidelines](../../guides/testing.md)
- [Postman Collection](./postman/endpoint-collection.json)

---

**Última revisión**: [YYYY-MM-DD] por [@usuario]
**Próxima revisión**: [YYYY-MM-DD]