 import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Inter } from "next/font/google"
import { Button } from "@/components/ui/button"

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "900"] })

export default async function HomePage() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className={inter.className}>
      <header className="container mx-auto px-6 py-5 bg-[#0D0D0D] text-[#F3F4F6]">
        <nav className="flex justify-between items-center">
          <Link href="#" className="text-3xl font-bold tracking-tight text-[#F3F4F6]">
            Padel<span className="text-[#BEF264]">Book</span>
          </Link>
          <div className="hidden md:flex space-x-6 items-center">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#clubs" className="text-gray-300 hover:text-white transition-colors">Para Clubes</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contacto</a>
            <Button asChild className="bg-[#BEF264] text-[#0D0D0D] font-bold shadow-lg hover:scale-105 transition-transform">
              <a href="#download">Descargar App</a>
            </Button>
          </div>
          <div className="md:hidden flex items-center gap-3">
            <Button asChild className="bg-[#BEF264] text-[#0D0D0D] font-bold">
              <Link href="/login">Reservar</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="bg-[#0D0D0D] text-[#F3F4F6] antialiased">
        <section className="container mx-auto px-6 mt-16 md:mt-24 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
              Tu Próximo Partido de Pádel, <span className="neon-text-gradient">a un Solo Tap.</span>
            </h1>
            <p className="text-lg text-gray-300 mt-6 max-w-lg mx-auto lg:mx-0">
              Encuentra canchas disponibles en tu ciudad, reserva en segundos y gestiona todos tus partidos. PadelBook es la app definitiva para jugadores y clubes.
            </p>
            <div className="flex justify-center lg:justify-start gap-4 mt-10">
              <Button asChild className="bg-[#BEF264] text-[#0D0D0D] font-bold px-8 py-4 rounded-lg shadow-lg hover:shadow-[0_0_30px_rgba(190,242,100,0.3)] transition-all duration-300 transform hover:scale-105">
                <Link href="/login">Reservar Ahora</Link>
              </Button>
              <a href="#clubs" className="border-2 border-gray-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-gray-800 transition-colors">
                Soy un Club
              </a>
            </div>
          </div>
          <div className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center">
            <img
              src="https://placehold.co/350x700/1A1A1A/BEF264?text=App+Preview"
              alt="Vista previa de la app PadelBook en un teléfono"
              className="rounded-3xl shadow-2xl border-4 border-[#1A1A1A]"
            />
          </div>
        </section>

        <section id="about" className="container mx-auto px-6 mt-24 md:mt-32">
          <div className="bg-[#1A1A1A] p-10 rounded-3xl border border-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">Descubre una App Que Te Conecta con el Mejor Pádel de Tu Ciudad</h2>
                <p className="mt-4 text-gray-300">
                  Tecnología ágil y una comunidad activa. Reserva, paga y organiza partidos con facilidad. Optimizada para velocidad y una experiencia premium.
                </p>
                <a href="#features" className="inline-block mt-6 border-2 border-[#BEF264] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#0D0D0D] transition-colors">
                  Lee Más Sobre Nosotros
                </a>
              </div>
              <div className="flex items-center gap-6">
                <div className="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 w-full">
                  <div className="text-2xl font-bold text-[#BEF264]">+5,000</div>
                  <div className="text-gray-400">Reservas gestionadas</div>
                </div>
                <div className="rounded-2xl bg-[#0D0D0D] border border-gray-800 p-6 w-full">
                  <div className="text-2xl font-bold text-[#BEF264]">+50</div>
                  <div className="text-gray-400">Clubes activos</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 mt-32 md:mt-48">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[#BEF264] font-semibold tracking-wider uppercase">Por qué PadelBook</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">Hecho para Jugadores. Diseñado para Resultados.</h2>
            <p className="text-lg text-gray-400 mt-4">Reserva • Conecta • Juega</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800 shadow-xl transition-all duration-300">
              <svg className="w-12 h-12 text-[#BEF264]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008Z" />
              </svg>
              <h3 className="text-2xl font-bold mt-4">Reservas en Tiempo Real</h3>
              <p className="text-gray-400 mt-2">Disponibilidad actualizada y confirmación inmediata sin llamadas ni esperas.</p>
            </div>
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800 shadow-xl transition-all duration-300">
              <svg className="w-12 h-12 text-[#BEF264]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0-3.071-5.137c.372-1.218.499-2.5.499-3.835a2.25 2.25 0 0 0-2.25-2.25c-1.02.003-1.957.348-2.67.926C9.92 7.15 9 8.28 9 9.75c0 1.335.127 2.617.499 3.835a9.094 9.094 0 0 0-3.071 5.137 2.25 2.25 0 0 0 2.25 2.28h10.5a2.25 2.25 0 0 0 2.25-2.28Z" />
              </svg>
              <h3 className="text-2xl font-bold mt-4">Arma Partidos</h3>
              <p className="text-gray-400 mt-2">Publica partidos abiertos y encuentra jugadores de tu nivel.</p>
            </div>
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800 shadow-xl transition-all duration-300">
              <svg className="w-12 h-12 text-[#BEF264]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6.375c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.75c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
              <h3 className="text-2xl font-bold mt-4">Pagos Seguros</h3>
              <p className="text-gray-400 mt-2">Paga tu parte o la reserva completa directamente desde la app.</p>
            </div>
          </div>
        </section>

        <section id="testimonios" className="container mx-auto px-6 mt-32">
          <h2 className="text-4xl font-bold text-center">Lo Que Dicen Nuestros Usuarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-2 text-[#BEF264]">★★★★★</div>
              <p className="mt-4 text-gray-300">Reservé en 30 segundos y el pago fue instantáneo. Experiencia impecable.</p>
              <div className="mt-6 text-sm text-gray-500">Lucía, Jugadora</div>
            </div>
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-2 text-[#BEF264]">★★★★★</div>
              <p className="mt-4 text-gray-300">Desde que usamos PadelBook, redujimos las canchas vacías.</p>
              <div className="mt-6 text-sm text-gray-500">Club Smash, Administrador</div>
            </div>
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-2 text-[#BEF264]">★★★★★</div>
              <p className="mt-4 text-gray-300">Encontré rivales de mi nivel y ahora juego cada semana.</p>
              <div className="mt-6 text-sm text-gray-500">Marcelo, Jugador</div>
            </div>
          </div>
        </section>

        <section id="clubs" className="container mx-auto px-6 mt-32 md:mt-48 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 flex justify-center">
            <img
              src="https://placehold.co/600x400/1A1A1A/BEF264?text=Gestión+de+Club"
              alt="Panel de gestión para clubes de PadelBook"
              className="rounded-2xl shadow-2xl border-4 border-[#1A1A1A]"
            />
          </div>
          <div className="lg:w-1/2 text-center lg:text-left">
            <span className="text-[#BEF264] font-semibold tracking-wider uppercase">Para Clubes</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2">Optimiza tu Gestión.</h2>
            <p className="text-lg text-gray-300 mt-6">
              Centraliza reservas, pagos y reportes. Ofrece una experiencia moderna y reduce canchas vacías.
            </p>
            <ul className="space-y-4 mt-8 text-lg text-gray-400">
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[#BEF264] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                Calendario de reservas 100% digital.
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[#BEF264] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                Gestión de pagos y reportes.
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[#BEF264] flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                Aumenta tu visibilidad y reduce canchas vacías.
              </li>
            </ul>
            <Button asChild variant="outline" className="mt-8 bg-gray-700 text-white font-bold hover:bg-gray-600">
              <Link href="/login">Solicitar Demo</Link>
            </Button>
          </div>
        </section>

        <section id="download" className="container mx-auto px-6 mt-32 md:mt-48">
          <div className="bg-[#1A1A1A] p-12 md:p-20 rounded-3xl text-center border border-gray-800 shadow-xl">
            <h2 className="text-4xl md:text-5xl font-bold">¿Listo para Jugar?</h2>
            <p className="text-lg text-gray-300 mt-4 max-w-xl mx-auto">Descarga PadelBook y lleva tu juego al siguiente nivel. Disponible en iOS y Android.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 mt-10">
              <a href="#" className="inline-block">
                <img src="https://placehold.co/180x60/444444/FFFFFF?text=App+Store" alt="Descargar en App Store" className="store-button-img rounded-lg mx-auto" />
              </a>
              <a href="#" className="inline-block">
                <img src="https://placehold.co/180x60/444444/FFFFFF?text=Google+Play" alt="Descargar en Google Play" className="store-button-img rounded-lg mx-auto" />
              </a>
            </div>
          </div>
        </section>

        <section id="contact" className="container mx-auto px-6 mt-24">
          <div className="bg-[#1A1A1A] p-10 rounded-3xl border border-gray-800">
            <h2 className="text-3xl font-bold">Contacto</h2>
            <p className="mt-2 text-gray-300">¿Tenés dudas o querés una demo? Escribinos.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a href="mailto:agustinagus05@gmail.com" className="inline-flex items-center rounded-lg border border-gray-700 px-5 py-3 text-white hover:bg-gray-800">agustinagus05@gmail.com</a>
              <Link href="/login" className="inline-flex items-center rounded-lg bg-[#BEF264] px-5 py-3 text-[#0D0D0D] font-bold hover:scale-105 transition">Solicitar Demo</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-6 py-12 mt-24 text-gray-500">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left">
            <Link href="#" className="text-2xl font-bold text-white tracking-tight">
              Padel<span className="text-[#BEF264]">Book</span>
            </Link>
            <p className="mt-2 text-sm">© {new Date().getFullYear()} PadelBook. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-6 mt-6 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
