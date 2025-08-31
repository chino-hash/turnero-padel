import { NextRequest, NextResponse } from 'next/server';
import { crudService } from '@/lib/services/crud-service';
import { getServerSession } from 'next-auth';
import { config as authOptions } from '@/lib/auth';

// Verificar permisos de administrador
async function checkAdminPermission() {
  const session = await getServerSession(authOptions);
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

    // Validar operaciones
    for (const op of operations) {
      if (!op.type || !op.model) {
        return NextResponse.json(
          { success: false, error: 'Cada operación debe tener tipo y modelo' },
          { status: 400 }
        );
      }

      if (!['create', 'update', 'delete'].includes(op.type)) {
        return NextResponse.json(
          { success: false, error: `Tipo de operación '${op.type}' no válido` },
          { status: 400 }
        );
      }
    }

    const result = await crudService.transaction(operations);

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