import { NextRequest, NextResponse } from 'next/server';
import { crudService } from '../../../../lib/services/crud-service';
import { auth } from '../../../../lib/auth';

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

// GET - Obtener estadísticas
export async function GET(request: NextRequest) {
  try {
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

    let result;

    if (model) {
      // Estadísticas de un modelo específico
      if (!AVAILABLE_MODELS.includes(model)) {
        return NextResponse.json(
          { success: false, error: `Modelo '${model}' no disponible` },
          { status: 400 }
        );
      }

      switch (type) {
        case 'table':
          result = await crudService.getTableStats({ userRole: 'ADMIN' });
          break;
        case 'count':
          const where = {}; // Puedes agregar filtros aquí
          result = await crudService.count(where, { userRole: 'ADMIN' });
          break;
        default:
          // Estadísticas generales del modelo
          const [tableStats, totalCount, activeCount] = await Promise.all([
            crudService.getTableStats({ userRole: 'ADMIN' }),
            crudService.count({}, { userRole: 'ADMIN' }),
            crudService.count({ deletedAt: null }, { userRole: 'ADMIN' })
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
          const [totalCount, activeCount] = await Promise.all([
            crudService.count({}, { userRole: 'ADMIN' }),
            crudService.count({ deletedAt: null }, { userRole: 'ADMIN' })
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
    // Verificar permisos de administrador
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

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

        switch (operation) {
          case 'count':
            result = await crudService.count(model, filters);
            break;
          case 'read':
            result = await crudService.read(model);
            break;
          case 'stats':
            result = await crudService.getTableStats(model);
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