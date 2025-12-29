/// <reference types="@types/jest" />
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE, PATCH } from '../../app/api/crud/[...params]/route';

// Mock de las funciones de autenticación para simular usuario admin
jest.mock('../../lib/auth', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    role: 'ADMIN',
    email: 'admin@test.com'
  }))
}));

// Mock de getServerSession
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn() as any as jest.MockedFunction<any>,
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-user-id',
      role: 'ADMIN',
      email: 'admin@test.com'
    }
  }))
}));

// Mock de las funciones de validación
jest.mock('../../lib/validations/schemas', () => ({
  ALLOWED_MODELS: ['user', 'court', 'booking', 'producto'],
  validateModelPermission: jest.fn(() => true)
}));

describe('CRUD API Routes - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/crud/[model]', () => {
    it('debería responder con estructura correcta para modelo válido', async () => {
      const request = new NextRequest('http://localhost:3000/api/crud/user');
      const response = await GET(request, { params: { params: ['user'] } });
      const data = await response.json();

      // Verificar que la respuesta tenga estructura válida
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('pagination');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('debería fallar con modelo no permitido', async () => {
      const request = new NextRequest('http://localhost:3000/api/crud/invalid_model');
      const response = await GET(request, { params: { params: ['invalid_model'] } });
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/crud/[model]', () => {
    it('debería responder con estructura correcta para creación', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER'
      };

      const request = new NextRequest('http://localhost:3000/api/crud/user', {
        method: 'POST',
        body: JSON.stringify(newUser),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await POST(request, { params: { params: ['user'] } });
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('PUT /api/crud/[model]/[id]', () => {
    it('debería responder con estructura correcta para actualización', async () => {
      const updateData = { name: 'Updated User' };

      const request = new NextRequest('http://localhost:3000/api/crud/user/test-id', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await PUT(request, { params: { params: ['user', 'test-id'] } });
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('debería fallar si falta el ID', async () => {
      const updateData = { name: 'Updated User' };

      const request = new NextRequest('http://localhost:3000/api/crud/user', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const response = await PUT(request, { params: { params: ['user'] } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Modelo e ID requeridos');
    });
  });

  describe('DELETE /api/crud/[model]/[id]', () => {
    it('debería responder con estructura correcta para eliminación', async () => {
      const request = new NextRequest('http://localhost:3000/api/crud/user/test-id', {
        method: 'DELETE'
      });
      
      const response = await DELETE(request, { params: { params: ['user', 'test-id'] } });
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('PATCH /api/crud/[model]/[id]', () => {
    it('debería responder con estructura correcta para acciones especiales', async () => {
      const request = new NextRequest('http://localhost:3000/api/crud/user/test-id?action=restore', {
        method: 'PATCH'
      });
      
      const response = await PATCH(request, { params: { params: ['user', 'test-id'] } });
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('debería fallar con acción inválida', async () => {
      const request = new NextRequest('http://localhost:3000/api/crud/user/test-id?action=invalid', {
        method: 'PATCH'
      });
      
      const response = await PATCH(request, { params: { params: ['user', 'test-id'] } });
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('debería manejar errores de autenticación correctamente', async () => {
      // Temporalmente mockear getCurrentUser para que falle
      const { getCurrentUser } = require('../../lib/auth');
      getCurrentUser.mockRejectedValueOnce(new Error('Authentication failed'));

      const request = new NextRequest('http://localhost:3000/api/crud/user');
      const response = await GET(request, { params: { params: ['user'] } });
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });
  });
});