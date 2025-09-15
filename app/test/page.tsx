'use client'

import { useState } from 'react'
import HomeSection from '../../components/HomeSection'
import MisTurnos from '../../components/MisTurnos'
import type { Booking, Player, TimeSlot } from '../../types/types'

// Función helper para obtener los próximos días
const getNextDays = (count: number) => {
  const days = []
  for (let i = 0; i < count; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    days.push(date)
  }
  return days
}

export default function TestPage() {
  console.log('TestPage renderizándose...')
  
  const [showHome, setShowHome] = useState(true)
  const [showMisTurnos, setShowMisTurnos] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState('cancha-1')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isUnifiedView, setIsUnifiedView] = useState(false)
  const [showOnlyOpen, setShowOnlyOpen] = useState(false)
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Funciones auxiliares para MisTurnos
  const getCurrentBookingStatus = (booking: any): 'active' | 'completed' | 'upcoming' => {
    const now = new Date()
    const bookingDate = new Date(booking.date)
    const [startHour, startMinute] = booking.timeRange.split(' - ')[0].split(' ')[0].split(':')
    const [endHour, endMinute] = booking.timeRange.split(' - ')[1].split(' ')[0].split(':')
    
    const startTime = new Date(bookingDate)
    startTime.setHours(parseInt(startHour), parseInt(startMinute))
    
    const endTime = new Date(bookingDate)
    endTime.setHours(parseInt(endHour), parseInt(endMinute))
    
    if (now >= startTime && now <= endTime) {
      return 'active'
    } else if (now > endTime) {
      return 'completed'
    } else {
      return 'upcoming'
    }
  }

  const getRemainingTime = (booking: any) => {
    const now = new Date()
    const bookingDate = new Date(booking.date)
    const [endHour, endMinute] = booking.timeRange.split(' - ')[1].split(' ')[0].split(':')
    
    const endTime = new Date(bookingDate)
    endTime.setHours(parseInt(endHour), parseInt(endMinute))
    
    if (now <= endTime) {
      const diffMs = endTime.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      
      if (hours > 0) {
        return `${hours}h ${minutes}m restantes`
      } else {
        return `${minutes}m restantes`
      }
    }
    return 'Finalizado'
  }

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "Paid":
      case "Fully Paid":
        return "bg-green-100 text-green-800"
      case "Deposit Paid":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Mock data para HomeSection
  const mockCourts = [
    {
      id: 'cancha-1',
      name: 'Cancha 1',
      description: 'Cancha principal',
      features: ['Iluminación LED', 'Césped sintético'],
      priceMultiplier: 1,
      color: 'blue',
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      id: 'cancha-2',
      name: 'Cancha 2',
      description: 'Cancha secundaria',
      features: ['Iluminación LED'],
      priceMultiplier: 0.8,
      color: 'green',
      bgColor: 'bg-green-500',
      textColor: 'text-green-600'
    }
  ]

  const mockTimeSlots = [
    { id: '1', time: '09:00', available: true },
    { id: '2', time: '10:00', available: false },
    { id: '3', time: '11:00', available: true }
  ]

  // Datos de prueba para MisTurnos
  const mockCurrentBookings = [
    {
      id: '1',
      courtId: 'court-1',
      courtName: 'Cancha 1',
      date: '2024-01-15',
      startTime: '10:00',
      endTime: '11:00',
      timeRange: '10:00 - 11:00',
      location: 'Club Deportivo Central',
      price: 5000,
      totalPrice: 5000,
      deposit: 2500,
      status: 'confirmed' as const,
      paymentStatus: 'Paid' as const,
      type: 'current' as const,
      players: [
        { name: 'Juan Pérez', email: 'juan@email.com', phone: '123456789', isRegistered: true, hasPaid: true },
        { name: 'María García', email: 'maria@email.com', phone: '987654321', isRegistered: true, hasPaid: true }
      ],
      userId: 'user-1',
      createdAt: new Date('2024-01-10T08:00:00Z'),
      updatedAt: new Date('2024-01-10T08:00:00Z')
    }
  ]

  const mockPastBookings = [
    {
      id: '2',
      courtId: 'court-2',
      courtName: 'Cancha 2',
      date: '2024-01-10',
      startTime: '14:00',
      endTime: '15:00',
      timeRange: '14:00 - 15:00',
      location: 'Club Deportivo Central',
      price: 4500,
      totalPrice: 4500,
      deposit: 2250,
      status: 'confirmed' as const,
      paymentStatus: 'Deposit Paid' as const,
      type: 'past' as const,
      players: [
        { name: 'Carlos López', email: 'carlos@email.com', phone: '555123456', isRegistered: true, hasPaid: true },
        { name: 'Ana Martínez', email: 'ana@email.com', phone: '555987654', isRegistered: false, hasPaid: false }
      ],
      userId: 'user-1',
      createdAt: new Date('2024-01-05T08:00:00Z'),
      updatedAt: new Date('2024-01-05T08:00:00Z')
    }
  ]

  const getStatusColor = (status: string, type: string) => {
    if (type === 'current') {
      switch (status) {
        case 'confirmed': return 'text-green-600'
        case 'pending': return 'text-yellow-600'
        case 'cancelled': return 'text-red-600'
        default: return 'text-gray-600'
      }
    }
    return 'text-gray-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Página de Test - Componentes</h1>
        
        <div className="mb-4 space-x-4">
          <button 
            onClick={() => setShowHome(!showHome)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showHome ? 'Ocultar' : 'Mostrar'} HomeSection
          </button>
          
          <button 
            onClick={() => setShowMisTurnos(!showMisTurnos)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {showMisTurnos ? 'Ocultar' : 'Mostrar'} MisTurnos
          </button>
        </div>

        {showHome && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">HomeSection Component</h2>
            <HomeSection
              isVisible={showHome}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              selectedCourt={selectedCourt}
              setSelectedCourt={setSelectedCourt}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              isUnifiedView={isUnifiedView}
              setIsUnifiedView={setIsUnifiedView}
              showOnlyOpen={showOnlyOpen}
              setShowOnlyOpen={setShowOnlyOpen}
              courts={mockCourts}
              ratesByCourt={{ 'cancha-1': 75, 'cancha-2': 60 }}
              timeSlots={mockTimeSlots}
              slotsForRender={mockTimeSlots}
              expandedSlot={expandedSlot}
              setExpandedSlot={setExpandedSlot}
              selectedSlot={selectedSlot}
              setSelectedSlot={setSelectedSlot}
              scrollToNextAvailable={() => {}}
              handleSlotClick={() => {}}
              formatDate={(date) => new Date(date).toLocaleDateString()}
              getAvailableDays={() => getNextDays(4)}
              currentCourtName="Cancha 1"
            />
          </div>
        )}

        {showMisTurnos && (
          <div>
            <h2 className="text-xl font-semibold mb-4">MisTurnos Component</h2>
            <MisTurnos
              isVisible={showMisTurnos}
              isDarkMode={isDarkMode}
              currentBookings={mockCurrentBookings}
              pastBookings={mockPastBookings}
              isLoading={false}
              onBack={() => setShowMisTurnos(false)}
              onOpenCancelModal={(booking) => console.log('Cancel booking:', booking)}
              formatDate={(date) => date}
              getStatusColor={getStatusColor}
              getCurrentBookingStatus={getCurrentBookingStatus}
              getRemainingTime={getRemainingTime}
              getPaymentStatusColor={getPaymentStatusColor}
            />
          </div>
        )}
      </div>
    </div>
  )
}
