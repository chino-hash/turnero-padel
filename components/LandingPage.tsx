'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface Club {
  id: string
  name: string
  slug: string
  description?: string | null
}

export default function LandingPage() {
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingClubs, setLoadingClubs] = useState(true)
  const [errorClubs, setErrorClubs] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si hay errores en la URL
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
        const response = await fetch('/api/tenants/public')
        if (!response.ok) {
          throw new Error(`Error fetching clubs: ${response.statusText}`)
        }
        const data = await response.json()
        if (data.success) {
          setClubs(data.data || [])
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
    club.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F3F4F6] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-gray-800">
        <nav className="container mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="text-3xl font-black tracking-tight">
            Padel<span className="text-[#BEF264]">Listo</span>
          </Link>
          <div className="hidden md:flex space-x-8 items-center">
            <a href="#about" className="text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Sobre Nosotros
            </a>
            <a href="#features" className="text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Funcionalidades
            </a>
            <a href="#testimonials" className="text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Testimonios
            </a>
            <a href="#clubs" className="text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Para Clubes
            </a>
            <Link 
              href="/login?callbackUrl=/dashboard" 
              className="bg-[#BEF264] text-[#0D0D0D] font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-[#BEF264]/50 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(190,242,100,0.5)]"
            >
              Iniciar Sesión
            </Link>
          </div>
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-[#BEF264] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </nav>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0D0D0D] border-t border-gray-800 px-6 py-4 space-y-3">
            <a href="#about" className="block text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Sobre Nosotros
            </a>
            <a href="#features" className="block text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Funcionalidades
            </a>
            <a href="#testimonials" className="block text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Testimonios
            </a>
            <a href="#clubs" className="block text-gray-300 hover:text-[#BEF264] transition-colors font-semibold">
              Para Clubes
            </a>
            <Link 
              href="/login?callbackUrl=/dashboard"
              className="block bg-[#BEF264] text-[#0D0D0D] font-bold py-2.5 px-6 rounded-lg text-center"
            >
              Iniciar Sesión
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="pt-24 md:pt-32">
        <section className="container mx-auto px-6 mt-8 md:mt-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 text-center lg:text-left animate-fade-in">
              <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
                Tu Próximo Partido de Pádel,<br />
                <span className="bg-gradient-to-r from-[#BEF264] to-[#a1d94f] bg-clip-text text-transparent">
                  a un Solo Tap.
                </span>
              </h1>
              <p className="text-xl text-gray-300 mt-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Encuentra canchas disponibles en tu ciudad, reserva en segundos y gestiona todos tus partidos. Padel Listo es la app definitiva para jugadores y clubes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-10">
                <Link 
                  href="/login?callbackUrl=/dashboard"
                  className="bg-[#BEF264] text-[#0D0D0D] font-bold py-4 px-8 rounded-lg shadow-lg hover:shadow-[#BEF264]/50 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(190,242,100,0.5)] text-center"
                >
                  Reservar Ahora
                </Link>
                <a 
                  href="#clubs-list"
                  className="border-2 border-gray-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-gray-800 hover:border-[#BEF264]/50 transition-all duration-300 text-center"
                >
                  Soy un Club
                </a>
              </div>
              {/* Search bar for clubs */}
              <div className="mt-10">
                <div className="max-w-2xl mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Busca tu club..."
                      className="flex-1 bg-[#1A1A1A] border-2 border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#BEF264] focus:outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {searchTerm && filteredClubs.length > 0 && (
                    <div className="mt-4 bg-[#1A1A1A] rounded-lg border border-gray-800 max-h-60 overflow-y-auto">
                      {filteredClubs.map((club) => (
                        <Link
                          key={club.id}
                          href={`/club/${club.slug}`}
                          className="block p-4 hover:bg-[#262626] transition-colors"
                        >
                          <div className="font-semibold">{club.name}</div>
                          {club.description && (
                            <div className="text-sm text-gray-400 mt-1">{club.description}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Columna de Imagen */}
            <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-[#BEF264]/20 blur-3xl rounded-full"></div>
                <img 
                  src="https://placehold.co/350x700/1A1A1A/BEF264?text=App+Preview" 
                  alt="Vista previa de la app Padel Listo" 
                  className="relative rounded-3xl shadow-2xl border-4 border-[#1A1A1A] shadow-[0_0_20px_rgba(190,242,100,0.3)] transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Selección de Club */}
        <section id="clubs-list" className="container mx-auto px-6 mt-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black">
              Selecciona tu <span className="bg-gradient-to-r from-[#BEF264] to-[#a1d94f] bg-clip-text text-transparent">Club</span>
            </h2>
            <p className="text-lg text-gray-400 mt-4">
              Elige el club donde quieres reservar tu cancha
            </p>
          </div>
          
          {/* Mostrar error de URL si existe */}
          {urlError && (
            <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-lg text-red-400 text-center">
              <p className="font-semibold">{urlError}</p>
              <button
                onClick={() => {
                  setUrlError(null)
                  window.history.replaceState({}, '', '/')
                }}
                className="mt-2 text-sm underline hover:text-red-300"
              >
                Cerrar
              </button>
            </div>
          )}
          
          {loadingClubs ? (
            <div className="text-center text-gray-400 py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#BEF264]"></div>
              <p className="mt-4">Cargando clubs...</p>
            </div>
          ) : errorClubs ? (
            <div className="text-center text-red-500 py-12">
              <p>Error: {errorClubs}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 text-[#BEF264] hover:underline"
              >
                Reintentar
              </button>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              {searchTerm ? (
                <>
                  <p>No se encontraron clubs que coincidan con "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="mt-4 text-[#BEF264] hover:underline"
                  >
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                <p>No hay clubs disponibles en este momento.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/club/${club.slug}`}
                  className="bg-[#1A1A1A] p-6 rounded-2xl border-2 border-gray-800 hover:border-[#BEF264]/60 transition-all hover:shadow-[0_0_30px_rgba(190,242,100,0.5)]"
                >
                  <h3 className="text-2xl font-bold mb-2">{club.name}</h3>
                  <p className="text-gray-400 mb-4">{club.description || 'Reserva tu cancha aquí'}</p>
                  <span className="text-[#BEF264] font-semibold">
                    Acceder →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* About Section */}
        <section id="about" className="container mx-auto px-6 mt-32 md:mt-48">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="lg:w-1/2 text-center lg:text-left">
              <span className="text-[#BEF264] font-semibold tracking-wider uppercase text-sm">Sobre Padel Listo</span>
              <h2 className="text-4xl md:text-5xl font-black mt-4 leading-tight">
                Descubre una App Que Te Conecta con el <span className="bg-gradient-to-r from-[#BEF264] to-[#a1d94f] bg-clip-text text-transparent">Mejor Pádel</span> de Tu Ciudad.
              </h2>
              <p className="text-lg text-gray-300 mt-6 leading-relaxed">
                En Padel Listo, combinamos tecnología de vanguardia con una comunidad apasionada. No solo te ofrecemos la forma más rápida de reservar canchas, sino también la oportunidad de conectar con jugadores de tu nivel y formar parte de una red creciente de amantes del pádel.
              </p>
              <p className="text-lg text-gray-300 mt-4 leading-relaxed">
                Desde clubes boutique hasta los centros más grandes, nuestra plataforma digitaliza y optimiza cada aspecto de tu experiencia con el pádel. Únete a miles de jugadores que ya están transformando cómo juegan y gestionan sus partidos.
              </p>
            </div>
            <div className="lg:w-1/2 flex flex-col items-center lg:items-end">
              <div className="bg-[#1A1A1A] border-2 border-[#BEF264]/30 rounded-2xl p-8 max-w-md w-full hover:border-[#BEF264]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(190,242,100,0.3)]">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-[#BEF264]/20 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#BEF264]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-black text-center mb-2">
                  <span className="text-[#BEF264]">+5,000</span> Reservas
                </h3>
                <p className="text-gray-400 text-center mb-6">Confianza de miles de usuarios</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 mt-32 md:mt-48">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[#BEF264] font-semibold tracking-wider uppercase text-sm">Por qué Padel Listo</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">
              Hecho para Jugadores. <span className="bg-gradient-to-r from-[#BEF264] to-[#a1d94f] bg-clip-text text-transparent">Diseñado para Resultados.</span>
            </h2>
            <p className="text-lg text-gray-400 mt-4 leading-relaxed">
              <span className="text-[#BEF264] font-semibold">Reserva</span>, <span className="text-[#BEF264] font-semibold">Conecta</span>, <span className="text-[#BEF264] font-semibold">Juega</span> – Todo lo que necesitas para jugar más y gestionar menos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border-2 border-gray-800 shadow-xl transition-all duration-300 hover:border-[#BEF264]/60 hover:shadow-[0_0_30px_rgba(190,242,100,0.3)] group">
              <div className="w-16 h-16 bg-[#BEF264]/20 rounded-xl flex items-center justify-center group-hover:bg-[#BEF264]/30 transition-colors">
                <svg className="w-8 h-8 text-[#BEF264]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">Reservas en Tiempo Real</h3>
              <p className="text-gray-400 leading-relaxed">Ve la disponibilidad de tus clubes favoritos y reserva tu cancha al instante. Sin llamadas ni esperas. Disponibilidad actualizada en tiempo real.</p>
            </div>

            <div className="bg-[#1A1A1A] p-8 rounded-2xl border-2 border-gray-800 shadow-xl transition-all duration-300 hover:border-[#BEF264]/60 hover:shadow-[0_0_30px_rgba(190,242,100,0.3)] group">
              <div className="w-16 h-16 bg-[#BEF264]/20 rounded-xl flex items-center justify-center group-hover:bg-[#BEF264]/30 transition-colors">
                <svg className="w-8 h-8 text-[#BEF264]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0-3.071-5.137c.372-1.218.499-2.5.499-3.835a2.25 2.25 0 0 0-2.25-2.25c-1.02.003-1.957.348-2.67.926C9.92 7.15 9 8.28 9 9.75c0 1.335.127 2.617.499 3.835a9.094 9.094 0 0 0-3.071 5.137 2.25 2.25 0 0 0 2.25 2.28h10.5a2.25 2.25 0 0 0 2.25-2.28Z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">Arma Partidos</h3>
              <p className="text-gray-400 leading-relaxed">¿Te faltan jugadores? Publica partidos abiertos y encuentra gente de tu nivel para jugar. La comunidad te espera para formar equipos perfectos.</p>
            </div>

            <div className="bg-[#1A1A1A] p-8 rounded-2xl border-2 border-gray-800 shadow-xl transition-all duration-300 hover:border-[#BEF264]/60 hover:shadow-[0_0_30px_rgba(190,242,100,0.3)] group">
              <div className="w-16 h-16 bg-[#BEF264]/20 rounded-xl flex items-center justify-center group-hover:bg-[#BEF264]/30 transition-colors">
                <svg className="w-8 h-8 text-[#BEF264]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6.375c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.75c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Zm6.375-3.75h6.375c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H10.125c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">Pagos Seguros</h3>
              <p className="text-gray-400 leading-relaxed">Paga tu parte de la cancha o la reserva completa directamente desde la app de forma rápida y segura. Múltiples métodos de pago disponibles.</p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="container mx-auto px-6 mt-32 md:mt-48">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#BEF264] font-semibold tracking-wider uppercase text-sm">Testimonios</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">
              Lo Que Dicen <span className="bg-gradient-to-r from-[#BEF264] to-[#a1d94f] bg-clip-text text-transparent">Nuestros Usuarios</span>
            </h2>
            <p className="text-lg text-gray-400 mt-4">
              Miles de jugadores y clubes confían en Padel Listo para gestionar sus partidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border-2 border-gray-800 shadow-xl hover:border-[#BEF264]/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(190,242,100,0.3)]">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-[#BEF264]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 italic">
                "Antes de usar Padel Listo, tenía que llamar a varios clubes para encontrar cancha. Ahora reservo en segundos y siempre encuentro el mejor horario. ¡La app es increíble!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#BEF264]/20 border-2 border-[#BEF264]/30"></div>
                <div>
                  <p className="font-bold text-white">Carlos Martínez</p>
                  <p className="text-sm text-gray-400">Jugador frecuente</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] p-8 rounded-2xl border-2 border-gray-800 shadow-xl hover:border-[#BEF264]/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(190,242,100,0.3)]">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-[#BEF264]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 italic">
                "Como dueño de club, Padel Listo ha transformado nuestra operación. Las reservas se gestionan solas, los pagos son automáticos y nuestros clientes están más satisfechos. Ha aumentado nuestras reservas un 40%."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#BEF264]/20 border-2 border-[#BEF264]/30"></div>
                <div>
                  <p className="font-bold text-white">María González</p>
                  <p className="text-sm text-gray-400">Directora, Padel Club Premium</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] p-8 rounded-2xl border-2 border-gray-800 shadow-xl hover:border-[#BEF264]/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(190,242,100,0.3)]">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-[#BEF264]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 italic">
                "La función de 'Armar Partidos' es genial. Siempre encuentro jugadores de mi nivel y he hecho nuevos amigos. Ahora juego mucho más seguido gracias a la app."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#BEF264]/20 border-2 border-[#BEF264]/30"></div>
                <div>
                  <p className="font-bold text-white">Diego Ramírez</p>
                  <p className="text-sm text-gray-400">Jugador intermedio</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clubs Section */}
        <section id="clubs" className="container mx-auto px-6 mt-32 md:mt-48">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="lg:w-1/2 flex justify-center order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-[#BEF264]/10 blur-3xl rounded-3xl"></div>
                <img src="https://placehold.co/600x400/1A1A1A/BEF264?text=Gesti%C3%B3n+de+Club" 
                     alt="Panel de gestión para clubes de Padel Listo" 
                     className="relative rounded-2xl shadow-2xl border-4 border-[#1A1A1A] shadow-[0_0_20px_rgba(190,242,100,0.3)] transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <div className="lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
              <span className="text-[#BEF264] font-semibold tracking-wider uppercase text-sm">Para Clubes</span>
              <h2 className="text-4xl md:text-5xl font-black mt-4 leading-tight">
                Optimiza tu <span className="bg-gradient-to-r from-[#BEF264] to-[#a1d94f] bg-clip-text text-transparent">Gestión.</span>
              </h2>
              <p className="text-lg text-gray-300 mt-6 leading-relaxed">
                Deja de gestionar reservas por teléfono. Ofrécele a tus clientes una experiencia moderna y centraliza toda tu operación en un solo lugar.
              </p>
              <ul className="space-y-5 mt-8 text-lg">
                <li className="flex items-start gap-4 text-gray-300">
                  <svg className="w-7 h-7 text-[#BEF264] flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span><span className="font-semibold text-white">Calendario de reservas 100% digital.</span> Gestiona todas tus canchas desde una sola plataforma intuitiva.</span>
                </li>
                <li className="flex items-start gap-4 text-gray-300">
                  <svg className="w-7 h-7 text-[#BEF264] flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span><span className="font-semibold text-white">Gestión de pagos y reportes.</span> Automatiza cobros, genera reportes detallados y analiza tu rendimiento.</span>
                </li>
                <li className="flex items-start gap-4 text-gray-300">
                  <svg className="w-7 h-7 text-[#BEF264] flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span><span className="font-semibold text-white">Aumenta tu visibilidad y reduce canchas vacías.</span> Más reservas, menos tiempo gestionando.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section id="download" className="container mx-auto px-6 mt-32 md:mt-48">
          <div className="bg-[#1A1A1A] p-12 md:p-20 rounded-3xl text-center border-2 border-gray-800 shadow-xl hover:border-[#BEF264]/30 transition-all duration-300">
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              ¿Listo para Jugar?
            </h2>
            <p className="text-xl text-gray-300 mt-6 max-w-2xl mx-auto leading-relaxed">
              Descarga Padel Listo hoy mismo y lleva tu juego al siguiente nivel. Disponible en iOS y Android.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-12">
              <a href="#" className="inline-block transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/180x60/444444/FFFFFF?text=App+Store" 
                     alt="Descargar en App Store" 
                     className="h-14 w-auto rounded-lg hover:opacity-90 transition-opacity"
                />
              </a>
              <a href="#" className="inline-block transform hover:scale-105 transition-transform duration-300">
                <img src="https://placehold.co/180x60/444444/FFFFFF?text=Google+Play" 
                     alt="Descargar en Google Play" 
                     className="h-14 w-auto rounded-lg hover:opacity-90 transition-opacity"
                />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="container mx-auto px-6 py-16 mt-24 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <Link href="/" className="text-2xl font-black text-white tracking-tight mb-4 inline-block">
              Padel<span className="text-[#BEF264]">Listo</span>
            </Link>
            <p className="text-gray-400 mt-4 leading-relaxed">
              La app definitiva para reservar canchas de pádel y conectar con jugadores. Tu próximo partido, a un solo tap.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              <li><a href="#about" className="text-gray-400 hover:text-[#BEF264] transition-colors">Sobre Nosotros</a></li>
              <li><a href="#features" className="text-gray-400 hover:text-[#BEF264] transition-colors">Funcionalidades</a></li>
              <li><a href="#testimonials" className="text-gray-400 hover:text-[#BEF264] transition-colors">Testimonios</a></li>
              <li><a href="#clubs" className="text-gray-400 hover:text-[#BEF264] transition-colors">Para Clubes</a></li>
              <li><a href="#download" className="text-gray-400 hover:text-[#BEF264] transition-colors">Descargar</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contacto</h3>
            <div className="space-y-3 text-gray-400">
              <p>
                <span className="text-[#BEF264] font-semibold">Email:</span><br />
                contacto@padellisto.com
              </p>
              <p>
                <span className="text-[#BEF264] font-semibold">Horarios de Atención:</span><br />
                Lunes - Viernes: 9:00 AM - 8:00 PM<br />
                Sábado - Domingo: 10:00 AM - 6:00 PM
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© 2025 Padel Listo. Todos los derechos reservados.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-[#BEF264] transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-[#BEF264] transition-colors">Política de Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

