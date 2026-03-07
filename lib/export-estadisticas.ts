import type { EstadisticasData } from '@/types/estadisticas'

export function exportToPdf(
  estadisticas: EstadisticasData,
  periodLabel: string
): void {
  const { jsPDF } = require('jspdf')
  const autoTable = require('jspdf-autotable').default
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Informe de Estadísticas', 14, 22)
  doc.setFontSize(11)
  doc.text(`Período: ${periodLabel}`, 14, 30)
  doc.setFontSize(10)

  let y = 40

  doc.setFont(undefined, 'bold')
  doc.text('KPIs principales', 14, y)
  y += 6
  doc.setFont(undefined, 'normal')
  doc.text(`Reservas: ${estadisticas.reservasCount}`, 14, y)
  y += 5
  doc.text(`Ingresos: $${estadisticas.ingresosMes.toLocaleString()}`, 14, y)
  y += 5
  doc.text(`Ocupación: ${estadisticas.ocupacionPromedio}%`, 14, y)
  y += 5
  doc.text(`Usuarios activos: ${estadisticas.usuariosActivos}`, 14, y)
  y += 10

  doc.setFont(undefined, 'bold')
  doc.text('Canchas más utilizadas', 14, y)
  y += 6
  if (estadisticas.canchasMasUsadas.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Cancha', 'Reservas', '%']],
      body: estadisticas.canchasMasUsadas.map((c) => [
        c.nombre,
        String(c.reservas),
        `${c.porcentaje}%`,
      ]),
    })
    y = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont(undefined, 'normal')
    doc.text('Sin datos', 14, y)
    y += 10
  }

  doc.setFont(undefined, 'bold')
  doc.text('Horarios pico', 14, y)
  y += 6
  if (estadisticas.horariosPico.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Horario', 'Reservas']],
      body: estadisticas.horariosPico.map((h) => [h.hora, String(h.reservas)]),
    })
    y = (doc as any).lastAutoTable.finalY + 8
  } else {
    doc.setFont(undefined, 'normal')
    doc.text('Sin datos', 14, y)
    y += 10
  }

  doc.setFont(undefined, 'bold')
  doc.text('Resumen financiero', 14, y)
  y += 6
  doc.setFont(undefined, 'normal')
  doc.text(
    `Total recaudado: $${estadisticas.financiero.totalRecaudado.toLocaleString()}`,
    14,
    y
  )
  y += 5
  doc.text(
    `Saldo pendiente: $${estadisticas.financiero.saldoPendiente.toLocaleString()}`,
    14,
    y
  )
  y += 5
  doc.text(
    `Total reservas (cant.): ${estadisticas.financiero.totalReservas}`,
    14,
    y
  )

  doc.save(`estadisticas-${periodLabel.toLowerCase().replace(/\s/g, '-')}.pdf`)
}

export function exportToExcel(
  estadisticas: EstadisticasData,
  periodLabel: string
): void {
  const XLSX = require('xlsx')

  const wb = XLSX.utils.book_new()

  const kpis = [
    ['KPI', 'Valor'],
    ['Período', periodLabel],
    ['Reservas', estadisticas.reservasCount],
    ['Ingresos', estadisticas.ingresosMes],
    ['Ocupación %', estadisticas.ocupacionPromedio],
    ['Usuarios activos', estadisticas.usuariosActivos],
    ['Tasa cumplimiento %', estadisticas.satisfaccion],
    ['Promedio reservas por usuario', estadisticas.promedioReservasPorUsuario],
  ]
  const wsKpis = XLSX.utils.aoa_to_sheet(kpis)
  XLSX.utils.book_append_sheet(wb, wsKpis, 'KPIs')

  const canchasData = [
    ['Cancha', 'Reservas', '%'],
    ...estadisticas.canchasMasUsadas.map((c) => [
      c.nombre,
      c.reservas,
      `${c.porcentaje}%`,
    ]),
  ]
  const wsCanchas = XLSX.utils.aoa_to_sheet(canchasData)
  XLSX.utils.book_append_sheet(wb, wsCanchas, 'Canchas')

  const horariosData = [
    ['Horario', 'Reservas'],
    ...estadisticas.horariosPico.map((h) => [h.hora, h.reservas]),
  ]
  const wsHorarios = XLSX.utils.aoa_to_sheet(horariosData)
  XLSX.utils.book_append_sheet(wb, wsHorarios, 'Horarios pico')

  const finData = [
    ['Concepto', 'Valor'],
    ['Total recaudado', estadisticas.financiero.totalRecaudado],
    ['Saldo pendiente', estadisticas.financiero.saldoPendiente],
    ['Total reservas', estadisticas.financiero.totalReservas],
  ]
  const wsFin = XLSX.utils.aoa_to_sheet(finData)
  XLSX.utils.book_append_sheet(wb, wsFin, 'Financiero')

  XLSX.writeFile(
    wb,
    `estadisticas-${periodLabel.toLowerCase().replace(/\s/g, '-')}.xlsx`
  )
}
