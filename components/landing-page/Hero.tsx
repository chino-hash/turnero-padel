'use client'

import Link from 'next/link'
import { Search, MapPin, Star, Download, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const stats = [
  { value: '+5.000', label: 'Reservas realizadas', icon: Users },
  { value: '4.9', label: 'Rating en App Store', icon: Star },
  { value: '50+', label: 'Clubes asociados', icon: MapPin },
]

interface Club {
  id: string
  name: string
  slug: string
  description?: string | null
}

interface HeroProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredClubs: Club[]
}

export default function Hero({ searchQuery, setSearchQuery, filteredClubs }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-black">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full bg-black">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full">
              <span className="w-2 h-2 bg-[#BEF264] rounded-full animate-pulse" />
              <span className="text-sm text-zinc-300">Reserva en segundos tu cancha</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Tu Próximo Partido de <span className="gradient-text">Pádel</span>,
                <br />
                a un Solo Tap.
              </h1>
              <p className="text-lg sm:text-xl text-zinc-400 max-w-xl">
                Encuentra canchas disponibles en tu ciudad, reserva en segundos y gestiona todos tus partidos. PadelBook es la app definitiva para jugadores y clubes.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-500" />
                </div>
                <Input
                  type="text"
                  placeholder="Busca tu club o zona..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-24 py-6 bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 rounded-xl focus:border-[#BEF264] focus:ring-[#BEF264]/20"
                />
                <Button 
                  onClick={() => { document.getElementById('clubes')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#BEF264] text-black hover:bg-[#a1d94f] font-semibold px-4"
                >
                  Buscar
                </Button>
              </div>

              {/* Autocomplete Dropdown */}
              {searchQuery && filteredClubs.length > 0 && (
                <div className="absolute top-16 left-0 right-0 z-20 bg-[#1A1A1A] border border-gray-800 rounded-lg shadow-xl overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
                  {filteredClubs.map((club) => (
                    <Link
                      key={club.id}
                      href={`/club/${club.slug}`}
                      className="block p-4 hover:bg-[#262626] transition-colors border-b border-gray-800 last:border-0"
                    >
                      <div className="font-semibold text-white">{club.name}</div>
                      {club.description && (
                        <div className="text-sm text-gray-400 mt-1 line-clamp-1">{club.description}</div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>



            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-[#BEF264]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - App Mockup */}
          <div className="relative flex justify-center lg:justify-end animate-float">
            {/* Phone mockup */}
            <div className="relative">
              <img
                src="/app-mockup.png"
                alt="PadelBook App"
                className="w-full max-w-[320px] lg:max-w-[380px] drop-shadow-2xl"
              />
              
              {/* Floating badges */}
              <div className="absolute -left-8 top-1/4 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-xl p-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#BEF264]/20 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-[#BEF264]" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Nueva reserva</p>
                    <p className="text-sm font-semibold text-white">Club Central</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-4 bottom-1/3 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-xl p-3 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Jugadores</p>
                    <p className="text-sm font-semibold text-white">3/4 listos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
