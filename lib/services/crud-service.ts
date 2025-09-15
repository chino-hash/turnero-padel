import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../database/neon-config';
import { 
  handleError, 
  ValidationError, 
  NotFoundError, 
  BusinessLogicError,
  validatePermissions,
  validateInput,
  sanitizeInput,
  logError
} from '../utils/error-handler';
import { ApiResponse, createSuccessResponse, createErrorResponse } from '../validations/common';
import { 
  validateSchema, 
  getModelSchema, 
  validateModelPermission,
  paginationSchema,
  searchSchema,
  bulkOperationSchema 
} from '../validations/schemas';

type ModelName = keyof PrismaClient;
type ModelDelegate = PrismaClient[ModelName];

interface CrudOptions {
  include?: any;
  select?: any;
  orderBy?: any;
  where?: any;
  userRole?: string;
  userId?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SearchOptions extends PaginationOptions {
  searchFields?: string[];
  searchTerm?: string;
}

export interface CrudResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export class CrudService<T = any> {
  private model: ModelDelegate;
  private modelName: string;
  private prisma: any;

  constructor(prismaInstance: any, modelName: string) {
    this.modelName = modelName;
    this.model = prismaInstance[modelName];
    this.prisma = prismaInstance;
    
    if (!this.model) {
      throw new Error(`Modelo ${modelName} no encontrado`);
    }
  }

  // Helper para convertir errores al formato ApiResponse
  private handleApiError(error: unknown): ApiResponse<T> {
    const errorResponse = handleError(error);
    return createErrorResponse(
      errorResponse.error,
      errorResponse.error,
      errorResponse.field ? [{ field: errorResponse.field, message: errorResponse.error }] : undefined
    );
  }

  private handleApiErrorArray(error: unknown): ApiResponse<T[]> {
    const errorResponse = handleError(error);
    return createErrorResponse(
      errorResponse.error,
      errorResponse.error,
      errorResponse.field ? [{ field: errorResponse.field, message: errorResponse.error }] : undefined
    );
  }

  private handleApiErrorPaginated(error: unknown): ApiResponse<PaginatedData<T>> {
    const errorResponse = handleError(error);
    return createErrorResponse(
      errorResponse.error,
      errorResponse.error,
      errorResponse.field ? [{ field: errorResponse.field, message: errorResponse.error }] : undefined
    );
  }

  private handleApiErrorNumber(error: unknown): ApiResponse<number> {
    const errorResponse = handleError(error);
    return createErrorResponse(
      errorResponse.error,
      errorResponse.error,
      errorResponse.field ? [{ field: errorResponse.field, message: errorResponse.error }] : undefined
    );
  }

  private handleApiErrorAny(error: unknown): ApiResponse<any> {
    const errorResponse = handleError(error);
    return createErrorResponse(
      errorResponse.error,
      errorResponse.error,
      errorResponse.field ? [{ field: errorResponse.field, message: errorResponse.error }] : undefined
    );
  }

  // Validar datos según reglas definidas
  private validateData(data: any, rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = data[rule.field];

      // Validar campo requerido
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`El campo ${rule.field} es requerido`);
        continue;
      }

