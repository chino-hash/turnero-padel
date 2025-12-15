import { z } from 'zod';

// Definir enums como constantes para evitar problemas de importación en tests
const RoleEnum = {
  USER: 'USER',
  ADMIN: 'ADMIN'
} as const;

const BookingStatusEnum = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

const PaymentStatusEnum = {
  PENDING: 'PENDING',
  DEPOSIT_PAID: 'DEPOSIT_PAID',
  FULLY_PAID: 'FULLY_PAID'
} as const;

const PaymentMethodEnum = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD: 'CARD'
} as const;

const PaymentTypeEnum = {
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT'
} as const;

// Esquemas de validación básicos
const emailSchema = z.string().email('Email inválido');
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Teléfono inválido');
const urlSchema = z.string().url('URL inválida').optional();
const positiveNumberSchema = z.number().positive('Debe ser un número positivo');
const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');
const nonNegativeNumberSchema = z.number().min(0, 'No puede ser negativo');

// Esquema para User
export const userCreateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es demasiado largo'),
  email: emailSchema,
  password: passwordSchema.optional(),
  phone: phoneSchema.optional(),
  image: urlSchema,
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  emailVerified: z.date().optional(),
  isActive: z.boolean().default(true)
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export const userPasswordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

// Esquema para Court
export const courtCreateSchema = z.object({
  name: z.string().min(1, 'El nombre de la cancha es requerido').max(100, 'El nombre es demasiado largo'),
  description: z.string().max(500, 'La descripción es demasiado larga').optional(),
  pricePerHour: positiveNumberSchema,
  isActive: z.boolean().default(true),
  features: z.array(z.string()).default([]),
  maxPlayers: z.number().int().min(2, 'Mínimo 2 jugadores').max(8, 'Máximo 8 jugadores').default(4),
  location: z.string().max(200, 'La ubicación es demasiado larga').optional()
});

export const courtUpdateSchema = courtCreateSchema.partial();

