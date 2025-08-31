import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock NextAuth
jest.mock('next-auth', () => {
  const mockNextAuth = jest.fn(() => ({
    handlers: { GET: jest.fn(), POST: jest.fn() },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn()
  }));
  return {
    __esModule: true,
    default: mockNextAuth
  };
});

// Mock Google provider
jest.mock('next-auth/providers/google', () => {
  const mockGoogle = jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth'
  }));
  return {
    __esModule: true,
    default: mockGoogle
  };
});

// Mock de Prisma para tests
const mockPrisma = {
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  court: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  booking: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  producto: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock global de Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      constructor(message: string, code: string, clientVersion: string) {
        super(message);
        this.name = 'PrismaClientKnownRequestError';
        this.code = code;
        this.clientVersion = clientVersion;
      }
    },
    PrismaClientUnknownRequestError: class extends Error {
      constructor(message: string, clientVersion: string) {
        super(message);
        this.name = 'PrismaClientUnknownRequestError';
        this.clientVersion = clientVersion;
      }
    },
    PrismaClientValidationError: class extends Error {
       constructor(message: string, clientVersion: string) {
         super(message);
         this.name = 'PrismaClientValidationError';
         this.clientVersion = clientVersion;
       }
     },
     PrismaClientRustPanicError: class extends Error {
        constructor(message: string, clientVersion: string) {
          super(message);
          this.name = 'PrismaClientRustPanicError';
          this.clientVersion = clientVersion;
        }
      },
      PrismaClientInitializationError: class extends Error {
        constructor(message: string, clientVersion: string) {
          super(message);
          this.name = 'PrismaClientInitializationError';
          this.clientVersion = clientVersion;
        }
      }
    }
  }));

// Mock global de Prisma para importaciones directas
global.Prisma = {
  PrismaClientKnownRequestError: class extends Error {
    constructor(message: string, code: string, clientVersion: string) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = code;
      this.clientVersion = clientVersion;
    }
  },
  PrismaClientUnknownRequestError: class extends Error {
    constructor(message: string, clientVersion: string) {
      super(message);
      this.name = 'PrismaClientUnknownRequestError';
      this.clientVersion = clientVersion;
    }
  },
  PrismaClientValidationError: class extends Error {
     constructor(message: string, clientVersion: string) {
       super(message);
       this.name = 'PrismaClientValidationError';
       this.clientVersion = clientVersion;
     }
   },
   PrismaClientRustPanicError: class extends Error {
      constructor(message: string, clientVersion: string) {
        super(message);
        this.name = 'PrismaClientRustPanicError';
        this.clientVersion = clientVersion;
      }
    },
    PrismaClientInitializationError: class extends Error {
      constructor(message: string, clientVersion: string) {
        super(message);
        this.name = 'PrismaClientInitializationError';
        this.clientVersion = clientVersion;
      }
    }
  };

// Datos de prueba comunes
export const testData = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  court: {
    id: 'test-court-id',
    name: 'Cancha Test',
    description: 'Cancha de prueba',
    pricePerHour: 50.0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  booking: {
    id: 'test-booking-id',
    userId: 'test-user-id',
    courtId: 'test-court-id',
    startTime: new Date(),
    endTime: new Date(),
    status: 'CONFIRMED',
    totalAmount: 50.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
  producto: {
    id: 'test-product-id',
    nombre: 'Producto Test',
    precio: 25.0,
    stock: 10,
    categoria: 'EQUIPAMIENTO',
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
};

// Configuración global de tests
beforeAll(async () => {
  // Configuración inicial si es necesaria
});

afterAll(async () => {
  // Limpieza final si es necesaria
});

beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  jest.clearAllMocks();
});

export { mockPrisma };
export default mockPrisma;