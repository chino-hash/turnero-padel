'use client'

import { useState, useEffect } from 'react'

interface Court {
  id: string
  name: string
  basePrice: number
  priceMultiplier: number
  isActive: boolean
  description?: string
}

export function useCourtPrices() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener precios iniciales
  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts')
      if (response.ok) {
        const data = await response.json()
        setCourts(data)
        setError(null)
      } else {
        setError('Error al cargar los precios de canchas')
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
      setError('Error de conexión al cargar precios')
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener precio por nombre de cancha
  const getCourtPrice = (courtName: string): number => {
    const court = courts.find(c => c.name === courtName)
    if (!court) return 0
    return (court.basePrice * court.priceMultiplier) / 4 // Precio por persona
  }

  // Función para obtener precio total de la cancha
  const getCourtTotalPrice = (courtName: string): number => {
    const court = courts.find(c => c.name === courtName)
    if (!court) return 0
    return court.basePrice * court.priceMultiplier
  }

  // Función para verificar si una cancha está activa
  const isCourtActive = (courtName: string): boolean => {
    const court = courts.find(c => c.name === courtName)
    return court?.isActive ?? false
  }

  useEffect(() => {
    // Cargar precios iniciales
    fetchCourts()

    // Configurar Server-Sent Events para actualizaciones en tiempo real
    const eventSource = new EventSource('/api/courts/events')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // Escuchar eventos de actualización de canchas del sistema SSE existente
        if (data.action === 'updated' || data.action === 'created' || data.type === 'courtsUpdated') {
          // Actualizar la lista de canchas cuando hay cambios
          fetchCourts()
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      // Reconectar después de un error
      setTimeout(() => {
        fetchCourts()
      }, 5000)
    }

    // Cleanup al desmontar el componente
    return () => {
      eventSource.close()
    }
  }, [])

  return {
    courts,
    loading,
    error,
    getCourtPrice,
    getCourtTotalPrice,
    isCourtActive,
    refetch: fetchCourts
  }
}