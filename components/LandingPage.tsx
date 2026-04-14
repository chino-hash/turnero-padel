'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Session } from 'next-auth'

import Navbar from './landing-page/Navbar'
import Hero from './landing-page/Hero'
import ClubesDestacados from './landing-page/ClubesDestacados'
import ComoFunciona from './landing-page/ComoFunciona'
import Funcionalidades from './landing-page/Funcionalidades'
import ParaClubes from './landing-page/ParaClubes'
import Footer from './landing-page/Footer'

interface Club {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface LandingPageProps {
  session: Session | null
  tenantSlug: string | null
  tenantName: string | null
}

export default function LandingPage({ session, tenantSlug, tenantName }: LandingPageProps) {
  const searchParams = useSearchParams()
  const [clubs, setClubs] = useState<Club[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingClubs, setLoadingClubs] = useState(true)
  const [errorClubs, setErrorClubs] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Verificar si hay errores en la URL (ej: tenant inactivo, no existe)
    const error = searchParams.get('error')
    const slug = searchParams.get('slug')
    
    if (error) {
      switch (error) {
        case 'tenant-not-found':
          setUrlError(`El club "${slug || 'solicitado'}" no existe o no está disponible.`)
          break
        case 'tenant-inactive':
          setUrlError(`El club "${slug || 'solicitado'}" está temporalmente inactivo.`)
          break
        case 'tenant-invalid-slug':
          setUrlError('El enlace del club es inválido.')
          break
        case 'tenant-error':
          setUrlError('Ocurrió un error al acceder al club. Por favor, intenta de nuevo.')
          break
        default:
          setUrlError('Ocurrió un error. Por favor, intenta de nuevo.')
      }
    }
  }, [searchParams])

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoadingClubs(true)
        const response = await fetch(`/api/tenants/public?_t=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Error fetching clubs: ${response.statusText}`)
        }
        const data = await response.json()
        if (data.success) {
          const clubsData: Club[] = data.data || []
          setClubs(clubsData)
        } else {
          throw new Error(data.error || 'Error al cargar clubs')
        }
      } catch (err: any) {
        setErrorClubs(err.message)
        console.error('Failed to fetch clubs:', err)
      } finally {
        setLoadingClubs(false)
      }
    }
    fetchClubs()
  }, [])

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (club.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden font-sans">
      <Navbar scrollY={scrollY} session={session} tenantSlug={tenantSlug} tenantName={tenantName} />
      
      <main>
        <Hero 
          searchQuery={searchTerm} 
          setSearchQuery={setSearchTerm} 
          filteredClubs={filteredClubs} 
        />
        
        <ClubesDestacados 
          filteredClubs={filteredClubs} 
          loadingClubs={loadingClubs} 
          errorClubs={errorClubs} 
          urlError={urlError} 
          setUrlError={setUrlError}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        
        <ComoFunciona />
        <Funcionalidades />
        <ParaClubes />
      </main>
      
      <Footer />
    </div>
  )
}
