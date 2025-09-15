"use client"

import { useRouter } from "next/navigation"

// Componente de botón que mantiene el estilo del h1
export default function AdminTitleButton() {
  const router = useRouter()
  
  const handleClick = () => {
    router.push('/admin-panel/admin')
  }

  return (
    <button
      onClick={handleClick}
      className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
      id="admin-title"
      aria-label="Ir al panel principal de administración"
      title="Panel Principal de Administración"
    >
      Admin
    </button>
  )
}