// Esquema para Booking
const bookingBaseSchema = z.object({
  courtId: z.string().uuid('ID de cancha inválido'),
  userId: z.string().uuid('ID de usuario inválido'),
  startTime: z.date(),
  endTime: z.date(),
  totalPrice: positiveNumberSchema,
  status: z.enum(['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  notes: z.string().max(500, 'Las notas son demasiado largas').optional(),
  playerCount: z.number().int().min(1, 'Mínimo 1 jugador').max(8, 'Máximo 8 jugadores').default(2)
});

export const bookingCreateSchema = bookingBaseSchema.refine((data) => data.endTime > data.startTime, {
  message: "La hora de fin debe ser posterior a la hora de inicio",
  path: ["endTime"]
}).refine((data) => {
  const duration = data.endTime.getTime() - data.startTime.getTime();
  const hours = duration / (1000 * 60 * 60);
  return hours >= 0.5 && hours <= 8;
}, {
  message: "La duración debe ser entre 30 minutos y 8 horas",
  path: ["endTime"]
});

export const bookingUpdateSchema = bookingBaseSchema.partial().omit({ courtId: true, userId: true });

// Esquema para BookingPlayer
export const bookingPlayerCreateSchema = z.object({
  bookingId: z.string().uuid('ID de reserva inválido'),
  name: z.string().min(1, 'El nombre del jugador es requerido').max(100, 'El nombre es demasiado largo'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  isConfirmed: z.boolean().default(false),
  notes: z.string().max(200, 'Las notas son demasiado largas').optional()
});

export const bookingPlayerUpdateSchema = bookingPlayerCreateSchema.partial().omit({ bookingId: true });

// Esquema para Payment
export const paymentCreateSchema = z.object({
  bookingId: z.string().uuid('ID de reserva inválido'),
  amount: positiveNumberSchema,
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD']),
  type: z.enum(['PAYMENT', 'REFUND', 'ADJUSTMENT']).default('PAYMENT'),
  status: z.enum(['PENDING', 'DEPOSIT_PAID', 'FULLY_PAID']).default('PENDING'),
  transactionId: z.string().max(100, 'ID de transacción demasiado largo').optional(),
  notes: z.string().max(300, 'Las notas son demasiado largas').optional(),
  dueDate: z.date().optional(),
  paidAt: z.date().optional()
});

export const paymentUpdateSchema = paymentCreateSchema.partial().omit({ bookingId: true });

// Esquema para SystemSetting
export const systemSettingCreateSchema = z.object({
  key: z.string().min(1, 'La clave es requerida').max(100, 'La clave es demasiado larga'),
  value: z.string().min(1, 'El valor es requerido').max(1000, 'El valor es demasiado largo'),
  description: z.string().max(300, 'La descripción es demasiado larga').optional(),
  category: z.string().max(50, 'La categoría es demasiado larga').optional(),
  isPublic: z.boolean().default(false)
});

export const systemSettingUpdateSchema = systemSettingCreateSchema.partial().omit({ key: true });

// Esquema para Producto
export const productoCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre del producto es requerido').max(200, 'El nombre es demasiado largo'),
  descripcion: z.string().max(1000, 'La descripción es demasiado larga').optional(),
  precio: positiveNumberSchema,
  stock: nonNegativeNumberSchema.int('El stock debe ser un número entero'),
  categoria: z.string().max(100, 'La categoría es demasiado larga').optional(),
  imagen: urlSchema,
  activo: z.boolean().default(true),
  sku: z.string().max(50, 'El SKU es demasiado largo').optional(),
  peso: z.number().positive('El peso debe ser positivo').optional(),
  dimensiones: z.string().max(100, 'Las dimensiones son demasiado largas').optional()
});

export const productoUpdateSchema = productoCreateSchema.partial();

// Esquema para AdminWhitelist
export const adminWhitelistCreateSchema = z.object({
  email: emailSchema,
  role: z.enum(['USER', 'ADMIN']).default('ADMIN'),
  isActive: z.boolean().default(true),
  notes: z.string().max(300, 'Las notas son demasiado largas').optional(),
  createdBy: z.string().uuid('ID de creador inválido').optional()
});

export const adminWhitelistUpdateSchema = adminWhitelistCreateSchema.partial().omit({ email: true });

// Esquemas para operaciones CRUD
export const idParamSchema = z.object({
  id: z.string().uuid('ID inválido')
});

export const paginationSchema = z.object({
  page: z.number().int().min(1, 'La página debe ser mayor a 0').default(1),
  limit: z.number().int().min(1, 'El límite debe ser mayor a 0').max(100, 'El límite máximo es 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const searchSchema = z.object({
  query: z.string().min(1, 'La consulta de búsqueda es requerida'),
  fields: z.array(z.string()).optional(),
  ...paginationSchema.shape
});

// Esquema para filtros de fecha
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine((data) => data.endDate >= data.startDate, {
  message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
  path: ["endDate"]
});

// Esquema para operaciones en lote
export const bulkOperationSchema = z.object({
  ids: z.array(z.string().uuid('ID inválido')).min(1, 'Debe proporcionar al menos un ID'),
  action: z.enum(['delete', 'restore', 'activate', 'deactivate']),
  force: z.boolean().default(false) // Para eliminación permanente
});

// Esquema para transacciones
export const transactionSchema = z.object({
  operations: z.array(z.object({
    model: z.string().min(1, 'El modelo es requerido'),
    action: z.enum(['create', 'update', 'delete']),
    data: z.record(z.string(), z.any()),
    where: z.record(z.string(), z.any()).optional()
  })).min(1, 'Debe proporcionar al menos una operación')
});

// Esquema para configuración de backup
export const backupConfigSchema = z.object({
  includeModels: z.array(z.string()).optional(),
  excludeModels: z.array(z.string()).optional(),
  includeDeleted: z.boolean().default(false),
  format: z.enum(['json', 'csv', 'sql']).default('json')
});

// Esquema para importación de datos
export const importDataSchema = z.object({
  model: z.string().min(1, 'El modelo es requerido'),
  data: z.array(z.record(z.string(), z.any())).min(1, 'Debe proporcionar al menos un registro'),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateData: z.boolean().default(true)
  }).optional()
});

