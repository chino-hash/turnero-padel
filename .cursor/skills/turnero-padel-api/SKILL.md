---
name: turnero-padel-api
description: Standard patterns for API routes in Turnero de Padel including response format (ApiResponse), Zod validation, pagination, and error handling. Use when creating or modifying API routes, adding endpoints, or handling request/response structures.
---

# Turnero Padel - API Patterns

## Response Format

Usar siempre el formato `ApiResponse` de `lib/validations/common.ts`:

```typescript
import { createSuccessResponse, createErrorResponse } from '@/lib/validations/common';

// Éxito
return NextResponse.json(createSuccessResponse('Mensaje', data, meta), { status: 200 });

// Error
return NextResponse.json(createErrorResponse('Mensaje', 'detalle', errors), { status: 400 });
```

- `createSuccessResponse(message, data?, meta?)` – success: true
- `createErrorResponse(message, error?, errors?)` – success: false. `errors` es array de `{ field, message }`.

## Validation with Zod

1. Definir schema en `lib/validations/` (ej. `booking.ts`).
2. Usar schemas comunes cuando aplique: `paginationSchema`, `dateRangeSchema`, `idSchema`, `idsSchema`.
3. En catch de `ZodError`:

```typescript
import { formatZodErrors } from '@/lib/validations/common';

} catch (err) {
  if (err instanceof ZodError) {
    const errors = formatZodErrors(err);
    return NextResponse.json(
      createErrorResponse('Datos inválidos', undefined, errors),
      { status: 400 }
    );
  }
}
```

## Pagination

```typescript
import { paginationSchema, calculatePaginationMeta, type PaginatedResponse } from '@/lib/validations/common';

// Parse query params
const { page, limit, sortBy, sortOrder } = paginationSchema.parse(query);

// Respuesta paginada
const meta = calculatePaginationMeta(page, limit, total);
return NextResponse.json(createSuccessResponse('OK', items, meta));
```

## Folder Structure

- `app/api/[resource]/route.ts` – GET, POST para el recurso
- `app/api/[resource]/[id]/route.ts` – GET, PATCH, DELETE por ID
- `app/api/[resource]/[id]/[sub]/route.ts` – subrecursos (ej. `/api/bookings/[id]/extras`)

## Auth Check Pattern

```typescript
import { auth } from '@/lib/auth';

const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 });
}
```

Luego obtener `tenantId` y validar permisos (ver skill turnero-padel-multitenant).

## Status Codes

- 200: OK
- 201: Created
- 400: Bad Request (validación)
- 401: Unauthorized
- 403: Forbidden (permisos)
- 404: Not Found
- 409: Conflict (ej. slot ocupado)
