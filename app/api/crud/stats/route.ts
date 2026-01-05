import { NextRequest, NextResponse } from 'next/server';
import { CrudService } from '../../../../lib/services/crud-service';
import { prisma } from '../../../../lib/database/neon-config';
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

// Modelos disponibles para estadísticas
const AVAILABLE_MODELS = [
  'user',
  'court',
  'booking',
  'bookingPlayer',
  'payment',
  'systemSetting',
  'producto',
  'adminWhitelist'
];

// Verificar permisos de administrador
async function checkAdminPermission() {
  const session = await auth();
  return session?.user?.role === 'ADMIN';
}

function getService(model: string) {
  const map: Record<string, string> = {
    user: 'User',
    court: 'Court',
    booking: 'Booking',
    bookingPlayer: 'BookingPlayer',
    payment: 'Payment',
    systemSetting: 'SystemSetting',
    producto: 'Producto',
    adminWhitelist: 'AdminWhitelist',
  };
  const name = map[model];
  if (!name) throw new Error(`Modelo '${model}' no disponible`);
  return new CrudService(prisma, name);
}
// GET - Obtener estadísticas
export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const model = url.searchParams.get('model');
    const type = url.searchParams.get('type') || 'general';
    
    // Obtener tenantId del header si está disponible
    const tenantIdFromHeader = request.headers.get('x-tenant-id') || undefined;
    
    // Preparar opciones para CrudService
    const crudOptions = {
      user: user,
      tenantId: tenantIdFromHeader,
      userRole: user.role,
      userId: user.id
    };

    let result;

    if (model) {
      // Estadísticas de un modelo específico
      if (!AVAILABLE_MODELS.includes(model)) {
        return NextResponse.json(
          { success: false, error: `Modelo '${model}' no disponible` },
          { status: 400 }
        );
      }

      const service = getService(model);
      switch (type) {
        case 'table':
          result = await service.getTableStats(crudOptions);
          break;
        case 'count':
          const where = {};
          result = await service.count(where, crudOptions);
          break;
        default:
          // Estadísticas generales del modelo
          const [tableStats, totalCount, activeCount] = await Promise.all([
            service.getTableStats(crudOptions),
            service.count({}, crudOptions),
            service.count({ deletedAt: null }, crudOptions)
          ]);

          result = {
            success: true,
            data: {
              model,
              tableStats: tableStats.success ? tableStats.data : null,
              counts: {
                total: totalCount.success ? totalCount.data : 0,
                active: activeCount.success ? activeCount.data : 0,
                deleted: (totalCount.success && activeCount.success) ? (totalCount.data || 0) - (activeCount.data || 0) : 0
              }
            }
          };
      }
    } else {
      // Estadísticas generales de toda la base de datos
      const stats: Record<string, any> = {};
      
      for (const modelName of AVAILABLE_MODELS) {
        try {
          const service = getService(modelName);
          const [totalCount, activeCount] = await Promise.all([
            service.count({}, crudOptions),
            service.count({ deletedAt: null }, crudOptions)
          ]);

          stats[modelName] = {
            total: totalCount.success ? totalCount.data : 0,
            active: activeCount.success ? activeCount.data : 0,
            deleted: totalCount.success && activeCount.success 
              ? (totalCount.data || 0) - (activeCount.data || 0) 
              : 0
          };
        } catch (error) {
          console.warn(`Error obteniendo estadísticas para ${modelName}:`, error);
          stats[modelName] = {
            total: 0,
            active: 0,
            deleted: 0,
            error: error instanceof Error ? error.message : 'Error desconocido'
          };
        }
      }

      // Calcular totales generales
      const totals = {
        totalRecords: Object.values(stats).reduce((sum: number, model: any) => sum + (model.total || 0), 0),
        activeRecords: Object.values(stats).reduce((sum: number, model: any) => sum + (model.active || 0), 0),
        deletedRecords: Object.values(stats).reduce((sum: number, model: any) => sum + (model.deleted || 0), 0)
      };

      result = {
        success: true,
        data: {
          overview: totals,
          models: stats,
          timestamp: new Date().toISOString()
        }
      };
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/crud/stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Estadísticas personalizadas
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

    // Obtener tenantId del header si está disponible
    const tenantIdFromHeader = request.headers.get('x-tenant-id') || undefined;
    
    // Preparar opciones para CrudService
    const crudOptions = {
      user: user,
      tenantId: tenantIdFromHeader,
      userRole: user.role,
      userId: user.id
    };

    const body = await request.json();
    const { queries } = body;

    if (!queries || !Array.isArray(queries)) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de consultas' },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {};

    for (const query of queries) {
      const { name, model, operation, filters = {} } = query;

      if (!name || !model || !operation) {
        continue;
      }

      if (!AVAILABLE_MODELS.includes(model)) {
        results[name] = {
          success: false,
          error: `Modelo '${model}' no disponible`
        };
        continue;
      }

      try {
        let result;
        const service = getService(model);

        switch (operation) {
          case 'count':
            result = await service.count(filters, crudOptions);
            break;
          case 'read':
            result = await service.read(crudOptions);
            break;
          case 'stats':
            result = await service.getTableStats(crudOptions);
            break;
          default:
            result = {
              success: false,
              error: `Operación '${operation}' no soportada`
            };
        }

        results[name] = result;
      } catch (error: any) {
        results[name] = {
          success: false,
          error: error.message
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in POST /api/crud/stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Ejemplo de uso de estadísticas personalizadas:
/*
POST /api/crud/stats
{
  "queries": [
    {
      "name": "usuarios_activos",
      "model": "user",
      "operation": "count",
      "filters": { "active": true, "deletedAt": null }
    },
    {
      "name": "reservas_hoy",
      "model": "booking",
      "operation": "count",
      "filters": {
        "startTime": {
          "gte": "2024-01-15T00:00:00Z",
          "lt": "2024-01-16T00:00:00Z"
        }
      }
    },
    {
      "name": "pagos_completados",
      "model": "payment",
      "operation": "count",
      "filters": { "status": "COMPLETED" }
    }
  ]
}
*/
