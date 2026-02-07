// Prueba de las funciones de conversión de horas

function hhmmToHour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h + (m || 0) / 60
}

// Función INCORRECTA (actual en el código)
function hourToHHMM_BROKEN(hour) {
  const total = Math.round(hour * 60)
  const hh = Math.floor(total / 60) % 24  // ← PROBLEMA AQUÍ
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

// Función CORRECTA
function hourToHHMM_FIXED(hour) {
  const total = Math.round(hour * 60)
  const hh = Math.floor(total / 60)  // ← SIN % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

console.log('🧪 Probando conversiones de horas...')
console.log('\n=== Función INCORRECTA (actual) ===')

const testHours = [8, 8.5, 9, 10.5, 12, 15.5, 18, 20.5, 23]

testHours.forEach(hour => {
  const result = hourToHHMM_BROKEN(hour)
  console.log(`${hour} horas → ${result}`)
})

console.log('\n=== Función CORRECTA (propuesta) ===')

testHours.forEach(hour => {
  const result = hourToHHMM_FIXED(hour)
  console.log(`${hour} horas → ${result}`)
})

console.log('\n=== Prueba de ida y vuelta ===')
console.log('Convirtiendo "08:00" → hora → HHMM:')
const startTime = "08:00"
const hourValue = hhmmToHour(startTime)
const backToBroken = hourToHHMM_BROKEN(hourValue)
const backToFixed = hourToHHMM_FIXED(hourValue)

console.log(`"${startTime}" → ${hourValue} → "${backToBroken}" (BROKEN)`)
console.log(`"${startTime}" → ${hourValue} → "${backToFixed}" (FIXED)`)

console.log('\n=== Simulación de generación de slots ===')
const startHour = hhmmToHour("08:00")  // 8
const endHour = hhmmToHour("23:00")    // 23
const slotDuration = 1.5               // 90 minutos

console.log(`Parámetros: start=${startHour}, end=${endHour}, duration=${slotDuration}`)

console.log('\nSlots con función BROKEN:')
for (let h = startHour; h + slotDuration <= endHour; h += slotDuration) {
  const start = hourToHHMM_BROKEN(h)
  const end = hourToHHMM_BROKEN(h + slotDuration)
  console.log(`${start} - ${end}`)
  if (h > startHour + 3) break // Solo mostrar algunos
}

console.log('\nSlots con función FIXED:')
for (let h = startHour; h + slotDuration <= endHour; h += slotDuration) {
  const start = hourToHHMM_FIXED(h)
  const end = hourToHHMM_FIXED(h + slotDuration)
  console.log(`${start} - ${end}`)
  if (h > startHour + 3) break // Solo mostrar algunos
}