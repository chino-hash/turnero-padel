import { NextRequest, NextResponse } from 'next/server';
import { crudService } from '@/lib/services/crud-service';
import { getTestDataByModel, getValidationRules } from '@/lib/services/test-data';
import { auth } from '@/lib/auth';
import { config as authOptions } from '@/lib/auth';

// Modelos permitidos para operaciones CRUD
const ALLOWED_MODELS = [
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

// Validar modelo
function validateModel(model: string) {
  if (!ALLOWED_MODELS.includes(model)) {
    throw new Error(`Modelo '${model}' no permitido`);
  }
}

// GET - Leer registros
export async function GET(request: NextRequest, { params }: { params: Promise<{ params: string[] }> }) {
  try {
    const resolvedParams = await params;
    const [model, id] = resolvedParams.params;
    
    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Modelo requerido' },
        { status: 400 }
      );
    }

    validateModel(model);

    // Verificar permisos para modelos sensibles
    if (['user', 'payment', 'adminWhitelist'].includes(model)) {
      const hasPermission = await checkAdminPermission();
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Permisos insuficientes' },
          { status: 403 }
        );
      }
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Opciones de consulta
    const options: any = {};
    
    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    options.skip = (page - 1) * limit;
    options.take = limit;
    
    // Ordenamiento
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    if (sortBy) {
      options.orderBy = { [sortBy]: sortOrder };
    }
    
    // Filtros
    const filters: any = {};
    for (const [key, value] of searchParams.entries()) {
      if (!['page', 'limit', 'sortBy', 'sortOrder', 'search', 'searchFields'].includes(key)) {
        // Convertir valores booleanos y numéricos
        if (value === 'true') filters[key] = true;
        else if (value === 'false') filters[key] = false;
        else if (!isNaN(Number(value))) filters[key] = Number(value);
        else filters[key] = value;
      }
    }
    
    if (Object.keys(filters).length > 0) {
      options.where = filters;
    }
    
    // Búsqueda de texto
    const search = searchParams.get('search');
    const searchFields = searchParams.get('searchFields')?.split(',') || [];
    
    let result;
    
    if (id) {
      // Obtener un registro específico
      result = await crudService.readById(id, options);
    } else if (search && searchFields.length > 0) {
      // Búsqueda de texto
      result = await crudService.search(search, searchFields, options);
    } else {
      // Obtener todos los registros
      result = await crudService.read(options);
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Agregar metadatos de paginación
    const response = {
      ...result,
      pagination: {
        page,
        limit,
        total: result.data?.pagination?.total || 0,
        pages: Math.ceil((result.data?.pagination?.total || 0) / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in GET /api/crud:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear registro
export async function POST(request: NextRequest, { params }: { params: Promise<{ params: string[] }> }) {
  try {
    const resolvedParams = await params;
    const [model] = resolvedParams.params;
    
    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Modelo requerido' },
        { status: 400 }
      );
    }

    validateModel(model);

    // Verificar permisos para modelos sensibles
    if (['user', 'payment', 'adminWhitelist'].includes(model)) {
      const hasPermission = await checkAdminPermission();
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Permisos insuficientes' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validationRules = getValidationRules(model);
    
    const result = await crudService.create(body, validationRules);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/crud:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar registro
export async function PUT(request: NextRequest, { params }: { params: Promise<{ params: string[] }> }) {
  try {
    const resolvedParams = await params;
    const [model, id] = resolvedParams.params;
    
    if (!model || !id) {
      return NextResponse.json(
        { success: false, error: 'Modelo e ID requeridos' },
        { status: 400 }
      );
    }

    validateModel(model);

    // Verificar permisos para modelos sensibles
    if (['user', 'payment', 'adminWhitelist'].includes(model)) {
      const hasPermission = await checkAdminPermission();
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: 'Permisos insuficientes' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const validationRules = getValidationRules(model);
    
    const result = await crudService.update(id, body, validationRules);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PUT /api/crud:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar registro (soft delete)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ params: string[] }> }) {
  try {
    const resolvedParams = await params;
    const [model, id] = resolvedParams.params;
    
    if (!model || !id) {
      return NextResponse.json(
        { success: false, error: 'Modelo e ID requeridos' },
        { status: 400 }
      );
    }

    validateModel(model);

    // Verificar permisos de administrador
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const hard = url.searchParams.get('hard') === 'true';
    
    let result;
    if (hard) {
      result = await crudService.hardDelete(id);
    } else {
      result = await crudService.delete(id);
    }
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in DELETE /api/crud:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Operaciones especiales
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ params: string[] }> }) {
  try {
    const resolvedParams = await params;
    const [model, id, action] = resolvedParams.params;
    
    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Modelo requerido' },
        { status: 400 }
      );
    }

    validateModel(model);

    // Verificar permisos de administrador
    const hasPermission = await checkAdminPermission();
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Permisos insuficientes' },
        { status: 403 }
      );
    }

    let result;
    
    switch (action) {
      case 'restore':
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'ID requerido para restaurar' },
            { status: 400 }
          );
        }
        result = await crudService.restore(id);
        break;
        
      case 'count':
        const body = await request.json().catch(() => ({}));
        result = await crudService.count(body.where || {});
        break;
        
      case 'stats':
        result = await crudService.getTableStats();
        break;
        
      case 'seed':
        // Sembrar datos de prueba
        const testData = getTestDataByModel(model);
        if (testData.length === 0) {
          return NextResponse.json(
            { success: false, error: `No hay datos de prueba para el modelo ${model}` },
            { status: 400 }
          );
        }
        
        const seedResults = [];
        const validationRules = getValidationRules(model);
        
        for (const data of testData) {
          const seedResult = await crudService.create(data, validationRules);
          seedResults.push(seedResult);
        }
        
        const successCount = seedResults.filter(r => r.success).length;
        const errorCount = seedResults.filter(r => !r.success).length;
        
        result = {
          success: true,
          data: {
            total: seedResults.length,
            success: successCount,
            errors: errorCount,
            results: seedResults
          }
        };
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: `Acción '${action}' no reconocida` },
          { status: 400 }
        );
    }
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in PATCH /api/crud:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}