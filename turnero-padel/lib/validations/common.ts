import { z } from 'zod';

// Schema para respuestas de API estandarizadas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string()
  })).optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    totalPages: z.number().optional()
  }).optional()
});

// Schema para paginación
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Schema para filtros de fecha
export const dateRangeSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
}).refine((data) => {
  if (data.dateFrom && data.dateTo) {
    return new Date(data.dateFrom) <= new Date(data.dateTo);
  }
  return true;
}, {
  message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
  path: ['dateTo']
});

// Schema para validar IDs
export const idSchema = z.string().cuid({
  message: 'ID inválido'
});

// Schema para validar múltiples IDs
export const idsSchema = z.array(idSchema).min(1, {
  message: 'Debe proporcionar al menos un ID'
});

// Schema para rate limiting
export const rateLimitSchema = z.object({
  identifier: z.string(),
  limit: z.number().int().min(1),
  window: z.number().int().min(1000), // en milisegundos
  message: z.string().optional()
});

// Tipos derivados
export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRangeParams = z.infer<typeof dateRangeSchema>;
export type RateLimitConfig = z.infer<typeof rateLimitSchema>;

// Tipo para respuestas paginadas
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Funciones helper para respuestas
export const createSuccessResponse = <T>(
  message: string,
  data?: T,
  meta?: ApiResponse['meta']
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  meta
});

export const createErrorResponse = (
  message: string,
  error?: string,
  errors?: Array<{ field: string; message: string }>
): ApiResponse => ({
  success: false,
  message,
  error,
  errors
});

// Función para formatear errores de Zod
export const formatZodErrors = (error: z.ZodError): Array<{ field: string; message: string }> => {
  return error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

// Función para calcular metadatos de paginación
export const calculatePaginationMeta = (
  page: number,
  limit: number,
  total: number
) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit)
});