const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function getBaseLabel(name) {
  if (!name) return 'desconocida'
  const n = name.toLowerCase()
  if (n.includes('cancha 1') || /\b(a)\b/.test(n) || n.startsWith('a')) return 'cancha 1'
  if (n.includes('cancha 2') || /\b(b)\b/.test(n) || n.startsWith('b')) return 'cancha 2'
  if (n.includes('cancha 3') || /\b(c)\b/.test(n) || n.startsWith('c')) return 'cancha 3'
  return n.trim()
}

function safeParseOperatingHours(raw) {
  try {
    if (!raw) return null
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
}

async function cleanupDuplicateCourts() {
  console.log(' Iniciando limpieza de canchas duplicadas...')
  try {
    const courts = await prisma.court.findMany({
      select: { id: true, name: true, isActive: true, createdAt: true, operatingHours: true }
    })

    console.log(' Total de canchas encontradas: ' + courts.length)
    if (courts.length === 0) {
      console.log(' No hay canchas para procesar')
      return
    }

    const groups = new Map()
    for (const court of courts) {
      const label = getBaseLabel(court.name)
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label).push(court)
    }

    const changes = []
    for (const [label, list] of groups.entries()) {
      if (list.length <= 1) continue

      console.log('\n🔍 Grupo duplicado: ' + label + ' (' + list.length + ')')
      list.forEach(function(c) { console.log('   - ' + c.id + ' | ' + c.name + ' | activa=' + c.isActive) })

      const exactMatch = list.find(function(c) { return (c.name || '').toLowerCase() === label })
      const activeExact = exactMatch && exactMatch.isActive ? exactMatch : null
      const byCreatedDesc = list.slice().sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt) })
      const withValidHours = byCreatedDesc.find(function(c) { return safeParseOperatingHours(c.operatingHours) })

      const canonical = activeExact || exactMatch || withValidHours || byCreatedDesc[0]
      console.log('    Canónica: ' + canonical.id + ' | ' + canonical.name)

      for (const c of list) {
        if (c.id === canonical.id) continue
        if (!c.isActive) {
          console.log('    Ya inactiva: ' + c.id + ' | ' + c.name)
          continue
        }
        await prisma.court.update({ where: { id: c.id }, data: { isActive: false } })
        changes.push({ id: c.id, name: c.name, action: 'deactivate' })
        console.log('    Desactivada: ' + c.id + ' | ' + c.name)
      }
    }

    console.log('\n Resumen:')
    if (changes.length === 0) {
      console.log('   No hubo cambios; sin duplicados activos.')
    } else {
      changes.forEach(function(ch) { console.log('   - ' + ch.action + ' -> ' + ch.id + ' | ' + ch.name) })
    }

    const activeCourts = await prisma.court.findMany({ where: { isActive: true }, select: { id: true, name: true } })
    console.log('\n Activas (' + activeCourts.length + '):')
    activeCourts.forEach(function(c) { console.log('   - ' + c.id + ' | ' + c.name) })
  } catch (error) {
    console.error(' Error durante la limpieza:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateCourts()
