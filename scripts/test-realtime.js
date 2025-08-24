/**
 * Script de prueba para el sistema de actualizaciones en tiempo real
 * 
 * Este script simula eventos del sistema para probar las notificaciones SSE
 * 
 * Uso:
 * node scripts/test-realtime.js
 */

const http = require('http')

// Configuración
const BASE_URL = 'http://localhost:3000'
const DELAY_BETWEEN_EVENTS = 3000 // 3 segundos

// Función para hacer peticiones HTTP
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          resolve({ status: res.statusCode, data: result })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Función para emitir un evento de prueba
async function emitTestEvent(type, message) {
  try {
    console.log(`🔄 Emitiendo evento: ${type} - ${message}`)
    
    // Simular diferentes tipos de eventos
    switch (type) {
      case 'booking':
        // Simular creación de reserva
        const bookingData = {
          courtId: 'court-a',
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:30',
          playerName: 'Usuario de Prueba',
          playerEmail: 'test@example.com'
        }
        await makeRequest('/api/bookings', 'POST', bookingData)
        break
        
      case 'admin':
        // Simular cambio administrativo
        console.log(`📢 Cambio administrativo simulado: ${message}`)
        break
        
      default:
        console.log(`ℹ️  Evento genérico: ${message}`)
    }
    
    console.log(`✅ Evento emitido correctamente\n`)
  } catch (error) {
    console.error(`❌ Error al emitir evento:`, error.message)
  }
}

// Función para conectarse a SSE y escuchar eventos
function listenToSSE() {
  return new Promise((resolve, reject) => {
    console.log('🔌 Conectando a SSE...')
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/events',
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      console.log('✅ Conectado a SSE\n')
      
      res.on('data', (chunk) => {
        const data = chunk.toString()
        if (data.startsWith('data: ')) {
          try {
            const eventData = JSON.parse(data.substring(6))
            console.log('📨 Evento recibido:', {
              tipo: eventData.type,
              timestamp: new Date(eventData.timestamp).toLocaleTimeString(),
              data: eventData.data
            })
          } catch (e) {
            console.log('📨 Datos SSE:', data.trim())
          }
        }
      })
      
      res.on('end', () => {
        console.log('🔌 Conexión SSE cerrada')
        resolve()
      })
    })
    
    req.on('error', (err) => {
      console.error('❌ Error en conexión SSE:', err.message)
      reject(err)
    })
    
    req.end()
    
    // Mantener la conexión abierta
    return req
  })
}

// Función principal
async function main() {
  console.log('🚀 Iniciando prueba del sistema de tiempo real\n')
  
  // Conectar a SSE en segundo plano
  const ssePromise = listenToSSE()
  
  // Esperar un poco para establecer la conexión
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Secuencia de eventos de prueba
  const testEvents = [
    { type: 'admin', message: 'Sistema de pruebas iniciado' },
    { type: 'booking', message: 'Nueva reserva de prueba' },
    { type: 'admin', message: 'Configuración actualizada' },
    { type: 'admin', message: 'Prueba completada' }
  ]
  
  console.log('📋 Ejecutando secuencia de eventos de prueba...\n')
  
  for (const event of testEvents) {
    await emitTestEvent(event.type, event.message)
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EVENTS))
  }
  
  console.log('✅ Prueba completada. Presiona Ctrl+C para salir.\n')
  
  // Mantener el script corriendo para seguir escuchando eventos
  await ssePromise
}

// Manejo de señales para salida limpia
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando script de prueba...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n👋 Cerrando script de prueba...')
  process.exit(0)
})

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { emitTestEvent, listenToSSE }