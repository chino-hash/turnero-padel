import { NextRequest, NextResponse } from 'next/server';
import { crudService } from '../../../../lib/services/crud-service';
import { auth } from '../../../../lib/auth';

// Verificar permisos de administrador
async function checkAdminPermission() {
  const session = await auth();
  return session?.user?.role === 'ADMIN';
}

// POST - Ejecutar transacción
export async function POST(request: NextRequest) {
  try {
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

    const result = await crudService.transaction(normalizedOps);

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
