'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Plus, Edit2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Court {
  id: string
  name: string
  base_price: number
  priceMultiplier: number
  isActive: boolean
  description?: string
}

export default function GestionCanchas() {
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    base_price: 0,
    priceMultiplier: 1,
    isActive: true,
    description: ''
  })

  useEffect(() => {
    fetchCourts()
  }, [])

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts')
      if (response.ok) {
        const data = await response.json()
        console.log('Datos de canchas recibidos:', data)
        setCourts(data)
      } else {
        toast.error('Error al cargar las canchas')
      }
    } catch (error) {
      console.error('Error al cargar canchas:', error)
      toast.error('Error al cargar las canchas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando canchas...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Canchas</h1>
            <p className="text-gray-600">Administra las canchas y sus precios</p>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cancha
        </Button>
      </header>

      <div className="grid gap-6">
        {courts.map((court) => (
          <Card key={court.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{court.name}</span>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={court.isActive}
                    onCheckedChange={() => {}}
                  />
                  <span className="text-sm text-gray-500">
                    {court.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio Base</Label>
                  <p className="text-lg font-semibold">${court.base_price.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Multiplicador</Label>
                  <p className="text-lg font-semibold">{court.priceMultiplier}x</p>
                </div>
              </div>
              {court.description && (
                <div className="mt-4">
                  <Label>Descripción</Label>
                  <p className="text-gray-600">{court.description}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}