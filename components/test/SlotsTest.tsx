'use client'

import React, { useState } from 'react'
import { useSlots, useMultipleSlots } from '@/hooks/useSlots'
import { Court } from '@/types/types'

// Datos de prueba
const testCourts: Court[] = [
  { id: '1', name: 'Cancha 1', type: 'padel', isActive: true },
  { id: '2', name: 'Cancha 2', type: 'padel', isActive: true },
  { id: '3', name: 'Cancha 3', type: 'padel', isActive: true }
]

const SlotsTest: React.FC = () => {
  const [selectedCourtId, setSelectedCourtId] = useState('1')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showMultiple, setShowMultiple] = useState(false)

  // Hook para una sola cancha
  const {
    slots,
    summary,
    loading,
    error,
    fetchSlots,
    clearCache,
    courtName,
    courtId,
    cached,
    responseTime,
    getSlotByTime,
    getAvailableSlots,
    getUnavailableSlots,
    hasSlots,
    availableCount,
    totalCount,
    availabilityRate
  } = useSlots(selectedCourtId, selectedDate)

  // Hook para múltiples canchas
  const {
    slotsByCourt,
    summariesByCourt,
    loading: multipleLoading,
    error: multipleError,
    fetchSlots: fetchMultipleSlots,
    clearAllCache,
    clearCacheForCourt,
    getCacheStats
  } = useMultipleSlots(testCourts, selectedDate)

  const handleFetchSingle = () => {
    const dateStr = formatDate(selectedDate)
    fetchSlots(selectedCourtId, dateStr)
  }

  const handleFetchMultiple = () => {
    const dateStr = formatDate(selectedDate)
    const courtIds = testCourts.map(court => court.id)
    fetchMultipleSlots(courtIds, [dateStr])
  }

  const handleClearCache = async () => {
    try {
      await clearCache()
      console.log('✅ Cache limpiado exitosamente')
    } catch (err) {
      console.error('❌ Error al limpiar cache:', err)
    }
  }

  const handleClearAllCache = async () => {
    try {
      await clearAllCache()
      console.log('✅ Todo el cache limpiado exitosamente')
    } catch (err) {
      console.error('❌ Error al limpiar todo el cache:', err)
    }
  }

  const handleGetCacheStats = async () => {
    try {
      const stats = await getCacheStats()
      console.log('📊 Estadísticas del cache:', stats)
      alert(`Cache Stats:\nTotal: ${stats.totalEntries}\nVálidas: ${stats.validEntries}\nExpiradas: ${stats.expiredEntries}\nTasa de aciertos: ${stats.cacheHitRate}%`)
    } catch (err) {
      console.error('❌ Error al obtener estadísticas:', err)
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Test del Endpoint /api/slots</h1>
      
      {/* Controles */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cancha:</label>
            <select 
              value={selectedCourtId} 
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {testCourts.map(court => (
                <option key={court.id} value={court.id}>{court.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Fecha:</label>
            <input 
              type="date" 
              value={formatDate(selectedDate)}
              onChange={handleDateChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Vista:</label>
            <button 
              onClick={() => setShowMultiple(!showMultiple)}
              className={`w-full p-2 rounded ${showMultiple ? 'bg-blue-500 text-white' : 'bg-white border'}`}
            >
              {showMultiple ? 'Vista Múltiple' : 'Vista Individual'}
            </button>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={showMultiple ? handleFetchMultiple : handleFetchSingle}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={showMultiple ? multipleLoading : loading}
          >
            🔄 Refrescar
          </button>
          
          <button 
            onClick={handleClearCache}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            disabled={loading}
          >
            🗑️ Limpiar Cache
          </button>
          
          <button 
            onClick={handleClearAllCache}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={multipleLoading}
          >
            🗑️ Limpiar Todo
          </button>
          
          <button 
            onClick={handleGetCacheStats}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            📊 Stats Cache
          </button>
        </div>
      </div>

      {!showMultiple ? (
        /* Vista Individual */
        <div>
          <h2 className="text-2xl font-semibold mb-4">Vista Individual - {courtName || selectedCourtId}</h2>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Cargando slots...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {summary && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">📊 Resumen</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Total:</strong> {summary.total}</div>
                <div><strong>Disponibles:</strong> {summary.open}</div>
                <div><strong>Tasa:</strong> {(summary.rate * 100).toFixed(1)}%</div>
                <div><strong>Fecha:</strong> {summary.date}</div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <span className={cached ? 'text-orange-600' : 'text-green-600'}>
                  {cached ? '🟡 Desde cache' : '🟢 Datos frescos'}
                </span>
                <span className="ml-4">⏱️ {responseTime}ms</span>
              </div>
            </div>
          )}
          
          {hasSlots && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">✅ Disponibles ({availableCount})</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {getAvailableSlots().map(slot => (
                    <div key={slot.id} className="bg-green-50 p-2 rounded text-sm">
                      <span className="font-medium">{slot.timeRange || `${slot.startTime} - ${slot.endTime}`}</span>
                      <span className="ml-2 text-green-600">${slot.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-red-600">❌ Ocupados ({totalCount - availableCount})</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {getUnavailableSlots().map(slot => (
                    <div key={slot.id} className="bg-red-50 p-2 rounded text-sm">
                      <span className="font-medium">{slot.timeRange || `${slot.startTime} - ${slot.endTime}`}</span>
                      <span className="ml-2 text-red-600">${slot.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vista Múltiple */
        <div>
          <h2 className="text-2xl font-semibold mb-4">Vista Múltiple - Todas las Canchas</h2>
          
          {multipleLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Cargando slots de todas las canchas...</p>
            </div>
          )}
          
          {multipleError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {multipleError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testCourts.map(court => {
              const courtSlots = slotsByCourt[court.id] || []
              const courtSummary = summariesByCourt[court.id]
              const availableSlots = courtSlots.filter(slot => slot.isAvailable)
              
              return (
                <div key={court.id} className="bg-white border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">{court.name}</h3>
                  
                  {courtSummary && (
                    <div className="bg-gray-50 p-2 rounded mb-3 text-sm">
                      <div>Total: {courtSummary.total}</div>
                      <div>Disponibles: {courtSummary.open}</div>
                      <div>Tasa: {(courtSummary.rate * 100).toFixed(1)}%</div>
                    </div>
                  )}
                  
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {availableSlots.length > 0 ? (
                      availableSlots.map(slot => (
                        <div key={slot.id} className="bg-green-50 p-1 rounded text-xs">
                          {slot.timeRange || `${slot.startTime} - ${slot.endTime}`}
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500 text-xs">Sin horarios disponibles</div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => clearCacheForCourt(court.id)}
                    className="mt-2 px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                  >
                    Limpiar Cache
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default SlotsTest