/**
 * Página principal del panel de administración
 * Redirección en servidor a la sección de turnos
 */
import { redirect } from 'next/navigation'

export default function AdminPage() {
  redirect('/admin-panel/admin/turnos')
}
