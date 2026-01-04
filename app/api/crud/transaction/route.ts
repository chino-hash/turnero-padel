import { NextRequest, NextResponse } from 'next/server';
import { crudService } from '../../../../lib/services/crud-service';
import { auth } from '../../../../lib/auth';
import { type User as PermissionsUser } from '../../../../lib/utils/permissions';

// Obtener sesión y usuario
async function getSessionAndUser() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, user: null };
  }
  
  const user: PermissionsUser = {
    id: session.user.id || undefined,
    email: session.user.email || null,
    role: session.user.role || 'USER',
    isAdmin: session.user.isAdmin || false,
    isSuperAdmin: session.user.isSuperAdmin || false,
    tenantId: session.user.tenantId || null,
  };
  
  return { session, user };
}

// Verificar permisos de administrador (ADMIN o SUPER_ADMIN)
async function checkAdminPermission() {
  const { user } = await getSessionAndUser();
  return user ? (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') : false;
}

// POST - Ejecutar transacción
export async function POST(request: NextRequest) {
  try {
    // Obtener sesión y usuario
    const { user } = await getSessionAndUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos de administrador
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { operations } = body;

    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de operaciones' },
        { status: 400 }
      );
    }

    for (const op of operations) {
      const opType = (op as any).type ?? (op as any).operation;
      if (!opType || !op.model) {
        return NextResponse.json(
          { success: false, error: 'Cada operación debe tener operación/tipo y modelo' },
          { status: 400 }
        );
      }

      if (!['create', 'update', 'delete'].includes(opType)) {
        return NextResponse.json(
          { success: false, error: `Operación/tipo '${opType}' no válido` },
          { status: 400 }
        );
      }
    }

    const normalizedOps = operations.map((op: any) => ({
      model: op.model,
      operation: op.operation ?? op.type,
      data: op.data,
      where: op.where
    }));

    // Obtener tenantId del header si está disponible
    const tenantIdFromHeader = request.headers.get('x-tenant-id') || undefined;
    
    // Preparar opciones para CrudService
    const crudOptions = {
      user: user,
      tenantId: tenantIdFromHeader,
      userRole: user.role,
      userId: user.id
    };

    const result = await crudService.transaction(normalizedOps, crudOptions);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in POST /api/crud/transaction:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Ejemplo de uso de transacción:
/*
POST /api/crud/transaction
{
  "operations": [
    {
      "type": "create",
      "model": "booking",
      "data": {
        "courtId": "court-1",
        "userId": "user-1",
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-15T11:00:00Z",
        "totalPrice": 50.00,
        "status": "CONFIRMED"
      }
    },
    {
      "type": "create",
      "model": "payment",
      "data": {
        "bookingId": "{{booking.id}}", // Se resuelve automáticamente
        "amount": 50.00,
        "method": "CREDIT_CARD",
        "status": "COMPLETED"
      }
    }
  ]
}
*/
