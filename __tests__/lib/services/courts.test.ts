/// <reference types="@types/jest" />
import {
  getCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deactivateCourt,
  checkCourtAvailability,
} from '../../../lib/services/courts'
import { prisma } from '../../../lib/prisma'
import type { Court } from '@prisma/client'

// Mock Prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    court: {
      findMany: jest.fn() as any as jest.MockedFunction<any>,
      findUnique: jest.fn() as any as jest.MockedFunction<any>,
      create: jest.fn() as any as jest.MockedFunction<any>,
      update: jest.fn() as any as jest.MockedFunction<any>,
    },
    booking: {
      findMany: jest.fn() as any as jest.MockedFunction<any>,
      findFirst: jest.fn() as any as jest.MockedFunction<any>,
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Courts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Silenciar console.error para las pruebas
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockCourt: Court = {
    id: 'court-123',
    name: 'Cancha 1',
    description: 'Cancha de pádel techada',
    basePrice: 1000,
    priceMultiplier: 1.2,
    features: ['techada', 'iluminacion'],
    operatingHours: {
      start: '08:00',
      end: '22:00',
      slot_duration: 90,
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  describe('getCourts', () => {
    it('should return all active courts', async () => {
      const mockCourts = [mockCourt, { ...mockCourt, id: 'court-456', name: 'Cancha 2' }]
      mockPrisma.court.findMany.mockResolvedValue(mockCourts)

      const result = await getCourts()

      expect(mockPrisma.court.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
      expect(result).toEqual(mockCourts)
    })

    it('should return empty array when no courts exist', async () => {
      mockPrisma.court.findMany.mockResolvedValue([])

      const result = await getCourts()

      expect(result).toEqual([])
    })

    it('should throw error when database fails', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.court.findMany.mockRejectedValue(dbError)

      await expect(getCourts()).rejects.toThrow('Error al obtener las canchas')
      expect(console.error).toHaveBeenCalledWith('Error obteniendo canchas:', dbError)
    })
  })

  describe('getCourtById', () => {
    it('should return court when found', async () => {
      mockPrisma.court.findUnique.mockResolvedValue(mockCourt)

      const result = await getCourtById('court-123')

      expect(mockPrisma.court.findUnique).toHaveBeenCalledWith({
        where: { id: 'court-123' },
      })
      expect(result).toEqual(mockCourt)
    })

    it('should return null when court not found', async () => {
      mockPrisma.court.findUnique.mockResolvedValue(null)

      const result = await getCourtById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error when database fails', async () => {
      const dbError = new Error('Database error')
      mockPrisma.court.findUnique.mockRejectedValue(dbError)

      await expect(getCourtById('court-123')).rejects.toThrow('Error al obtener la cancha')
      expect(console.error).toHaveBeenCalledWith('Error obteniendo cancha:', dbError)
    })
  })

  describe('createCourt', () => {
    const createData = {
      name: 'Nueva Cancha',
      description: 'Cancha nueva',
      basePrice: 1500,
      priceMultiplier: 1.0,
      features: ['techada'],
      operatingHours: {
        start: '09:00',
        end: '21:00',
        slot_duration: 90,
      },
    }

    it('should create court successfully', async () => {
      const createdCourt = { ...mockCourt, ...createData }
      mockPrisma.court.create.mockResolvedValue(createdCourt)

      const result = await createCourt(createData)

      expect(mockPrisma.court.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: createData.description,
          basePrice: createData.basePrice,
          priceMultiplier: createData.priceMultiplier,
          features: JSON.stringify(createData.features),
          operatingHours: JSON.stringify(createData.operatingHours),
        },
      })
      expect(result).toEqual(createdCourt)
    })

    it('should create court with minimal data', async () => {
      const minimalData = {
        name: 'Cancha Mínima',
        basePrice: 1000,
      }
      const createdCourt = { ...mockCourt, ...minimalData }
      mockPrisma.court.create.mockResolvedValue(createdCourt)

      const result = await createCourt(minimalData)

      expect(mockPrisma.court.create).toHaveBeenCalledWith({
        data: {
          name: minimalData.name,
          description: undefined,
          basePrice: minimalData.basePrice,
          priceMultiplier: 1.0,
          features: JSON.stringify([]),
          operatingHours: JSON.stringify({
            start: "00:00",
            end: "23:00",
            slot_duration: 90
          }),
        },
      })
      expect(result).toEqual(createdCourt)
    })

    it('should throw error when creation fails', async () => {
      const dbError = new Error('Unique constraint violation')
      mockPrisma.court.create.mockRejectedValue(dbError)

      await expect(createCourt(createData)).rejects.toThrow('Error al crear la cancha')
      expect(console.error).toHaveBeenCalledWith('Error creando cancha:', dbError)
    })
  })

  describe('updateCourt', () => {
    const updateData = {
      name: 'Cancha Actualizada',
      basePrice: 1200,
      isActive: false,
    }

    it('should update court successfully', async () => {
      const updatedCourt = { ...mockCourt, ...updateData }
      mockPrisma.court.update.mockResolvedValue(updatedCourt)

      const result = await updateCourt('court-123', updateData)

      expect(mockPrisma.court.update).toHaveBeenCalledWith({
        where: { id: 'court-123' },
        data: updateData,
      })
      expect(result).toEqual(updatedCourt)
    })

    it('should throw error when update fails', async () => {
      const dbError = new Error('Court not found')
      mockPrisma.court.update.mockRejectedValue(dbError)

      await expect(updateCourt('court-123', updateData)).rejects.toThrow('Error al actualizar la cancha')
      expect(console.error).toHaveBeenCalledWith('Error actualizando cancha:', dbError)
    })
  })

  describe('deactivateCourt', () => {
    it('should deactivate court successfully', async () => {
      const deactivatedCourt = { ...mockCourt, isActive: false }
      mockPrisma.court.update.mockResolvedValue(deactivatedCourt)

      const result = await deactivateCourt('court-123')

      expect(mockPrisma.court.update).toHaveBeenCalledWith({
        where: { id: 'court-123' },
        data: { isActive: false },
      })
      expect(result).toEqual(deactivatedCourt)
    })

    it('should throw error when deactivation fails', async () => {
      const dbError = new Error('Court not found')
      mockPrisma.court.update.mockRejectedValue(dbError)

      await expect(deactivateCourt('court-123')).rejects.toThrow('Error al desactivar la cancha')
      expect(console.error).toHaveBeenCalledWith('Error desactivando cancha:', dbError)
    })
  })

  describe('checkCourtAvailability', () => {
    const testDate = new Date('2024-06-15')
    const startTime = '10:00'
    const endTime = '11:30'

    it('should return true when court is available', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null)

      const result = await checkCourtAvailability('court-123', testDate, startTime, endTime)

      expect(result).toBe(true)
      expect(mockPrisma.booking.findFirst).toHaveBeenCalledWith({
        where: {
          courtId: 'court-123',
          bookingDate: testDate,
          status: { not: 'CANCELLED' },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
      })
    })

    it('should return false when court has conflicting bookings', async () => {
      const conflictingBooking = {
        id: 'booking-123',
        courtId: 'court-123',
        startTime: '10:30',
        endTime: '12:00',
        status: 'CONFIRMED',
      }
      mockPrisma.booking.findFirst.mockResolvedValue(conflictingBooking as any)

      const result = await checkCourtAvailability('court-123', testDate, startTime, endTime)

      expect(result).toBe(false)
    })

    it('should throw error when database fails', async () => {
      const dbError = new Error('Database error')
      mockPrisma.booking.findFirst.mockRejectedValue(dbError)

      await expect(
        checkCourtAvailability('court-123', testDate, startTime, endTime)
      ).rejects.toThrow('Error al verificar disponibilidad')
      expect(console.error).toHaveBeenCalledWith('Error verificando disponibilidad:', dbError)
    })
  })
})