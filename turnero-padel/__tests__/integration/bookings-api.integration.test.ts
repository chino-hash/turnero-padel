import { NextRequest } from 'next/server'
import { GET, POST } from '../../app/api/bookings/route'
import { GET as getBookingById, PUT, DELETE } from '../../app/api/bookings/[id]/route'
import { GET as checkAvailability } from '../../app/api/bookings/availability/route'
import { prisma } from '../../lib/prisma'
import { auth } from '../../lib/auth'

// Mock auth
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}))

// Mock rate limiting
jest.mock('../../lib/rate-limit', () => ({
  rateLimit: jest.fn(() => ({ success: true })),
}))

// Mock SSE events
jest.mock('../../lib/sse-events', () => ({
  emitBookingEvent: jest.fn(),
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('Bookings API Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  }

  const mockAdmin = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: mockUser,
      expires: '2024-12-31T23:59:59.999Z',
    })
  })

  describe('GET /api/bookings', () => {
    it('should return paginated bookings with filters', async () => {
      const url = new URL('http://localhost:3000/api/bookings?page=1&limit=10&status=confirmed')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('bookings')
      expect(data).toHaveProperty('pagination')
      expect(data.pagination).toHaveProperty('page', 1)
      expect(data.pagination).toHaveProperty('limit', 10)
    })

    it('should filter bookings by court', async () => {
      const url = new URL('http://localhost:3000/api/bookings?courtId=court-1')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toBeInstanceOf(Array)
    })

    it('should filter bookings by date range', async () => {
      const startDate = '2024-06-01'
      const endDate = '2024-06-30'
      const url = new URL(`http://localhost:3000/api/bookings?startDate=${startDate}&endDate=${endDate}`)
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toBeInstanceOf(Array)
    })

    it('should require authentication', async () => {
      mockAuth.mockResolvedValue(null)
      
      const url = new URL('http://localhost:3000/api/bookings')
      const request = new NextRequest(url)

      const response = await GET(request)
      
      expect(response.status).toBe(401)
    })

    it('should handle admin access to all bookings', async () => {
      mockAuth.mockResolvedValue({
        user: mockAdmin,
        expires: '2024-12-31T23:59:59.999Z',
      })

      const url = new URL('http://localhost:3000/api/bookings')
      const request = new NextRequest(url)

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('bookings')
    })
  })

  describe('POST /api/bookings', () => {
    const validBookingData = {
      courtId: 'court-1',
      bookingDate: '2024-06-15',
      startTime: '10:00',
      endTime: '11:30',
      players: ['Player 1', 'Player 2'],
      notes: 'Test booking',
    }

    it('should create a new booking successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id')
      expect(data.courtId).toBe(validBookingData.courtId)
      expect(data.startTime).toBe(validBookingData.startTime)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        courtId: '',
        bookingDate: '',
        startTime: '',
        endTime: '',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      
      expect(response.status).toBe(400)
    })

    it('should check availability before creating', async () => {
      // First, create a booking
      const request1 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      await POST(request1)

      // Try to create another booking at the same time
      const request2 = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request2)
      
      expect(response.status).toBe(409) // Conflict
    })

    it('should require authentication', async () => {
      mockAuth.mockResolvedValue(null)
      
      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validBookingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/bookings/[id]', () => {
    it('should return booking by id', async () => {
      // First create a booking
      const createRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: 'court-1',
          bookingDate: '2024-06-15',
          startTime: '10:00',
          endTime: '11:30',
          players: ['Player 1'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const createResponse = await POST(createRequest)
      const createdBooking = await createResponse.json()

      // Then get it by id
      const getRequest = new NextRequest(`http://localhost:3000/api/bookings/${createdBooking.id}`)
      const response = await getBookingById(getRequest, { params: { id: createdBooking.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(createdBooking.id)
    })

    it('should return 404 for non-existent booking', async () => {
      const request = new NextRequest('http://localhost:3000/api/bookings/non-existent')
      const response = await getBookingById(request, { params: { id: 'non-existent' } })
      
      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/bookings/[id]', () => {
    it('should update booking successfully', async () => {
      // First create a booking
      const createRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: 'court-1',
          bookingDate: '2024-06-15',
          startTime: '10:00',
          endTime: '11:30',
          players: ['Player 1'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const createResponse = await POST(createRequest)
      const createdBooking = await createResponse.json()

      // Then update it
      const updateData = {
        notes: 'Updated notes',
        status: 'confirmed',
      }

      const updateRequest = new NextRequest(`http://localhost:3000/api/bookings/${createdBooking.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(updateRequest, { params: { id: createdBooking.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notes).toBe(updateData.notes)
      expect(data.status).toBe(updateData.status)
    })

    it('should prevent unauthorized updates', async () => {
      // Create booking with one user
      const createRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: 'court-1',
          bookingDate: '2024-06-15',
          startTime: '10:00',
          endTime: '11:30',
          players: ['Player 1'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const createResponse = await POST(createRequest)
      const createdBooking = await createResponse.json()

      // Try to update with different user
      mockAuth.mockResolvedValue({
        user: { ...mockUser, id: 'different-user' },
        expires: '2024-12-31T23:59:59.999Z',
      })

      const updateRequest = new NextRequest(`http://localhost:3000/api/bookings/${createdBooking.id}`, {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Unauthorized update' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(updateRequest, { params: { id: createdBooking.id } })
      
      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/bookings/[id]', () => {
    it('should delete booking successfully', async () => {
      // First create a booking
      const createRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: 'court-1',
          bookingDate: '2024-06-15',
          startTime: '10:00',
          endTime: '11:30',
          players: ['Player 1'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const createResponse = await POST(createRequest)
      const createdBooking = await createResponse.json()

      // Then delete it
      const deleteRequest = new NextRequest(`http://localhost:3000/api/bookings/${createdBooking.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(deleteRequest, { params: { id: createdBooking.id } })
      
      expect(response.status).toBe(200)

      // Verify it's deleted
      const getRequest = new NextRequest(`http://localhost:3000/api/bookings/${createdBooking.id}`)
      const getResponse = await getBookingById(getRequest, { params: { id: createdBooking.id } })
      
      expect(getResponse.status).toBe(404)
    })
  })

  describe('GET /api/bookings/availability', () => {
    it('should check availability successfully', async () => {
      const url = new URL('http://localhost:3000/api/bookings/availability?courtId=court-1&date=2024-06-15&startTime=10:00&endTime=11:30')
      const request = new NextRequest(url)

      const response = await checkAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('available')
      expect(data).toHaveProperty('alternatives')
      expect(data).toHaveProperty('occupancyStats')
    })

    it('should require all parameters', async () => {
      const url = new URL('http://localhost:3000/api/bookings/availability?courtId=court-1')
      const request = new NextRequest(url)

      const response = await checkAvailability(request)
      
      expect(response.status).toBe(400)
    })

    it('should return alternatives when not available', async () => {
      // First create a booking
      const createRequest = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          courtId: 'court-1',
          bookingDate: '2024-06-15',
          startTime: '10:00',
          endTime: '11:30',
          players: ['Player 1'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      await POST(createRequest)

      // Then check availability for the same slot
      const url = new URL('http://localhost:3000/api/bookings/availability?courtId=court-1&date=2024-06-15&startTime=10:00&endTime=11:30')
      const request = new NextRequest(url)

      const response = await checkAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.available).toBe(false)
      expect(data.alternatives).toBeInstanceOf(Array)
    })
  })
})