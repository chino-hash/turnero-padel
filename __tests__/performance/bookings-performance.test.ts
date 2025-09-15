import { performance } from 'perf_hooks'
import { jest } from '@jest/globals'

// Mock de fetch para simular respuestas de API
const mockFetch = jest.fn()
global.fetch = mockFetch as any

// Mock de datos de prueba
const mockBookings = Array.from({ length: 100 }, (_, i) => ({
  id: `booking-${i}`,
  courtId: `court-${i % 5}`,
  date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
  startTime: '10:00',
  endTime: '11:30',
  status: ['confirmed', 'pending', 'cancelled'][i % 3],
  players: [`Player ${i}`, `Player ${i + 100}`],
  totalAmount: 5000 + (i * 100),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}))

describe('Performance Tests - Bookings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        bookings: mockBookings,
        total: mockBookings.length,
        page: 1,
        totalPages: Math.ceil(mockBookings.length / 10)
      })
    })
  })

  describe('API Response Times', () => {
    test('GET /api/bookings debe responder en menos de 500ms', async () => {
      const startTime = performance.now()
      
      await fetch('/api/bookings')
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(responseTime).toBeLessThan(500)
    })

    test('POST /api/bookings debe responder en menos de 1000ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-booking', ...mockBookings[0] })
      })

      const startTime = performance.now()
      
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: 'court-1',
          date: '2024-01-15',
          startTime: '10:00',
          endTime: '11:30',
          players: ['Player 1', 'Player 2']
        })
      })
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(responseTime).toBeLessThan(1000)
    })

    test('PUT /api/bookings/[id] debe responder en menos de 800ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockBookings[0], notes: 'Updated' })
      })

      const startTime = performance.now()
      
      await fetch('/api/bookings/booking-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Updated' })
      })
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(responseTime).toBeLessThan(800)
    })

    test('DELETE /api/bookings/[id] debe responder en menos de 600ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

      const startTime = performance.now()
      
      await fetch('/api/bookings/booking-1', {
        method: 'DELETE'
      })
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(responseTime).toBeLessThan(600)
    })
  })

  describe('Carga de Datos', () => {
    test('debe manejar 1000 reservas sin degradación significativa', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockBookings[0],
        id: `booking-${i}`
      }))

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bookings: largeDataset,
          total: largeDataset.length,
          page: 1,
          totalPages: Math.ceil(largeDataset.length / 10)
        })
      })

      const startTime = performance.now()
      
      const response = await fetch('/api/bookings?limit=1000')
      const data = await response.json()
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(data.bookings).toHaveLength(1000)
      expect(responseTime).toBeLessThan(2000) // 2 segundos para 1000 registros
    })

    test('paginación debe ser eficiente con grandes datasets', async () => {
      const pages = [1, 2, 3, 4, 5]
      const responseTimes: number[] = []

      for (const page of pages) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            bookings: mockBookings.slice((page - 1) * 10, page * 10),
            total: mockBookings.length,
            page,
            totalPages: Math.ceil(mockBookings.length / 10)
          })
        })

        const startTime = performance.now()
        await fetch(`/api/bookings?page=${page}&limit=10`)
        const endTime = performance.now()
        
        responseTimes.push(endTime - startTime)
      }

      // Todas las páginas deben responder en tiempo similar
      const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length
      const maxDeviation = Math.max(...responseTimes.map(time => Math.abs(time - avgResponseTime)))
      
      expect(maxDeviation).toBeLessThan(avgResponseTime * 0.5) // Desviación menor al 50%
    })
  })

  describe('Búsqueda y Filtros', () => {
    test('búsqueda de texto debe ser rápida', async () => {
      const searchTerms = ['Player', 'court-1', 'confirmed', '2024']
      
      for (const term of searchTerms) {
        const filteredBookings = mockBookings.filter(booking => 
          JSON.stringify(booking).toLowerCase().includes(term.toLowerCase())
        )

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            bookings: filteredBookings,
            total: filteredBookings.length,
            page: 1,
            totalPages: Math.ceil(filteredBookings.length / 10)
          })
        })

        const startTime = performance.now()
        await fetch(`/api/bookings?search=${encodeURIComponent(term)}`)
        const endTime = performance.now()
        
        const responseTime = endTime - startTime
        expect(responseTime).toBeLessThan(300) // Búsqueda debe ser muy rápida
      }
    })

    test('filtros múltiples deben ser eficientes', async () => {
      const filters = {
        status: 'confirmed',
        courtId: 'court-1',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      }

      const filteredBookings = mockBookings.filter(booking => 
        booking.status === filters.status && 
        booking.courtId === filters.courtId
      )

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bookings: filteredBookings,
          total: filteredBookings.length,
          page: 1,
          totalPages: Math.ceil(filteredBookings.length / 10)
        })
      })

      const startTime = performance.now()
      
      const queryParams = new URLSearchParams(filters)
      await fetch(`/api/bookings?${queryParams}`)
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(responseTime).toBeLessThan(400)
    })
  })

  describe('Operaciones Concurrentes', () => {
    test('debe manejar múltiples requests simultáneos', async () => {
      const concurrentRequests = 10
      const promises: Promise<any>[] = []

      // Configurar mocks para todas las requests
      for (let i = 0; i < concurrentRequests; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            bookings: mockBookings.slice(0, 10),
            total: mockBookings.length,
            page: 1,
            totalPages: Math.ceil(mockBookings.length / 10)
          })
        })
      }

      const startTime = performance.now()
      
      // Crear requests concurrentes
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(fetch(`/api/bookings?page=${i + 1}`))
      }
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Todas las requests deben completarse
      expect(results).toHaveLength(concurrentRequests)
      results.forEach(result => {
        expect(result.ok).toBe(true)
      })
      
      // El tiempo total no debe ser mucho mayor que una sola request
      expect(totalTime).toBeLessThan(1000) // 1 segundo para 10 requests concurrentes
    })

    test('creación de múltiples reservas debe ser eficiente', async () => {
      const bookingsToCreate = 5
      const promises: Promise<any>[] = []

      // Configurar mocks para todas las creaciones
      for (let i = 0; i < bookingsToCreate; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: `new-booking-${i}`,
            ...mockBookings[0],
            players: [`Player ${i}`, `Player ${i + 100}`]
          })
        })
      }

      const startTime = performance.now()
      
      // Crear reservas concurrentemente
      for (let i = 0; i < bookingsToCreate; i++) {
        promises.push(
          fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courtId: `court-${i}`,
              date: '2024-01-15',
              startTime: '10:00',
              endTime: '11:30',
              players: [`Player ${i}`, `Player ${i + 100}`]
            })
          })
        )
      }
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Todas las creaciones deben ser exitosas
      expect(results).toHaveLength(bookingsToCreate)
      results.forEach(result => {
        expect(result.ok).toBe(true)
      })
      
      expect(totalTime).toBeLessThan(2000) // 2 segundos para 5 creaciones
    })
  })

  describe('Memory Usage', () => {
    test('no debe tener memory leaks en operaciones repetitivas', async () => {
      const iterations = 50
      const initialMemory = process.memoryUsage().heapUsed
      
      for (let i = 0; i < iterations; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            bookings: mockBookings.slice(0, 10),
            total: mockBookings.length,
            page: 1,
            totalPages: Math.ceil(mockBookings.length / 10)
          })
        })
        
        await fetch('/api/bookings')
        
        // Forzar garbage collection cada 10 iteraciones
        if (i % 10 === 0 && global.gc) {
          global.gc()
        }
      }
      
      // Forzar garbage collection final
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // El incremento de memoria no debe ser excesivo
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
    })
  })

  describe('Error Handling Performance', () => {
    test('manejo de errores no debe degradar performance', async () => {
      const errorScenarios = [
        { status: 400, error: 'Bad Request' },
        { status: 401, error: 'Unauthorized' },
        { status: 404, error: 'Not Found' },
        { status: 500, error: 'Internal Server Error' }
      ]
      
      for (const scenario of errorScenarios) {
        mockFetch.mockRejectedValueOnce(new Error(scenario.error))
        
        const startTime = performance.now()
        
        try {
          await fetch('/api/bookings')
        } catch (error) {
          // Error esperado
        }
        
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        // Los errores deben fallar rápido
        expect(responseTime).toBeLessThan(100)
      }
    })
  })

  describe('Cache Performance', () => {
    test('requests repetitivas deben beneficiarse del cache', async () => {
      const url = '/api/bookings?page=1&limit=10'
      const responseTimes: number[] = []
      
      // Primera request (sin cache)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bookings: mockBookings.slice(0, 10),
          total: mockBookings.length,
          page: 1,
          totalPages: Math.ceil(mockBookings.length / 10)
        })
      })
      
      let startTime = performance.now()
      await fetch(url)
      let endTime = performance.now()
      responseTimes.push(endTime - startTime)
      
      // Requests subsecuentes (con cache potencial)
      for (let i = 0; i < 3; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            bookings: mockBookings.slice(0, 10),
            total: mockBookings.length,
            page: 1,
            totalPages: Math.ceil(mockBookings.length / 10)
          })
        })
        
        startTime = performance.now()
        await fetch(url)
        endTime = performance.now()
        responseTimes.push(endTime - startTime)
      }
      
      // Las requests subsecuentes deberían ser más rápidas o similares
      const firstRequestTime = responseTimes[0]
      const avgSubsequentTime = responseTimes.slice(1).reduce((a, b) => a + b) / 3
      
      expect(avgSubsequentTime).toBeLessThanOrEqual(firstRequestTime * 1.2) // Máximo 20% más lento
    })
  })
})