// Función helper para validar esquemas
export function validateSchema(schema: any, data: unknown): any {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Error de validación en ${firstError.path.join('.')}: ${firstError.message}`);
    }
    throw error;
  }
}

// Función helper para validación parcial (útil para updates)
export function validatePartialSchema<T>(schema: z.ZodObject<any>, data: unknown): any {
  try {
    return schema.partial().parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Error de validación en ${firstError.path.join('.')}: ${firstError.message}`);
    }
    throw error;
  }
}

// Mapeo de esquemas por modelo
export const modelSchemas = {
  User: {
    create: userCreateSchema,
    update: userUpdateSchema
  },
  Court: {
    create: courtCreateSchema,
    update: courtUpdateSchema
  },
  Booking: {
    create: bookingCreateSchema,
    update: bookingUpdateSchema
  },
  BookingPlayer: {
    create: bookingPlayerCreateSchema,
    update: bookingPlayerUpdateSchema
  },
  Payment: {
    create: paymentCreateSchema,
    update: paymentUpdateSchema
  },
  SystemSetting: {
    create: systemSettingCreateSchema,
    update: systemSettingUpdateSchema
  },
  Producto: {
    create: productoCreateSchema,
    update: productoUpdateSchema
  },
  AdminWhitelist: {
    create: adminWhitelistCreateSchema,
    update: adminWhitelistUpdateSchema
  }
};

// Función para obtener esquema por modelo y operación
export function getModelSchema(model: string, operation: 'create' | 'update'): any {
  const schemas = modelSchemas[model as keyof typeof modelSchemas];
  if (!schemas) {
    throw new Error(`No se encontró esquema para el modelo: ${model}`);
  }
  return schemas[operation];
}

// Validación de permisos por modelo
export const modelPermissions = {
  User: { read: 'USER', create: 'ADMIN', update: 'ADMIN', delete: 'ADMIN' },
  Court: { read: 'USER', create: 'ADMIN', update: 'ADMIN', delete: 'ADMIN' },
  Booking: { read: 'USER', create: 'USER', update: 'USER', delete: 'ADMIN' },
  BookingPlayer: { read: 'USER', create: 'USER', update: 'USER', delete: 'ADMIN' },
  Payment: { read: 'USER', create: 'ADMIN', update: 'ADMIN', delete: 'ADMIN' },
  SystemSetting: { read: 'ADMIN', create: 'SUPER_ADMIN', update: 'SUPER_ADMIN', delete: 'SUPER_ADMIN' },
  Producto: { read: 'USER', create: 'ADMIN', update: 'ADMIN', delete: 'ADMIN' },
  AdminWhitelist: { read: 'SUPER_ADMIN', create: 'SUPER_ADMIN', update: 'SUPER_ADMIN', delete: 'SUPER_ADMIN' }
};

// Función para validar permisos de modelo
export function validateModelPermission(model: string, operation: string, userRole: string) {
  const permissions = modelPermissions[model as keyof typeof modelPermissions];
  if (!permissions) {
    throw new Error(`No se encontraron permisos para el modelo: ${model}`);
  }
  
  const requiredRole = permissions[operation as keyof typeof permissions];
  if (!requiredRole) {
    throw new Error(`Operación no válida: ${operation}`);
  }
  
  const roleHierarchy = {
    'SUPER_ADMIN': 4,
    'ADMIN': 3,
    'MANAGER': 2,
    'USER': 1,
    'GUEST': 0
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
}
