'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { MapPin, Star, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Club {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface ClubesDestacadosProps {
  filteredClubs: Club[]
  loadingClubs: boolean
  errorClubs: string | null
  urlError: string | null
  setUrlError: (err: string | null) => void
  searchTerm: string
  setSearchTerm: (query: string) => void
}

const mockExtraData = [
  { imagen: '/club-1.jpg', rating: 4.8, resenas: 124, precioDesde: 3500, canchas: 6, destacado: true },
  { imagen: '/club-2.jpg', rating: 4.9, resenas: 89, precioDesde: 4200, canchas: 4, destacado: false },
  { imagen: '/club-3.jpg', rating: 4.7, resenas: 156, precioDesde: 2800, canchas: 8, destacado: true },
  { imagen: '/club-4.jpg', rating: 4.9, resenas: 67, precioDesde: 5500, canchas: 3, destacado: false },
]

export default function ClubesDestacados({
  filteredClubs,
  loadingClubs,
  errorClubs,
  urlError,
  setUrlError,
  searchTerm,
  setSearchTerm,
}: ClubesDestacadosProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section id="clubes" className="py-10 lg:py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {urlError && (
          <div className="mb-12 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-lg text-red-400 text-center animate-fade-in">
            <p className="font-semibold">{urlError}</p>
            <button
              onClick={() => {
                setUrlError(null)
                window.history.replaceState({}, '', '/')
              }}
              className="mt-2 text-sm underline hover:text-red-300"
            >
              Cerrar alerta
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Badge className="bg-[#BEF264]/10 text-[#BEF264] border-[#BEF264]/30 hover:bg-[#BEF264]/20 border">
              Clubes Destacados
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Selecciona tu <span className="gradient-text">Club</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl">
              Explora los mejores clubes de pádel en tu zona. Todos verificados y con disponibilidad en tiempo real.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="border-white bg-black text-white transition-all duration-300 hover:bg-black hover:text-white hover:border-white hover:shadow-[0_0_18px_rgba(190,242,100,0.75)]"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-white bg-black text-white transition-all duration-300 hover:bg-black hover:text-white hover:border-white hover:shadow-[0_0_18px_rgba(190,242,100,0.75)]"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Loading / Error / Empty States */}
        {loadingClubs ? (
          <div className="text-center text-zinc-400 py-12 animate-pulse">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#BEF264]"></div>
            <p className="mt-4">Buscando clubes disponibles...</p>
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
          <div className="text-center text-zinc-400 py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            {searchTerm ? (
              <>
                <p>No se encontraron clubes que coincidan con "{searchTerm}"</p>
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="mt-4 text-[#BEF264] hover:underline"
                >
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <p>No hay clubes disponibles en este momento.</p>
            )}
          </div>
        ) : (
          /* Carousel */
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredClubs.map((club, index) => {
              // Asignar datos visuales en base al index para la demostración
              const visuals = mockExtraData[index % mockExtraData.length]
              
              return (
                <Link
                  key={club.id}
                  href={`/club/${club.slug}`}
                  className="flex-shrink-0 w-[320px] sm:w-[380px] snap-start group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BEF264] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] rounded-2xl"
                >
                  <div className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 card-hover h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden flex-shrink-0">
                      <img
                        src={visuals.imagen}
                        alt={club.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                      
                      {visuals.destacado && (
                        <Badge className="absolute top-4 left-4 bg-[#BEF264] text-black hover:bg-[#a1d94f] font-semibold">
                          Destacado
                        </Badge>
                      )}
                      
                      <div className="absolute top-4 right-4 flex items-center gap-1 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <Star className="w-4 h-4 text-[#BEF264] fill-[#BEF264]" />
                        <span className="text-sm font-semibold text-white">{visuals.rating}</span>
                        <span className="text-xs text-zinc-400">({visuals.resenas})</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{club.name}</h3>
                        <div className="flex items-center gap-1 text-zinc-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm line-clamp-1">{club.description || 'Ubicación central'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{visuals.canchas} canchas</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500">Desde</p>
                          <p className="text-lg font-bold text-[#BEF264]">
                            ${visuals.precioDesde.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-zinc-800 text-white group-hover:bg-[#BEF264] group-hover:text-black transition-all duration-300 mt-2 rounded-md py-2.5 text-center font-medium">
                        Reservar Ahora
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </div>
    </section>
  )
}
