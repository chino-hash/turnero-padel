'use client'

import { useState, useEffect, useCallback } from 'react'

export interface UsuarioListItem {
  id: string
  name: string | null
  fullName: string | null
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
  reservas: number
  ultimaReserva: string | null
  categoria: 'VIP' | 'Premium' | 'Regular'
}

export interface UsuariosListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UseUsuariosListParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  q?: string
  categoria?: 'VIP' | 'Premium' | 'Regular'
  actividad?: 'activos' | 'inactivos' | 'nuevos'
  tenantId?: string | null
  tenantSlug?: string | null
}

export interface UseUsuariosListReturn {
  data: UsuarioListItem[]
  meta: UsuariosListMeta | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUsuariosList(params: UseUsuariosListParams = {}): UseUsuariosListReturn {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    q = '',
    categoria,
    actividad,
    tenantId,
    tenantSlug,
  } = params

  const [data, setData] = useState<UsuarioListItem[]>([])
  const [meta, setMeta] = useState<UsuariosListMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('page', String(page))
      searchParams.set('limit', String(limit))
      searchParams.set('sortBy', sortBy)
      searchParams.set('sortOrder', sortOrder)
      if (q.trim()) searchParams.set('q', q.trim())
      if (categoria) searchParams.set('categoria', categoria)
      if (actividad) searchParams.set('actividad', actividad)
      if (tenantId) searchParams.set('tenantId', tenantId)
      else if (tenantSlug) searchParams.set('tenantSlug', tenantSlug)

      const res = await fetch(`/api/usuarios?${searchParams.toString()}`, { credentials: 'include' })
      const json = await res.json()

      if (!res.ok) {
        setError(json?.message || json?.error || 'Error al cargar usuarios')
        setData([])
        setMeta(null)
        return
      }
      if (json.success && Array.isArray(json.data)) {
        setData(json.data)
        setMeta(json.meta ?? null)
      } else {
        setData([])
        setMeta(null)
      }
    } catch {
      setError('Error al cargar usuarios')
      setData([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [page, limit, sortBy, sortOrder, q, categoria, actividad, tenantId, tenantSlug])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return { data, meta, loading, error, refetch: fetchList }
}

export default useUsuariosList
