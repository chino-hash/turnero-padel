# Plantilla de Documentación para APIs

## Información del Endpoint

**Endpoint**: `[METHOD] /api/ruta`  
**Archivo**: `[ruta/del/archivo/route.ts]`  
**Versión**: `[v1.0]`  
**Autor**: `[Nombre del desarrollador]`  
**Fecha**: `[YYYY-MM-DD]`

## Descripción

[Descripción detallada de qué hace este endpoint y cuál es su propósito]

## Autenticación

- **Requerida**: `[Sí/No]`
- **Tipo**: `[Bearer Token / Session / API Key]`
- **Roles permitidos**: `[admin, user, guest]`

## Request

### Método HTTP
`[GET | POST | PUT | PATCH | DELETE]`

### URL
```
[METHOD] /api/ruta/{parametro}
```

### Parámetros de Ruta

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | `string` | ✅ | Identificador único del recurso |
| `slug` | `string` | ❌ | Slug opcional para filtrar |

### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `page` | `number` | ❌ | `1` | Número de página para paginación |
| `limit` | `number` | ❌ | `10` | Cantidad de elementos por página |
| `filter` | `string` | ❌ | - | Filtro de búsqueda |

### Headers

| Header | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `Authorization` | `string` | ✅ | Bearer token para autenticación |
| `Content-Type` | `string` | ✅ | `application/json` |

### Request Body

```typescript
interface RequestBody {
  campo1: string;
  campo2: number;
  campo3?: boolean;
  anidado: {
    subcampo: string;
  };
}
```

#### Ejemplo de Request Body

```json
{
  "campo1": "valor ejemplo",
  "campo2": 123,
  "campo3": true,
  "anidado": {
    "subcampo": "valor anidado"
  }
}
```

## Response

### Códigos de Estado

| Código | Descripción | Cuándo ocurre |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa |
| `201` | Created | Recurso creado exitosamente |
| `400` | Bad Request | Datos de entrada inválidos |
| `401` | Unauthorized | Token de autenticación inválido |
| `403` | Forbidden | Sin permisos para esta operación |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto con el estado actual |
| `500` | Internal Server Error | Error interno del servidor |

### Response Body (Éxito)

```typescript
interface SuccessResponse {
  success: true;
  data: {
    id: string;
    campo1: string;
    campo2: number;
    createdAt: string;
    updatedAt: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}
```

#### Ejemplo de Response Exitoso

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "campo1": "valor",
    "campo2": 456,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

### Response Body (Error)

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### Ejemplo de Response de Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": {
      "campo1": "Este campo es requerido",
      "campo2": "Debe ser un número positivo"
    }
  }
}
```

## Ejemplos de Uso

### cURL

```bash
# Ejemplo básico
curl -X POST \
  'http://localhost:3000/api/ruta' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "campo1": "valor",
    "campo2": 123
  }'

# Con query parameters
curl -X GET \
  'http://localhost:3000/api/ruta?page=1&limit=5&filter=search' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### JavaScript/TypeScript

```typescript
// Usando fetch
const response = await fetch('/api/ruta', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    campo1: 'valor',
    campo2: 123,
  }),
});

const data = await response.json();

if (data.success) {
  console.log('Éxito:', data.data);
} else {
  console.error('Error:', data.error);
}
```

### React Hook

```typescript
// Hook personalizado para usar este endpoint
function useApiEndpoint() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callEndpoint = async (requestData: RequestBody) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ruta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError({ message: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, callEndpoint };
}
```

## Validaciones

### Validaciones de Entrada

- `campo1`: Requerido, string, longitud mínima 3 caracteres
- `campo2`: Requerido, número entero positivo
- `campo3`: Opcional, booleano

### Reglas de Negocio

1. **Regla 1**: Descripción de la regla de negocio
2. **Regla 2**: Otra regla importante
3. **Regla 3**: Restricciones específicas

## Dependencias

- `@/lib/auth` - Para validación de autenticación
- `@/lib/prisma` - Para operaciones de base de datos
- `zod` - Para validación de esquemas
- `@/lib/utils` - Utilidades del proyecto

## Base de Datos

### Tablas Afectadas

- `tabla1` - Operación: `INSERT/UPDATE/DELETE`
- `tabla2` - Operación: `SELECT`

### Consultas SQL

```sql
-- Consulta principal
SELECT * FROM tabla1 
WHERE campo = $1 
AND activo = true
ORDER BY created_at DESC;
```

## Rate Limiting

- **Límite**: `[100 requests por minuto]`
- **Ventana**: `[1 minuto]`
- **Identificador**: `[IP address / User ID]`

## Caching

- **Estrategia**: `[Redis / Memory / None]`
- **TTL**: `[300 segundos]`
- **Clave**: `[patrón de la clave de cache]`

## Logging

- **Nivel**: `[INFO / DEBUG / ERROR]`
- **Información registrada**: 
  - Request ID
  - User ID
  - Timestamp
  - Parámetros de entrada
  - Tiempo de respuesta

## Testing

### Tests de Integración

```typescript
describe('POST /api/ruta', () => {
  it('should create resource successfully', async () => {
    const response = await request(app)
      .post('/api/ruta')
      .send({
        campo1: 'test',
        campo2: 123,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });

  it('should return validation error for invalid data', async () => {
    const response = await request(app)
      .post('/api/ruta')
      .send({
        campo1: '', // Invalid: empty string
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Problemas Conocidos

- [ ] **Problema 1**: Descripción y workaround
- [ ] **Problema 2**: Limitación actual

## Mejoras Futuras

- [ ] **Mejora 1**: Implementar paginación cursor-based
- [ ] **Mejora 2**: Agregar filtros avanzados
- [ ] **Mejora 3**: Optimizar consultas de base de datos

## Changelog

| Versión | Fecha | Cambios |
|---------|-------|----------|
| 1.0.0 | 2024-01-01 | Versión inicial |
| 1.1.0 | 2024-01-15 | Agregado soporte para filtros |

---

**Última actualización**: [Fecha]  
**Revisado por**: [Nombre del revisor]