      // Si el campo está vacío y no es requerido, continuar
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Validar tipo
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`El campo ${rule.field} debe ser una cadena de texto`);
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`El campo ${rule.field} debe ser un número`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`El campo ${rule.field} debe ser verdadero o falso`);
            }
            break;
          case 'date':
            if (!(value instanceof Date) && isNaN(Date.parse(value))) {
              errors.push(`El campo ${rule.field} debe ser una fecha válida`);
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`El campo ${rule.field} debe ser un email válido`);
            }
            break;
        }
      }

      // Validar longitud mínima
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(`El campo ${rule.field} debe tener al menos ${rule.minLength} caracteres`);
      }

      // Validar longitud máxima
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`El campo ${rule.field} no puede tener más de ${rule.maxLength} caracteres`);
      }

      // Validar valor mínimo
      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        errors.push(`El campo ${rule.field} debe ser mayor o igual a ${rule.min}`);
      }

      // Validar valor máximo
      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        errors.push(`El campo ${rule.field} debe ser menor o igual a ${rule.max}`);
      }

      // Validar patrón
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`El campo ${rule.field} no tiene el formato correcto`);
      }

      // Validación personalizada
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push(typeof customResult === 'string' ? customResult : `El campo ${rule.field} no es válido`);
        }
      }
    }

    return errors;
  }

  // Crear un registro
  async create(
    data: any,
    validationRules: ValidationRule[] = [],
    options: CrudOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'create', options.userRole)) {
          throw new ValidationError(`No tiene permisos para crear ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar y sanitizar datos
      if (!data || Object.keys(data).length === 0) {
        throw new ValidationError('Los datos son requeridos para crear un registro', 'data', 'REQUIRED_DATA');
      }

      const sanitizedData = sanitizeInput(data);
      
      // Validar datos
      const validationErrors = this.validateData(sanitizedData, validationRules);
      if (validationErrors.length > 0) {
        throw new ValidationError(`Errores de validación: ${validationErrors.join(', ')}`, 'validation', 'VALIDATION_FAILED');
      }

      // Validar esquema
      const schema = getModelSchema(this.modelName, 'create');
      const validatedData = validateSchema(schema, sanitizedData);

      // Agregar metadatos de auditoría
      const createData = {
        ...validatedData,
        ...(options.userId && { createdBy: options.userId }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await (this.model as any).create({
        data: createData,
        include: options.include,
        select: options.select
      });

      return createSuccessResponse(`${this.modelName} creado exitosamente`, result);
    } catch (error: any) {
      logError(error, `CrudService.create - ${this.modelName}`);
      return this.handleApiError(error);
    }
  }

  // Leer registros
  async read(
    options: CrudOptions & PaginationOptions = {}
  ): Promise<ApiResponse<PaginatedData<T>>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'read', options.userRole)) {
          throw new ValidationError(`No tiene permisos para leer ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar parámetros de paginación
      const paginationParams = {
        page: options.page || 1,
        limit: options.limit || 10,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder || 'desc'
      };
      
      const validatedPagination = validateSchema(paginationSchema, paginationParams);
      
      const skip = (validatedPagination.page - 1) * validatedPagination.limit;
      const take = validatedPagination.limit;

      // Construir orderBy
      let orderBy = options.orderBy;
      if (validatedPagination.sortBy) {
        orderBy = { [validatedPagination.sortBy]: validatedPagination.sortOrder };
      }

      // Filtrar registros eliminados por defecto (soft delete)
      const where = {
        ...options.where,
        deletedAt: null
      };

      const [result, total] = await Promise.all([
        (this.model as any).findMany({
          where,
          include: options.include,
          select: options.select,
          orderBy,
          skip,
          take
        }),
        (this.model as any).count({ where })
      ]);

      const responseData = {
        items: result,
        pagination: {
          total,
          page: validatedPagination.page,
          limit: validatedPagination.limit,
          totalPages: Math.ceil(total / validatedPagination.limit),
          hasNext: validatedPagination.page < Math.ceil(total / validatedPagination.limit),
          hasPrev: validatedPagination.page > 1
        }
      };

      return createSuccessResponse(`${this.modelName} obtenidos exitosamente`, responseData);
    } catch (error: any) {
      logError(error, `CrudService.read - ${this.modelName}`);
      return this.handleApiErrorPaginated(error);
    }
  }

  // Leer un registro por ID
  async readById(
    id: string,
    options: CrudOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'read', options.userRole)) {
          throw new ValidationError(`No tiene permisos para leer ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar ID
      if (!id) {
        throw new ValidationError('ID es requerido', 'id', 'REQUIRED_ID');
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new ValidationError('Formato de ID inválido', 'id', 'INVALID_ID_FORMAT');
      }

      // Incluir filtro de soft delete
      const where = {
        id,
        deletedAt: null
      };

      const result = await (this.model as any).findFirst({
        where,
        include: options.include,
        select: options.select
      });

      if (!result) {
        throw new NotFoundError(this.modelName, id);
      }

      return createSuccessResponse(`${this.modelName} encontrado exitosamente`, result);
    } catch (error: any) {
      logError(error, `CrudService.readById - ${this.modelName}`);
      return this.handleApiError(error);
    }
  }

  // Actualizar un registro
  async update(
    id: string,
    data: any,
    validationRules: ValidationRule[] = [],
    options: CrudOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'update', options.userRole)) {
          throw new ValidationError(`No tiene permisos para actualizar ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar ID
      if (!id) {
        throw new ValidationError('ID es requerido', 'id', 'REQUIRED_ID');
      }

      // Validar datos
      if (!data || Object.keys(data).length === 0) {
        throw new ValidationError('Los datos son requeridos para actualizar un registro', 'data', 'REQUIRED_DATA');
      }

      // Verificar si el registro existe y no está eliminado
      const existingRecord = await (this.model as any).findFirst({
        where: { id, deletedAt: null }
      });
      
      if (!existingRecord) {
        throw new NotFoundError(this.modelName, id);
      }

      // Sanitizar y validar datos
      const sanitizedData = sanitizeInput(data);
      
      // Validar datos
      const validationErrors = this.validateData(sanitizedData, validationRules);
      if (validationErrors.length > 0) {
        throw new ValidationError(`Errores de validación: ${validationErrors.join(', ')}`, 'validation', 'VALIDATION_FAILED');
      }

      const schema = getModelSchema(this.modelName, 'update');
      const validatedData = validateSchema(schema, sanitizedData);

      // Agregar metadatos de auditoría
      const updateData = {
        ...validatedData,
        ...(options.userId && { updatedBy: options.userId }),
        updatedAt: new Date()
      };

      const result = await (this.model as any).update({
        where: { id },
        data: updateData,
        include: options.include,
        select: options.select
      });

      return createSuccessResponse(`${this.modelName} actualizado exitosamente`, result);
    } catch (error: any) {
      logError(error, `CrudService.update - ${this.modelName}`);
      return this.handleApiError(error);
    }
  }

  // Eliminar un registro (soft delete)
  async delete(id: string, options: CrudOptions = {}): Promise<ApiResponse<T>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'delete', options.userRole)) {
          throw new ValidationError(`No tiene permisos para eliminar ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar ID
      if (!id) {
        throw new ValidationError('ID es requerido', 'id', 'REQUIRED_ID');
      }

      // Verificar que el registro existe y no está eliminado
      const existingRecord = await (this.model as any).findFirst({
        where: { id, deletedAt: null }
      });

      if (!existingRecord) {
        throw new NotFoundError(this.modelName, id);
      }

      const result = await (this.model as any).update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
          ...(options.userId && { deletedBy: options.userId })
        }
      });

      return createSuccessResponse(`${this.modelName} eliminado exitosamente`, result);
    } catch (error: any) {
      logError(error, `CrudService.delete - ${this.modelName}`);
      return this.handleApiError(error);
    }
  }

  // Eliminar permanentemente un registro
  async hardDelete(id: string, options: CrudOptions = {}): Promise<ApiResponse<T>> {
    try {
      // Validar permisos (requiere permisos especiales)
      if (options.userRole) {
        const roleHierarchy = { 'SUPER_ADMIN': 4, 'ADMIN': 3, 'MANAGER': 2, 'USER': 1, 'GUEST': 0 };
        const userLevel = roleHierarchy[options.userRole as keyof typeof roleHierarchy] || 0;
        if (userLevel < 3) { // Solo ADMIN o superior
          throw new ValidationError(`No tiene permisos para eliminar permanentemente ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar ID
      if (!id) {
        throw new ValidationError('ID es requerido', 'id', 'REQUIRED_ID');
      }

      // Verificar que el registro existe
      const existingRecord = await (this.model as any).findUnique({
        where: { id }
      });

      if (!existingRecord) {
        throw new NotFoundError(this.modelName, id);
      }

      const result = await (this.model as any).delete({
        where: { id }
      });

      return createSuccessResponse(`${this.modelName} eliminado permanentemente`, result);
    } catch (error: any) {
      logError(error, `CrudService.hardDelete - ${this.modelName}`);
      return this.handleApiError(error);
    }
  }

  // Restaurar un registro eliminado (soft delete)
  async restore(id: string, options: CrudOptions = {}): Promise<ApiResponse<T>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'update', options.userRole)) {
          throw new ValidationError(`No tiene permisos para restaurar ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar ID
      if (!id) {
        throw new ValidationError('ID es requerido', 'id', 'REQUIRED_ID');
      }

      // Verificar que el registro existe y está eliminado
      const existingRecord = await (this.model as any).findFirst({
        where: { id, deletedAt: { not: null } }
      });

      if (!existingRecord) {
        throw new NotFoundError(`${this.modelName} eliminado`, id);
      }

      const result = await (this.model as any).update({
        where: { id },
        data: {
          deletedAt: null,
          updatedAt: new Date(),
          ...(options.userId && { restoredBy: options.userId })
        }
      });

      return createSuccessResponse(`${this.modelName} restaurado exitosamente`, result);
    } catch (error: any) {
      logError(error, `CrudService.restore - ${this.modelName}`);
      return this.handleApiError(error);
    }
  }

  // Contar registros
  async count(where: any = {}, options: CrudOptions = {}): Promise<ApiResponse<number>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'read', options.userRole)) {
          throw new ValidationError(`No tiene permisos para contar ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      const count = await (this.model as any).count({
        where: {
          deletedAt: null,
          ...where
        }
      });

      return createSuccessResponse(`Conteo de ${this.modelName} obtenido exitosamente`, count);
    } catch (error: any) {
      logError(error, `CrudService.count - ${this.modelName}`);
      return this.handleApiErrorNumber(error);
    }
  }

  // Buscar registros con filtros avanzados
  async search(
    searchTerm: string,
    searchFields: string[],
    options: CrudOptions = {}
  ): Promise<ApiResponse<T[]>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'read', options.userRole)) {
          throw new ValidationError(`No tiene permisos para buscar ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar parámetros de búsqueda
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new ValidationError('Término de búsqueda es requerido', 'searchTerm', 'REQUIRED_SEARCH_TERM');
      }

      if (!searchFields || searchFields.length === 0) {
        throw new ValidationError('Campos de búsqueda son requeridos', 'searchFields', 'REQUIRED_SEARCH_FIELDS');
      }

      // Sanitizar término de búsqueda
      const sanitizedTerm = sanitizeInput(searchTerm.trim());

      const searchConditions = searchFields.map(field => ({
        [field]: {
          contains: sanitizedTerm,
          mode: 'insensitive'
        }
      }));

      const result = await (this.model as any).findMany({
        where: {
          deletedAt: null,
          OR: searchConditions,
          ...options.where
        },
        take: 50, // Limitar resultados por defecto
        orderBy: options.orderBy || { createdAt: 'desc' },
        include: options.include,
        select: options.select
      });

      return createSuccessResponse(`Búsqueda en ${this.modelName} completada exitosamente`, result);
    } catch (error: any) {
      logError(error, `CrudService.search - ${this.modelName}`);
      return this.handleApiErrorArray(error);
    }
  }

  // Verificar dependencias antes de eliminar
  private async checkDependencies(id: string): Promise<void> {
    // Implementar lógica específica por modelo si es necesario
    // Por ejemplo, verificar si una cancha tiene reservas activas
    if (this.modelName === 'Court') {
      const activeBookings = await this.prisma.booking.count({
        where: {
          courtId: id,
          status: { in: ['CONFIRMED', 'PENDING'] },
          deletedAt: null
        }
      });
      
      if (activeBookings > 0) {
        throw new ValidationError(
          'No se puede eliminar la cancha porque tiene reservas activas',
          'dependencies',
          'ACTIVE_DEPENDENCIES'
        );
      }
    }
  }

  // Verificar dependencias críticas antes de eliminación permanente
  private async checkCriticalDependencies(id: string): Promise<void> {
    // Implementar verificaciones más estrictas para eliminación permanente
    await this.checkDependencies(id);
    
    // Verificaciones adicionales para eliminación permanente
    if (this.modelName === 'User') {
      const hasBookings = await this.prisma.booking.count({
        where: { userId: id }
      });
      
      if (hasBookings > 0) {
        throw new ValidationError(
          'No se puede eliminar permanentemente el usuario porque tiene historial de reservas',
          'critical_dependencies',
          'CRITICAL_DEPENDENCIES'
        );
      }
    }
  }

  // Aplicar filtros de soft delete
  private applySoftDeleteFilter(where: any = {}): any {
    return {
      ...where,
      deletedAt: null
    };
  }

  // Agregar metadatos de auditoría
  private addAuditMetadata(data: any, userId?: string, isUpdate = false): any {
    const timestamp = new Date();
    const auditData = {
      ...data,
      updatedAt: timestamp
    };

    if (!isUpdate) {
      auditData.createdAt = timestamp;
    }

    if (userId) {
      if (!isUpdate) {
        auditData.createdBy = userId;
      }
      auditData.updatedBy = userId;
    }

    return auditData;
  }

  // Manejar errores de Prisma
  private handlePrismaError(error: any): string {
    if (error.code) {
      switch (error.code) {
        case 'P2002':
          return 'Ya existe un registro con estos datos únicos';
        case 'P2025':
          return 'Registro no encontrado';
        case 'P2003':
          return 'Error de referencia: el registro está relacionado con otros datos';
        case 'P2014':
          return 'Error de relación: datos relacionados inválidos';
        case 'P2016':
          return 'Error de consulta: parámetros inválidos';
        case 'P2021':
          return 'La tabla no existe en la base de datos';
        case 'P2022':
          return 'La columna no existe en la base de datos';
        default:
          return `Error de base de datos: ${error.message}`;
      }
    }
    return error.message || 'Error desconocido';
  }

  // Ejecutar transacciones
  async transaction(
    operations: Array<{
      model: string;
      operation: 'create' | 'update' | 'delete';
      data: any;
      where?: any;
    }>,
    options: CrudOptions = {}
  ): Promise<ApiResponse<T[]>> {
    try {
      // Validar permisos para transacciones (requiere permisos especiales)
      if (options.userRole) {
        const roleHierarchy = { 'SUPER_ADMIN': 4, 'ADMIN': 3, 'MANAGER': 2, 'USER': 1, 'GUEST': 0 };
        const userLevel = roleHierarchy[options.userRole as keyof typeof roleHierarchy] || 0;
        if (userLevel < 2) { // Solo MANAGER o superior
          throw new ValidationError('No tiene permisos para ejecutar transacciones', 'permission', 'PERMISSION_DENIED');
        }
      }

      // Validar operaciones
      if (!operations || operations.length === 0) {
        throw new ValidationError('Se requiere al menos una operación', 'operations', 'REQUIRED_OPERATIONS');
      }

      if (operations.length > 10) {
        throw new ValidationError('Máximo 10 operaciones por transacción', 'operations', 'MAX_OPERATIONS_EXCEEDED');
      }

      // Validar cada operación
      for (const op of operations) {
        if (!op.model || !op.operation) {
          throw new ValidationError('Cada operación debe tener modelo y operación', 'operations', 'INVALID_OPERATION');
        }

        // Validar permisos por modelo
        const action = op.operation === 'create' ? 'create' : op.operation === 'update' ? 'update' : 'delete';
        if (options.userRole && !validateModelPermission(op.model, action, options.userRole)) {
          throw new ValidationError(`No tiene permisos para ${action} en ${op.model}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      const results = await this.prisma.$transaction(
         operations.map(op => {
           const sanitizedData = sanitizeInput(op.data);
           
           switch (op.operation) {
             case 'create':
               return (this.prisma as any)[op.model].create({ 
                 data: {
                   ...sanitizedData,
                   createdAt: new Date(),
                   updatedAt: new Date(),
                   ...(options.userId && { createdBy: options.userId })
                 }
               });
             case 'update':
               return (this.prisma as any)[op.model].update({
                 where: op.where,
                 data: {
                   ...sanitizedData,
                   updatedAt: new Date(),
                   ...(options.userId && { updatedBy: options.userId })
                 }
               });
             case 'delete':
               return (this.prisma as any)[op.model].update({
                 where: op.where,
                 data: { 
                   deletedAt: new Date(),
                   updatedAt: new Date(),
                   ...(options.userId && { deletedBy: options.userId })
                 }
               });
             default:
               throw new ValidationError(`Operación no soportada: ${op.operation}`, 'operation', 'UNSUPPORTED_OPERATION');
           }
         })
       );

      return createSuccessResponse('Transacción ejecutada exitosamente', results);
    } catch (error: any) {
      logError(error, 'CrudService.transaction');
      return this.handleApiErrorArray(error);
    }
  }

  // Obtener estadísticas de una tabla
  async getTableStats(options: CrudOptions = {}): Promise<ApiResponse<any>> {
    try {
      // Validar permisos
      if (options.userRole) {
        if (!validateModelPermission(this.modelName, 'read', options.userRole)) {
          throw new ValidationError(`No tiene permisos para ver estadísticas de ${this.modelName}`, 'permission', 'PERMISSION_DENIED');
        }
      }

      const total = await (this.model as any).count();
      const active = await (this.model as any).count({
        where: { deletedAt: null }
      });
      const deleted = total - active;

      // Obtener registros recientes (últimos 7 días)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      
      const recent = await (this.model as any).count({
        where: {
          createdAt: { gte: recentDate },
          deletedAt: null
        }
      });

      // Obtener registros del último mes
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - 1);
      
      const lastMonth = await (this.model as any).count({
        where: {
          createdAt: { gte: monthDate },
          deletedAt: null
        }
      });

      const stats = {
        model: this.modelName,
        total,
        active,
        deleted,
        recent,
        lastMonth,
        deletionRate: total > 0 ? (deleted / total * 100).toFixed(2) : '0.00',
        growthRate: lastMonth > 0 && recent > 0 ? ((recent / lastMonth * 100) - 100).toFixed(2) : '0.00'
      };

      return createSuccessResponse(`Estadísticas de ${this.modelName} obtenidas exitosamente`, stats);
    } catch (error: any) {
      logError(error, `CrudService.getTableStats - ${this.modelName}`);
      return this.handleApiErrorAny(error);
    }
  }
}

// Instancia singleton del servicio CRUD
export const crudService = new CrudService(prisma, 'user');