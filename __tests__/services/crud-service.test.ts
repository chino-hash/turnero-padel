/// <reference types="@types/jest" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CrudService } from '../../lib/services/crud-service';
import { ValidationError, NotFoundError } from '../../lib/utils/error-handler';
import { mockPrisma, testData } from '../setup';

// Mock de las funciones de validación
jest.mock('../../lib/validations/schemas', () => ({
  validateModelPermission: jest.fn(() => true),
  getUserSchema: jest.fn(() => ({ parse: jest.fn(data => data) })),
  getCourtSchema: jest.fn(() => ({ parse: jest.fn(data => data) })),
  getBookingSchema: jest.fn(() => ({ parse: jest.fn(data => data) })),
  getProductoSchema: jest.fn(() => ({ parse: jest.fn(data => data) })),
}));

// Mock de las funciones de error handling
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
  createSuccessResponse: jest.fn((data, message) => ({ success: true, data, message })),
  handleError: jest.fn(error => ({ success: false, error: (error as Error).message })),
  logError: jest.fn() as any as jest.MockedFunction<any>,
  sanitizeInput: jest.fn(data => data),
}));

describe('CrudService', () => {
  let crudService: CrudService<any>;

  beforeEach(() => {
    crudService = new CrudService(mockPrisma as any, 'user');
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un nuevo registro exitosamente', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      mockPrisma.user.create.mockResolvedValue({ ...testData.user, ...newUser });

      const result = await crudService.create(newUser, { userRole: 'ADMIN' });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...newUser,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      });
      expect(result.success).toBe(true);
    });

    it('debería fallar al crear con datos inválidos', async () => {
      const invalidData = { email: 'invalid-email' };
      
      // Mock para que la validación falle
      const { getUserSchema } = require('../../lib/validations/schemas');
      getUserSchema.mockReturnValue({
        parse: jest.fn(() => {
          throw new Error('Invalid email format');
        })
      });

      const result = await crudService.create(invalidData, { userRole: 'ADMIN' });

      expect(result.success).toBe(false);
    });

    it('debería fallar sin permisos adecuados', async () => {
      const { validateModelPermission } = require('../../lib/validations/schemas');
      validateModelPermission.mockReturnValue(false);

      const result = await crudService.create({ name: 'Test' }, { userRole: 'GUEST' });

      expect(result.success).toBe(false);
    });
  });

  describe('read', () => {
    it('debería leer registros con paginación', async () => {
      const mockUsers = [testData.user];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await crudService.read({
        page: 1,
        limit: 10,
        userRole: 'ADMIN'
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        items: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      });
    });

    it('debería aplicar filtros correctamente', async () => {
      const filters = { name: 'Test User' };
      mockPrisma.user.findMany.mockResolvedValue([testData.user]);
      mockPrisma.user.count.mockResolvedValue(1);

      await crudService.read({
        filters,
        userRole: 'ADMIN'
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          ...filters
        },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('readById', () => {
    it('debería leer un registro por ID', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testData.user);

      const result = await crudService.readById('test-user-id', { userRole: 'ADMIN' });

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'test-user-id',
          deletedAt: null
        }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData.user);
    });

    it('debería fallar si el registro no existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await crudService.readById('non-existent-id', { userRole: 'ADMIN' });

      expect(result.success).toBe(false);
    });
  });

  describe('update', () => {
    it('debería actualizar un registro exitosamente', async () => {
      const updateData = { name: 'Updated User' };
      mockPrisma.user.findFirst.mockResolvedValue(testData.user);
      mockPrisma.user.update.mockResolvedValue({ ...testData.user, ...updateData });

      const result = await crudService.update('test-user-id', updateData, { userRole: 'ADMIN' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date)
        })
      });
      expect(result.success).toBe(true);
    });

    it('debería fallar si el registro no existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await crudService.update('non-existent-id', { name: 'Test' }, { userRole: 'ADMIN' });

      expect(result.success).toBe(false);
    });
  });

  describe('delete', () => {
    it('debería eliminar un registro (soft delete)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(testData.user);
      mockPrisma.user.update.mockResolvedValue({ ...testData.user, deletedAt: new Date() });

      const result = await crudService.delete('test-user-id', { userRole: 'ADMIN' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedAt: expect.any(Date)
        })
      });
      expect(result.success).toBe(true);
    });

    it('debería fallar si el registro no existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await crudService.delete('non-existent-id', { userRole: 'ADMIN' });

      expect(result.success).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('debería eliminar permanentemente con permisos de ADMIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(testData.user);
      mockPrisma.user.delete.mockResolvedValue(testData.user);

      const result = await crudService.hardDelete('test-user-id', { userRole: 'ADMIN' });

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'test-user-id' }
      });
      expect(result.success).toBe(true);
    });

    it('debería fallar sin permisos de ADMIN', async () => {
      const result = await crudService.hardDelete('test-user-id', { userRole: 'USER' });

      expect(result.success).toBe(false);
    });
  });

  describe('restore', () => {
    it('debería restaurar un registro eliminado', async () => {
      const deletedUser = { ...testData.user, deletedAt: new Date() };
      mockPrisma.user.findFirst.mockResolvedValue(deletedUser);
      mockPrisma.user.update.mockResolvedValue({ ...deletedUser, deletedAt: null });

      const result = await crudService.restore('test-user-id', { userRole: 'ADMIN' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: expect.objectContaining({
          deletedAt: null,
          updatedAt: expect.any(Date)
        })
      });
      expect(result.success).toBe(true);
    });
  });

  describe('count', () => {
    it('debería contar registros correctamente', async () => {
      mockPrisma.user.count.mockResolvedValue(5);

      const result = await crudService.count({}, { userRole: 'ADMIN' });

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { deletedAt: null }
      });
      expect(result.success).toBe(true);
      expect(result.data).toBe(5);
    });
  });

  describe('search', () => {
    it('debería buscar registros por término', async () => {
      const searchResults = [testData.user];
      mockPrisma.user.findMany.mockResolvedValue(searchResults);

      const result = await crudService.search('Test', ['name', 'email'], { userRole: 'ADMIN' });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: 'Test', mode: 'insensitive' } },
            { email: { contains: 'Test', mode: 'insensitive' } }
          ]
        },
        take: 50,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      });
      expect(result.success).toBe(true);
    });

    it('debería fallar con término de búsqueda vacío', async () => {
      const result = await crudService.search('', ['name'], { userRole: 'ADMIN' });

      expect(result.success).toBe(false);
    });
  });

  describe('transaction', () => {
    it('debería ejecutar transacciones exitosamente', async () => {
      const operations = [
        { model: 'user', operation: 'create' as const, data: { name: 'User 1' } },
        { model: 'user', operation: 'update' as const, data: { name: 'Updated' }, where: { id: 'test-id' } }
      ];
      
      mockPrisma.$transaction.mockResolvedValue([testData.user, testData.user]);

      const result = await crudService.transaction(operations, { userRole: 'ADMIN' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('debería fallar sin permisos de MANAGER', async () => {
      const operations = [{ model: 'user', operation: 'create' as const, data: { name: 'Test' } }];
      
      const result = await crudService.transaction(operations, { userRole: 'USER' });

      expect(result.success).toBe(false);
    });
  });

  describe('getTableStats', () => {
    it('debería obtener estadísticas de tabla', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(2)  // recent
        .mockResolvedValueOnce(5); // lastMonth

      const result = await crudService.getTableStats({ userRole: 'ADMIN' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        model: 'user',
        total: 10,
        active: 8,
        deleted: 2,
        recent: 2,
        lastMonth: 5,
        deletionRate: '20.00',
        growthRate: '-60.00'
      });
    });
  });
});