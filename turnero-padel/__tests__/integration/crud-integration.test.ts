/// <reference types="@types/jest" />
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { CrudService } from '../../lib/services/crud-service';
import { getTestData, cleanTestData } from '../../lib/services/test-data';
import { mockPrisma, testData } from '../setup';

// Mock completo del sistema
jest.mock('../../lib/utils/error-handler', () => ({
  ValidationError: class extends Error {
    constructor(message: string, field: string, code: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  NotFoundError: class extends Error {
    constructor(model: string, id: string) {
      super(`${model} with id ${id} not found`);
      this.name = 'NotFoundError';
    }
  },
  createSuccessResponse: (data: any, message?: string) => ({ success: true, data, message }),
  handleError: (error: any) => ({ success: false, error: (error as Error).message }),
  logError: jest.fn() as any as jest.MockedFunction<any>,
  sanitizeInput: (data: any) => data,
}));

jest.mock('../../lib/validations/schemas', () => ({
  validateModelPermission: jest.fn(() => true),
  getUserSchema: () => ({ parse: (data: any) => data }),
  getCourtSchema: () => ({ parse: (data: any) => data }),
  getBookingSchema: () => ({ parse: (data: any) => data }),
  getProductoSchema: () => ({ parse: (data: any) => data }),
}));

describe('CRUD Integration Tests', () => {
  let userService: CrudService<any>;
  let courtService: CrudService<any>;
  let bookingService: CrudService<any>;
  let productoService: CrudService<any>;

  const adminOptions = { userRole: 'ADMIN' as const, userId: 'admin-id' };
  const userOptions = { userRole: 'USER' as const, userId: 'user-id' };

  beforeAll(async () => {
    userService = new CrudService(mockPrisma as any, 'user');
    courtService = new CrudService(mockPrisma as any, 'court');
    bookingService = new CrudService(mockPrisma as any, 'booking');
    productoService = new CrudService(mockPrisma as any, 'producto');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Flujo completo de Usuario', () => {
    it('debería crear, leer, actualizar y eliminar un usuario', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        role: 'USER'
      };

      // 1. Crear usuario
      mockPrisma.user.create.mockResolvedValue({ id: 'user-1', ...userData });
      const createResult = await userService.create(userData, adminOptions);
      expect(createResult.success).toBe(true);
      expect(createResult.data.email).toBe(userData.email);

      // 2. Leer usuario por ID
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', ...userData });
      const readResult = await userService.readById('user-1', adminOptions);
      expect(readResult.success).toBe(true);
      expect(readResult.data.id).toBe('user-1');

      // 3. Actualizar usuario
      const updateData = { name: 'Updated User' };
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', ...userData, ...updateData });
      const updateResult = await userService.update('user-1', updateData, adminOptions);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.name).toBe('Updated User');

      // 4. Eliminar usuario (soft delete)
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', ...userData, deletedAt: new Date() });
      const deleteResult = await userService.delete('user-1', adminOptions);
      expect(deleteResult.success).toBe(true);

      // 5. Restaurar usuario
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-1', ...userData, deletedAt: new Date() });
      mockPrisma.user.update.mockResolvedValue({ id: 'user-1', ...userData, deletedAt: null });
      const restoreResult = await userService.restore('user-1', adminOptions);
      expect(restoreResult.success).toBe(true);
    });
  });

  describe('Flujo completo de Cancha', () => {
    it('debería gestionar canchas con dependencias', async () => {
      const courtData = {
        name: 'Cancha 1',
        description: 'Cancha de padel profesional',
        pricePerHour: 50.0,
        isActive: true
      };

      // 1. Crear cancha
      mockPrisma.court.create.mockResolvedValue({ id: 'court-1', ...courtData });
      const createResult = await courtService.create(courtData, adminOptions);
      expect(createResult.success).toBe(true);

      // 2. Verificar que no se puede eliminar si tiene reservas
      mockPrisma.court.findFirst.mockResolvedValue({ id: 'court-1', ...courtData });
      mockPrisma.booking.count.mockResolvedValue(2); // Tiene reservas
      const deleteResult = await courtService.delete('court-1', adminOptions);
      expect(deleteResult.success).toBe(false);

      // 3. Eliminar después de limpiar dependencias
      mockPrisma.booking.count.mockResolvedValue(0); // Sin reservas
      mockPrisma.court.update.mockResolvedValue({ id: 'court-1', ...courtData, deletedAt: new Date() });
      const deleteResult2 = await courtService.delete('court-1', adminOptions);
      expect(deleteResult2.success).toBe(true);
    });
  });

  describe('Flujo completo de Reserva', () => {
    it('debería crear reserva con validaciones de negocio', async () => {
      const bookingData = {
        courtId: 'court-1',
        userId: 'user-1',
        startTime: new Date('2024-12-01T10:00:00Z'),
        endTime: new Date('2024-12-01T11:00:00Z'),
        totalPrice: 50.0,
        status: 'CONFIRMED'
      };

      // 1. Crear reserva
      mockPrisma.booking.create.mockResolvedValue({ id: 'booking-1', ...bookingData });
      const createResult = await bookingService.create(bookingData, adminOptions);
      expect(createResult.success).toBe(true);

      // 2. Buscar reservas por fecha
      mockPrisma.booking.findMany.mockResolvedValue([{ id: 'booking-1', ...bookingData }]);
      const searchResult = await bookingService.read({
        filters: {
          startTime: {
            gte: new Date('2024-12-01T00:00:00Z'),
            lt: new Date('2024-12-02T00:00:00Z')
          }
        },
        ...adminOptions
      });
      expect(searchResult.success).toBe(true);
      expect(searchResult.data.items).toHaveLength(1);
    });
  });

  describe('Operaciones en lote y transacciones', () => {
    it('debería ejecutar múltiples operaciones en transacción', async () => {
      const operations = [
        {
          model: 'user' as const,
          operation: 'create' as const,
          data: { name: 'User 1', email: 'user1@test.com' }
        },
        {
          model: 'user' as const,
          operation: 'create' as const,
          data: { name: 'User 2', email: 'user2@test.com' }
        },
        {
          model: 'court' as const,
          operation: 'create' as const,
          data: { name: 'Court 1', pricePerHour: 40.0 }
        }
      ];

      const mockResults = [
        { id: 'user-1', name: 'User 1', email: 'user1@test.com' },
        { id: 'user-2', name: 'User 2', email: 'user2@test.com' },
        { id: 'court-1', name: 'Court 1', pricePerHour: 40.0 }
      ];

      mockPrisma.$transaction.mockResolvedValue(mockResults);

      const result = await userService.transaction(operations, adminOptions);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('debería fallar la transacción si una operación falla', async () => {
      const operations = [
        {
          model: 'user' as const,
          operation: 'create' as const,
          data: { name: 'User 1', email: 'user1@test.com' }
        },
        {
          model: 'user' as const,
          operation: 'create' as const,
          data: { email: 'invalid-email' } // Datos inválidos
        }
      ];

      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      const result = await userService.transaction(operations, adminOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('Búsqueda y filtrado avanzado', () => {
    it('debería buscar usuarios por múltiples campos', async () => {
      const searchTerm = 'test';
      const searchFields = ['name', 'email'];
      const mockUsers = [
        { id: 'user-1', name: 'Test User', email: 'user@test.com' },
        { id: 'user-2', name: 'Another Test', email: 'test@example.com' }
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await userService.search(searchTerm, searchFields, adminOptions);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('debería filtrar por rango de fechas', async () => {
      const dateFilter = {
        createdAt: {
          gte: new Date('2024-01-01'),
          lt: new Date('2024-12-31')
        }
      };

      mockPrisma.user.findMany.mockResolvedValue([testData.user]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await userService.read({
        filters: dateFilter,
        ...adminOptions
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          ...dateFilter
        },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('Estadísticas y métricas', () => {
    it('debería calcular estadísticas completas de tabla', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(85)  // active
        .mockResolvedValueOnce(10)  // recent
        .mockResolvedValueOnce(80); // lastMonth

      const result = await userService.getTableStats(adminOptions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        model: 'user',
        total: 100,
        active: 85,
        deleted: 15,
        recent: 10,
        lastMonth: 80,
        deletionRate: '15.00',
        growthRate: '6.25'
      });
    });
  });

  describe('Manejo de permisos', () => {
    it('debería permitir operaciones según el rol del usuario', async () => {
      // Usuario normal puede leer
      mockPrisma.user.findMany.mockResolvedValue([testData.user]);
      mockPrisma.user.count.mockResolvedValue(1);
      const readResult = await userService.read(userOptions);
      expect(readResult.success).toBe(true);

      // Usuario normal no puede eliminar permanentemente
      const hardDeleteResult = await userService.hardDelete('user-1', userOptions);
      expect(hardDeleteResult.success).toBe(false);

      // Admin puede eliminar permanentemente
      mockPrisma.user.findUnique.mockResolvedValue(testData.user);
      mockPrisma.user.delete.mockResolvedValue(testData.user);
      const adminDeleteResult = await userService.hardDelete('user-1', adminOptions);
      expect(adminDeleteResult.success).toBe(true);
    });
  });

  describe('Datos de prueba', () => {
    it('debería sembrar datos de prueba correctamente', async () => {
      const testDataSample = getTestData();
      
      // Mock para cada modelo
      mockPrisma.user.createMany.mockResolvedValue({ count: testDataSample.users.length });
      mockPrisma.court.createMany.mockResolvedValue({ count: testDataSample.courts.length });
      mockPrisma.booking.createMany.mockResolvedValue({ count: testDataSample.bookings.length });
      mockPrisma.producto.createMany.mockResolvedValue({ count: testDataSample.productos.length });

      const result = await userService.seedTestData(adminOptions);
      expect(result.success).toBe(true);
      expect(result.message).toContain('sembrados exitosamente');
    });

    it('debería limpiar datos de prueba', async () => {
      mockPrisma.user.deleteMany.mockResolvedValue({ count: 5 });
      mockPrisma.court.deleteMany.mockResolvedValue({ count: 3 });
      mockPrisma.booking.deleteMany.mockResolvedValue({ count: 10 });
      mockPrisma.producto.deleteMany.mockResolvedValue({ count: 8 });

      const cleanData = cleanTestData();
      expect(cleanData).toBeDefined();
      expect(typeof cleanData.users).toBe('object');
      expect(typeof cleanData.courts).toBe('object');
    });
  });

  describe('Casos edge y manejo de errores', () => {
    it('debería manejar registros no encontrados', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await userService.readById('non-existent-id', adminOptions);
      expect(result.success).toBe(false);
    });

    it('debería manejar errores de base de datos', async () => {
      mockPrisma.user.create.mockRejectedValue(new Error('Database connection failed'));

      const result = await userService.create({ name: 'Test' }, adminOptions);
      expect(result.success).toBe(false);
    });

    it('debería validar límites de paginación', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await userService.read({
        page: 999,
        limit: 1000, // Límite muy alto
        ...adminOptions
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        take: 100, // Debería limitarse a 100
        skip: 99800, // (999-1) * 100
        orderBy: { createdAt: 'desc' }
      });
    });

    it('debería manejar búsquedas con términos vacíos', async () => {
      const result = await userService.search('', ['name'], adminOptions);
      expect(result.success).toBe(false);
    });

    it('debería manejar operaciones concurrentes', async () => {
      const promises = [
        userService.create({ name: 'User 1', email: 'user1@test.com' }, adminOptions),
        userService.create({ name: 'User 2', email: 'user2@test.com' }, adminOptions),
        userService.create({ name: 'User 3', email: 'user3@test.com' }, adminOptions)
      ];

      mockPrisma.user.create
        .mockResolvedValueOnce({ id: 'user-1', name: 'User 1', email: 'user1@test.com' })
        .mockResolvedValueOnce({ id: 'user-2', name: 'User 2', email: 'user2@test.com' })
        .mockResolvedValueOnce({ id: 'user-3', name: 'User 3', email: 'user3@test.com' });

      const results = await Promise.all(promises);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});