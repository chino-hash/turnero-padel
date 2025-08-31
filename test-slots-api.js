// Usar fetch nativo de Node.js (disponible desde Node 18+)

async function testSlotsAPI() {
  const baseUrl = 'http://localhost:3000'
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const courts = ['court-a', 'court-b', 'court-c']
  
  console.log('🧪 Probando API de slots...')
  console.log(`📅 Fecha de prueba: ${today}`)
  console.log(`🏓 Canchas a probar: ${courts.join(', ')}`)
  console.log('\n' + '='.repeat(50))
  
  for (const courtId of courts) {
    console.log(`\n🔍 Probando cancha: ${courtId}`)
    
    try {
      const url = `${baseUrl}/api/slots?courtId=${courtId}&date=${today}`
      console.log(`📡 URL: ${url}`)
      
      const response = await fetch(url)
      const status = response.status
      const statusText = response.statusText
      
      console.log(`📊 Status: ${status} ${statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Respuesta exitosa:`)
        console.log(`   - Slots: ${data.slots?.length || 0}`)
        console.log(`   - Cancha: ${data.courtName || 'N/A'}`)
        console.log(`   - Disponibles: ${data.summary?.open || 0}/${data.summary?.total || 0}`)
      } else {
        const errorData = await response.text()
        console.log(`❌ Error ${status}:`)
        console.log(`   Respuesta: ${errorData}`)
        
        // Intentar parsear como JSON si es posible
        try {
          const jsonError = JSON.parse(errorData)
          console.log(`   Error estructurado:`, jsonError)
        } catch {
          console.log(`   Error como texto plano: ${errorData}`)
        }
      }
      
    } catch (error) {
      console.log(`💥 Error de conexión: ${error.message}`)
    }
    
    console.log('-'.repeat(30))
  }
  
  console.log('\n🏁 Prueba completada')
}

// Ejecutar la prueba
testSlotsAPI().catch(console.error)