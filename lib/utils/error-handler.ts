import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

// Tipos de errores personalizados
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public code?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` con ID ${id}` : ''} no encontrado`);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends Error {
  constructor(action: string, resource: string) {
    super(`No tiene permisos para ${action} ${resource}`);
    this.name = 'PermissionError';
  }
}

export class BusinessLogicError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

// Interfaz para respuestas de error estandarizadas
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  field?: string;
  details?: any;
  timestamp: string;
}

// Interfaz para respuestas exitosas
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Función principal para manejar errores
export function handleError(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();
  
  console.error('Error capturado:', error);

  // Errores personalizados
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      code: error.code || 'VALIDATION_ERROR',
      field: error.field,
      timestamp
    };
  }

  if (error instanceof NotFoundError) {
    return {
      success: false,
      error: error.message,
      code: 'NOT_FOUND',
      timestamp
    };
  }

  if (error instanceof PermissionError) {
    return {
      success: false,
      error: error.message,
      code: 'PERMISSION_DENIED',
      timestamp
    };
  }

  if (error instanceof BusinessLogicError) {
    return {
      success: false,
      error: error.message,
      code: error.code || 'BUSINESS_LOGIC_ERROR',
      timestamp
    };
  }

  // Errores de Zod (validación de esquemas)
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    return {
      success: false,
      error: `Error de validación: ${firstError.message}`,
      code: 'SCHEMA_VALIDATION_ERROR',
      field: firstError.path.join('.'),
      details: error.issues,
      timestamp
    };
  }

  // Errores de Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, timestamp);
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      success: false,
      error: 'Error desconocido en la base de datos',
      code: 'DATABASE_UNKNOWN_ERROR',
      timestamp
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      success: false,
      error: 'Error crítico en la base de datos',
      code: 'DATABASE_CRITICAL_ERROR',
      timestamp
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      success: false,
      error: 'Error de conexión a la base de datos',
      code: 'DATABASE_CONNECTION_ERROR',
      timestamp
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      success: false,
      error: 'Error de validación en la consulta de base de datos',
      code: 'DATABASE_VALIDATION_ERROR',
      details: error.message,
      timestamp
    };
  }

  // Error genérico de JavaScript
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: 'GENERIC_ERROR',
      timestamp
    };
  }

  // Error desconocido
  return {
    success: false,
    error: 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp
  };
}

// Manejo específico de errores de Prisma
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, timestamp: string): ErrorResponse {
  switch (error.code) {
    case 'P2000':
      return {
        success: false,
        error: 'El valor proporcionado es demasiado largo para el campo',
        code: 'VALUE_TOO_LONG',
        details: error.meta,
        timestamp
      };

    case 'P2001':
      return {
        success: false,
        error: 'El registro buscado no existe',
        code: 'RECORD_NOT_FOUND',
        details: error.meta,
        timestamp
      };

    case 'P2002':
      const target = error.meta?.target as string[];
      const field = target ? target[0] : 'campo';
      return {
        success: false,
        error: `Ya existe un registro con este ${field}`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        field,
        details: error.meta,
        timestamp
      };

    case 'P2003':
      return {
        success: false,
        error: 'Violación de clave foránea. El registro referenciado no existe',
        code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
        details: error.meta,
        timestamp
      };

    case 'P2004':
      return {
        success: false,
        error: 'Violación de restricción en la base de datos',
        code: 'CONSTRAINT_VIOLATION',
        details: error.meta,
        timestamp
      };

    case 'P2005':
      return {
        success: false,
        error: 'Valor inválido para el tipo de campo',
        code: 'INVALID_FIELD_VALUE',
        details: error.meta,
        timestamp
      };

    case 'P2006':
      return {
        success: false,
        error: 'Valor inválido proporcionado',
        code: 'INVALID_VALUE',
        details: error.meta,
        timestamp
      };

    case 'P2007':
      return {
        success: false,
        error: 'Error de validación de datos',
        code: 'DATA_VALIDATION_ERROR',
        details: error.meta,
        timestamp
      };

    case 'P2008':
      return {
        success: false,
        error: 'Error al parsear la consulta',
        code: 'QUERY_PARSING_ERROR',
        details: error.meta,
        timestamp
      };

    case 'P2009':
      return {
        success: false,
        error: 'Error al validar la consulta',
        code: 'QUERY_VALIDATION_ERROR',
        details: error.meta,
        timestamp
      };

    case 'P2010':
      return {
        success: false,
        error: 'Error de consulta en bruto',
        code: 'RAW_QUERY_ERROR',
        details: error.meta,
        timestamp
      };

    case 'P2011':
      return {
        success: false,
        error: 'Violación de restricción de nulidad',
        code: 'NULL_CONSTRAINT_VIOLATION',
        details: error.meta,
        timestamp
      };

    case 'P2012':
      return {
        success: false,
        error: 'Falta un valor requerido',
        code: 'MISSING_REQUIRED_VALUE',
        details: error.meta,
        timestamp
      };

    case 'P2013':
      return {
        success: false,
        error: 'Falta un argumento requerido',
        code: 'MISSING_REQUIRED_ARGUMENT',
        details: error.meta,
        timestamp
      };

    case 'P2014':
      return {
        success: false,
        error: 'Cambio violaría una relación requerida',
        code: 'REQUIRED_RELATION_VIOLATION',
        details: error.meta,
        timestamp
      };

    case 'P2015':
      return {
        success: false,
        error: 'No se pudo encontrar un registro relacionado',
        code: 'RELATED_RECORD_NOT_FOUND',
        details: error.meta,
        timestamp
      };

    case 'P2016':
      return {
        success: false,
        error: 'Error de interpretación de consulta',
        code: 'QUERY_INTERPRETATION_ERROR',
        details: error.meta,
        timestamp
      };

    case 'P2017':
      return {
        success: false,
        error: 'Los registros de la relación no están conectados',
        code: 'RECORDS_NOT_CONNECTED',
        details: error.meta,
        timestamp
      };

    case 'P2018':
      return {
        success: false,
        error: 'No se encontraron los registros conectados requeridos',
        code: 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND',
        details: error.meta,
        timestamp
      };

    case 'P2019':
      return {
        success: false,
        error: 'Error de entrada',
        code: 'INPUT_ERROR',
        details: error.meta,
        timestamp
      };

    case 'P2020':
      return {
        success: false,
        error: 'Valor fuera de rango',
        code: 'VALUE_OUT_OF_RANGE',
        details: error.meta,
        timestamp
      };

    case 'P2021':
      return {
        success: false,
        error: 'La tabla no existe en la base de datos',
        code: 'TABLE_NOT_EXISTS',
        details: error.meta,
        timestamp
      };

    case 'P2022':
      return {
        success: false,
        error: 'La columna no existe en la base de datos',
        code: 'COLUMN_NOT_EXISTS',
        details: error.meta,
        timestamp
      };

    case 'P2025':
      return {
        success: false,
        error: 'Operación falló porque depende de uno o más registros que no fueron encontrados',
        code: 'DEPENDENT_RECORDS_NOT_FOUND',
        details: error.meta,
        timestamp
      };

    default:
      return {
        success: false,
        error: `Error de base de datos: ${error.message}`,
        code: `PRISMA_${error.code}`,
        details: error.meta,
        timestamp
      };
  }
}

// Función para crear respuestas exitosas
export function createSuccessResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

// Función para validar permisos
export function validatePermissions(userRole: string, requiredRole: string, action: string, resource: string) {
  const roleHierarchy = {
    'SUPER_ADMIN': 4,
    'ADMIN': 3,
    'MANAGER': 2,
    'USER': 1,
    'GUEST': 0
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  if (userLevel < requiredLevel) {
    throw new PermissionError(action, resource);
  }
}

// Función para validar datos de entrada
export function validateInput(data: any, requiredFields: string[]) {
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      throw new ValidationError(`El campo '${field}' es requerido`, field, 'REQUIRED_FIELD');
    }
  }
}

// Función para sanitizar datos de entrada
export function sanitizeInput(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Remover campos que empiecen con underscore (campos internos)
    if (key.startsWith('_')) {
      continue;
    }

    // Sanitizar strings
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    }
    // Recursivamente sanitizar objetos anidados
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    }
    // Mantener otros tipos de datos
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Función para log de errores
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  };

  console.error('Error logged:', JSON.stringify(errorInfo, null, 2));
  
  // Aquí podrías enviar el error a un servicio de logging externo
  // como Sentry, LogRocket, etc.
}

// Middleware para manejo de errores en API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<ApiResponse<R>> => {
    try {
      const result = await handler(...args);
      return createSuccessResponse(result);
    } catch (error) {
      logError(error, handler.name);
      return handleError(error);
    }
  };
}